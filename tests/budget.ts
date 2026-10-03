// `pnpm budget`: orçamento de peso e regras de publicação sobre dist/ (skill portoes-de-qualidade
// §3). Mede só o que algum HTML de dist/ referencia, nunca a pasta dist/_astro inteira: o
// @astrojs/react emite um client.*.js (~220 KB) que ninguém baixa e reprovaria um site correto.
//
// Uso: pnpm build && pnpm budget            (sai com código 1 se algum portão estourar)
//      pnpm budget --draft <slug>           (confere também um slug de draft de teste, CA-09)
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, posix, relative } from "node:path";
import { gzipSync } from "node:zlib";
import { projectSlugs, ROOT } from "./support/content";

const DIST = join(ROOT, "dist");
const SITE = "https://yuri-jorge.up.railway.app";
const KB = 1024;

const BUDGET = {
  themeScript: 1 * KB, // RNF-02: o único JS bloqueante, inline, bruto
  paintJs: 10 * KB, // gz, por página, antes de rolar
  islandsJs: 60 * KB, // gz, união das ilhas de todas as páginas
  css: 30 * KB, // gz, por página e união
  image: 200 * KB, // bruto, maior imagem servida
};

type Gate = { name: string; ok: boolean; detail: string; warn?: boolean };
const gates: Gate[] = [];
const gate = (name: string, ok: boolean, detail: string) => gates.push({ name, ok, detail });
const warn = (name: string, detail: string) => gates.push({ name, ok: true, detail, warn: true });

const gz = (data: string | Buffer) => gzipSync(data).length;
const fmt = (bytes: number) => `${(bytes / KB).toFixed(1)} KB`;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

if (!existsSync(DIST)) {
  console.error("dist/ não existe: rode `pnpm build` antes do `pnpm budget`.");
  process.exit(1);
}

const files = walk(DIST);
const htmlFiles = files.filter((f) => f.endsWith(".html"));
const urlOf = (file: string) => `/${relative(DIST, file).split("\\").join("/")}`;

// URL do site → arquivo em dist/. Aceita absoluta do próprio site; ignora externa e data:.
function distFile(url: string, from = "/"): string | null {
  let path = url.trim();
  if (path.startsWith(SITE)) path = path.slice(SITE.length);
  if (/^(https?:)?\/\//.test(path) || path.startsWith("data:") || path.startsWith("#")) return null;
  path = path.split(/[?#]/)[0] ?? "";
  if (!path) return null;
  const absolute = path.startsWith("/") ? path : posix.join(posix.dirname(from), path);
  return join(DIST, decodeURIComponent(absolute));
}

// ---------------------------------------------------------------------------------------------
// HTML: scripts, estilos e referências
type Tag = { attrs: Record<string, string>; body: string };

function attrsOf(raw: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (const m of raw.matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
    const key = m[1]?.toLowerCase();
    if (key) attrs[key] = m[2] ?? m[3] ?? m[4] ?? "";
  }
  return attrs;
}

const scriptsIn = (html: string): Tag[] =>
  [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].map((m) => ({
    attrs: attrsOf(m[1] ?? ""),
    body: m[2] ?? "",
  }));

const isExecutable = (tag: Tag) => {
  const type = (tag.attrs.type ?? "").toLowerCase();
  return type === "" || type === "module" || type.includes("javascript");
};
const isBlocking = (tag: Tag) =>
  isExecutable(tag) &&
  (tag.attrs.type ?? "").toLowerCase() !== "module" &&
  !("async" in tag.attrs) &&
  !("defer" in tag.attrs);

// ---------------------------------------------------------------------------------------------
// Grafo de módulos JS: segue os imports que o próprio arquivo declara.
const IMPORT_RE = /(?:\bfrom\s*|\bimport\s*)(\(\s*)?["']([^"']+\.m?js)["']/g;
const VITE_DEPS_RE = /["'](\/?_astro\/[^"']+\.m?js)["']/g;

function importsOf(file: string): { static: string[]; dynamic: string[] } {
  const code = readFileSync(file, "utf8");
  const from = urlOf(file);
  const result = { static: [] as string[], dynamic: [] as string[] };
  for (const m of code.matchAll(IMPORT_RE)) {
    const target = distFile(m[2] ?? "", from);
    if (target) (m[1] ? result.dynamic : result.static).push(target);
  }
  for (const m of code.matchAll(VITE_DEPS_RE)) {
    const target = distFile(`/${(m[1] ?? "").replace(/^\//, "")}`);
    if (target) result.dynamic.push(target);
  }
  return result;
}

function closure(seeds: string[], followDynamic: boolean): Set<string> {
  const seen = new Set<string>();
  const queue = [...seeds];
  while (queue.length > 0) {
    const file = queue.pop();
    if (!file || seen.has(file)) continue;
    seen.add(file);
    if (!existsSync(file)) continue;
    const { static: s, dynamic: d } = importsOf(file);
    queue.push(...s, ...(followDynamic ? d : []));
  }
  return seen;
}

const missingRefs: string[] = [];
const sizeGz = (set: Iterable<string>) => {
  let total = 0;
  for (const file of set) {
    if (!existsSync(file)) {
      missingRefs.push(urlOf(file));
      continue;
    }
    total += gz(readFileSync(file));
  }
  return total;
};

// ---------------------------------------------------------------------------------------------
// 1. JS bloqueante no <head> e 2. JS de pintura × ilhas, 3. CSS
const islandUnion = new Set<string>();
const paintUnion = new Set<string>();
const cssUnion = new Set<string>();
const paintReport: string[] = [];
const cssReport: string[] = [];
let worstPaint = 0;
let worstCss = 0;

for (const file of htmlFiles) {
  const html = readFileSync(file, "utf8");
  const page = urlOf(file);
  const head = /<head\b[^>]*>([\s\S]*?)<\/head>/i.exec(html)?.[1] ?? "";

  // 1. No <head>, só o script de tema pode bloquear.
  const blocking = scriptsIn(head).filter(isBlocking);
  const external = blocking.filter((s) => s.attrs.src !== undefined);
  const inline = blocking.filter((s) => s.attrs.src === undefined);
  const theme = inline.filter((s) => /data-?theme|dataset\.theme/.test(s.body));
  // Zero também vale (a página-fonte do CV não tem troca de tema).
  const okHead =
    external.length === 0 &&
    inline.length <= 1 &&
    theme.length === inline.length &&
    Buffer.byteLength(theme[0]?.body ?? "") <= BUDGET.themeScript;
  gate(
    `head sem JS bloqueante além do tema · ${page}`,
    okHead,
    `${inline.length} inline (tema: ${theme.length}, ${Buffer.byteLength(theme[0]?.body ?? "")} B), ${external.length} com src`,
  );

  // 2. JS: o que a página baixa na pintura × o que só a ilha baixa.
  const scripts = scriptsIn(html).filter(isExecutable);
  const paintSeeds = [
    ...scripts.flatMap((s) => (s.attrs.src ? [distFile(s.attrs.src, page)] : [])),
    ...[...html.matchAll(/<link\b([^>]*)>/gi)]
      .map((m) => attrsOf(m[1] ?? ""))
      .filter((a) => (a.rel ?? "").split(/\s+/).includes("modulepreload"))
      .map((a) => distFile(a.href ?? "", page)),
  ].filter((f): f is string => f !== null);
  // Módulos importados por scripts inline (o Astro pode inlinar um <script type=module> curto).
  for (const s of scripts.filter((s) => !s.attrs.src)) {
    for (const m of s.body.matchAll(IMPORT_RE)) {
      const target = distFile(m[2] ?? "", page);
      if (target) (m[1] ? [] : paintSeeds).push(target);
    }
  }
  const islandSeeds = [...html.matchAll(/<astro-island\b([^>]*)>/gi)]
    .map((m) => attrsOf(m[1] ?? ""))
    .flatMap((a) => [a["component-url"], a["renderer-url"], a["before-hydration-url"]])
    .filter((u): u is string => Boolean(u))
    .map((u) => distFile(u, page))
    .filter((f): f is string => f !== null);

  const paint = closure(paintSeeds, false);
  const inlineGz = scripts.filter((s) => !s.attrs.src).reduce((sum, s) => sum + gz(s.body), 0);
  const paintGz = sizeGz(paint) + inlineGz;
  worstPaint = Math.max(worstPaint, paintGz);
  paintReport.push(`${page} ${fmt(paintGz)} (inline ${fmt(inlineGz)}, ${paint.size} módulo(s))`);
  for (const f of paint) paintUnion.add(f);
  for (const f of closure(islandSeeds, true)) islandUnion.add(f);

  // 3. CSS da página: <link rel=stylesheet> + <style> inline.
  const cssFiles = [...html.matchAll(/<link\b([^>]*)>/gi)]
    .map((m) => attrsOf(m[1] ?? ""))
    .filter((a) => (a.rel ?? "").split(/\s+/).includes("stylesheet"))
    .map((a) => distFile(a.href ?? "", page))
    .filter((f): f is string => f !== null);
  const inlineCss = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)]
    .map((m) => m[1] ?? "")
    .join("\n");
  const cssGz = sizeGz(cssFiles) + (inlineCss ? gz(inlineCss) : 0);
  worstCss = Math.max(worstCss, cssGz);
  cssReport.push(`${page} ${fmt(cssGz)}`);
  for (const f of cssFiles) cssUnion.add(f);
}

gate(
  `JS na pintura ≤ ${fmt(BUDGET.paintJs)} gz por página`,
  worstPaint <= BUDGET.paintJs,
  `pior ${fmt(worstPaint)} · ${paintReport.join(" · ")}`,
);

// Só da ilha: o que a ilha puxa e a pintura não puxou.
const islandOnly = [...islandUnion].filter((f) => !paintUnion.has(f));
const islandGz = sizeGz(islandOnly);
gate(
  `JS das ilhas ≤ ${fmt(BUDGET.islandsJs)} gz`,
  islandGz <= BUDGET.islandsJs,
  `${fmt(islandGz)} em ${islandOnly.length} arquivo(s): ${
    islandOnly
      .map((f) => `${urlOf(f)} ${fmt(gz(existsSync(f) ? readFileSync(f) : ""))}`)
      .join(", ") || "nenhuma ilha"
  }`,
);

const cssUnionGz = sizeGz(cssUnion);
gate(
  `CSS ≤ ${fmt(BUDGET.css)} gz (por página e união)`,
  worstCss <= BUDGET.css && cssUnionGz <= BUDGET.css,
  `união ${fmt(cssUnionGz)} em ${cssUnion.size} arquivo(s); pior página ${fmt(worstCss)}`,
);

// ---------------------------------------------------------------------------------------------
// 4. Imagens referenciadas (HTML, props de ilha, CSS)
const IMAGE_EXT = /\.(avif|webp|png|jpe?g|gif|svg)$/i;
const IMAGE_REF_RE =
  /(?:https?:\/\/[^\s"'()<>,]+|\/[^\s"'()<>,]+)\.(?:avif|webp|png|jpe?g|gif|svg)(?=[\s"'(),?#&]|$)/gi;
const referencedImages = new Map<string, Set<string>>();
const legacyInImg: string[] = [];

const addImageRef = (url: string, page: string) => {
  const file = distFile(url.replace(/&quot;|&#34;/g, ""), page);
  if (!file) return;
  if (!referencedImages.has(file)) referencedImages.set(file, new Set());
  referencedImages.get(file)?.add(page);
};

for (const file of htmlFiles) {
  const html = readFileSync(file, "utf8")
    .replace(/&quot;|&#34;/g, '"')
    .replace(/\\\//g, "/");
  const page = urlOf(file);
  for (const m of html.matchAll(IMAGE_REF_RE)) addImageRef(m[0], page);
  // RNF-02: <img>/<source> de conteúdo em AVIF/WebP. PNG/JPG só fora disso (og:image, ícone).
  for (const m of html.matchAll(/<(img|source)\b([^>]*)>/gi)) {
    const a = attrsOf(m[2] ?? "");
    const urls = [a.src, ...(a.srcset ?? "").split(",").map((c) => c.trim().split(/\s+/)[0])];
    for (const url of urls) {
      if (url && /\.(png|jpe?g|gif)$/i.test(url.split("?")[0] ?? ""))
        legacyInImg.push(`${page} ${url}`);
    }
  }
}
for (const css of cssUnion) {
  if (!existsSync(css)) continue;
  for (const m of readFileSync(css, "utf8").matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) {
    if (IMAGE_EXT.test(m[1] ?? "")) addImageRef(m[1] ?? "", urlOf(css));
  }
}

const broken = [...referencedImages.keys()].filter((f) => !existsSync(f));
const sized = [...referencedImages.keys()]
  .filter((f) => existsSync(f))
  .map((f) => ({ url: urlOf(f), bytes: statSync(f).size }))
  .sort((a, b) => b.bytes - a.bytes);
const over = sized.filter((s) => s.bytes > BUDGET.image);
gate(
  `maior imagem servida ≤ ${fmt(BUDGET.image)}`,
  over.length === 0,
  `${sized.length} imagem(ns); maior ${sized[0] ? `${sized[0].url} ${fmt(sized[0].bytes)}` : "—"}${over.length ? `; acima: ${over.map((o) => `${o.url} ${fmt(o.bytes)}`).join(", ")}` : ""}`,
);
gate(
  "nenhuma referência de imagem quebrada",
  broken.length === 0,
  broken.map(urlOf).join(", ") || "ok",
);
if (legacyInImg.length > 0) {
  warn(
    "RNF-02: <img>/<source> em PNG/JPG (esperado AVIF/WebP)",
    [...new Set(legacyInImg)].join(", "),
  );
}
const unreferencedHeavy = files
  .filter((f) => IMAGE_EXT.test(f) && !referencedImages.has(f) && statSync(f).size > BUDGET.image)
  .map((f) => `${urlOf(f)} ${fmt(statSync(f).size)}`);
if (unreferencedHeavy.length > 0) {
  warn(
    "imagens > 200 KB em dist/ que nenhum HTML referencia (não são baixadas)",
    unreferencedHeavy.join(", "),
  );
}
if (missingRefs.length > 0) {
  gate("nenhum JS/CSS referenciado ausente de dist/", false, [...new Set(missingRefs)].join(", "));
}

// ---------------------------------------------------------------------------------------------
// 5. CA-09 / RN-03: draft fora de dist/ e do sitemap
const extraDraft = process.argv.indexOf("--draft");
const drafts = [
  ...projectSlugs().drafts,
  ...(extraDraft > -1 && process.argv[extraDraft + 1]
    ? [process.argv[extraDraft + 1] as string]
    : []),
];
const textFiles = files.filter((f) => /\.(html|xml|txt|json|js|css|svg|webmanifest)$/i.test(f));
if (drafts.length === 0) {
  gate(
    "CA-09: draft fora de dist/ e do sitemap",
    true,
    "nenhum projeto draft no conteúdo; nada a procurar",
  );
} else {
  const leaks: string[] = [];
  for (const slug of drafts) {
    for (const dir of [`projects/${slug}`, `pt/projects/${slug}`]) {
      if (existsSync(join(DIST, dir))) leaks.push(`dist/${dir}/`);
    }
    for (const f of textFiles) {
      if (readFileSync(f, "utf8").includes(`/projects/${slug}`))
        leaks.push(`${urlOf(f)} cita /projects/${slug}`);
    }
  }
  gate(
    `CA-09: draft fora de dist/ e do sitemap (${drafts.join(", ")})`,
    leaks.length === 0,
    leaks.join(", ") || "ok",
  );
}

// ---------------------------------------------------------------------------------------------
// 6. RN-07: o telefone não aparece no site nem no repositório. O número não é escrito aqui (seria
// ele mesmo um vazamento no repositório): compara-se o SHA-256 de janelas de dígitos.
const PHONE_SHA256 = new Set([
  "8c1ac8904a339e3a9f308af76475010f80901113f9c1277a162162ed92795d58", // 9 dígitos, com o 9
  "adba0d81f3034f625e0559ea0cfab8638f029061c93dd3c4c37e3ca1c2b7c04d", // 8 dígitos, formato antigo
]);
const sha = (s: string) => createHash("sha256").update(s).digest("hex");

function hasPhone(text: string): boolean {
  // Sequências de dígitos com separadores comuns de telefone: "(00) 9 0000-0000", "+55 00 …".
  for (const m of text.matchAll(/\+?\d[\d\s().-]{6,24}\d/g)) {
    const digits = m[0].replace(/\D/g, "");
    if (digits.length < 8 || digits.length > 15) continue;
    for (const size of [9, 8]) {
      for (let i = 0; i + size <= digits.length; i += 1) {
        if (PHONE_SHA256.has(sha(digits.slice(i, i + size)))) return true;
      }
    }
  }
  return false;
}

const phoneHits: string[] = [];
for (const f of textFiles) if (hasPhone(readFileSync(f, "utf8"))) phoneHits.push(`dist${urlOf(f)}`);

const pdfs = files.filter((f) => f.endsWith(".pdf"));
let pdfNote = `${pdfs.length} PDF(s) lidos com pdftotext`;
for (const pdf of pdfs) {
  try {
    const text = execFileSync("pdftotext", ["-layout", pdf, "-"], { stdio: "pipe" }).toString();
    if (hasPhone(text)) phoneHits.push(`dist${urlOf(pdf)}`);
  } catch {
    pdfNote = "pdftotext indisponível: PDFs NÃO conferidos";
  }
}

let repoNote = "";
try {
  const tracked = execFileSync(
    "git",
    ["ls-files", "-z", "--cached", "--others", "--exclude-standard"],
    {
      cwd: ROOT,
      stdio: "pipe",
      maxBuffer: 64 * 1024 * 1024,
    },
  )
    .toString()
    .split("\0")
    .filter(Boolean);
  let scanned = 0;
  for (const rel of tracked) {
    const path = join(ROOT, rel);
    if (!existsSync(path) || statSync(path).size > 5 * 1024 * 1024) continue;
    const buffer = readFileSync(path);
    if (extname(rel).toLowerCase() === ".pdf") {
      try {
        const text = execFileSync("pdftotext", ["-layout", path, "-"], {
          stdio: "pipe",
        }).toString();
        if (hasPhone(text)) phoneHits.push(rel);
      } catch {
        // sem pdftotext: o PDF fica fora da varredura do repo (avisado acima)
      }
      scanned += 1;
      continue;
    }
    if (buffer.includes(0)) continue; // binário (imagem, fonte)
    scanned += 1;
    if (hasPhone(buffer.toString("utf8"))) phoneHits.push(rel);
  }
  repoNote = `${scanned} arquivo(s) do repositório`;
} catch {
  repoNote = "git indisponível: repositório NÃO conferido";
}
gate(
  "RN-07: telefone ausente de dist/ e do repositório",
  phoneHits.length === 0,
  phoneHits.length
    ? `encontrado em: ${phoneHits.join(", ")}`
    : `${textFiles.length} texto(s) de dist/, ${pdfNote}, ${repoNote}`,
);

// ---------------------------------------------------------------------------------------------
const pad = (s: string, n: number) => (s.length >= n ? s : s + " ".repeat(n - s.length));
let failed = 0;
// As linhas por página do head só aparecem quando falham, para o relatório caber na tela.
const headGates = gates.filter((g) => g.name.startsWith("head sem JS"));
const headFailed = headGates.filter((g) => !g.ok);
const shown = [
  ...(headFailed.length
    ? headFailed
    : [
        {
          name: "head sem JS bloqueante além do tema (≤ 1 KB)",
          ok: true,
          detail: `${headGates.length} página(s): ${headGates[0]?.detail ?? ""}`,
        },
      ]),
  ...gates.filter((g) => !g.name.startsWith("head sem JS")),
];
for (const g of shown) {
  const mark = g.warn ? "AVISO" : g.ok ? "ok" : "FALHOU";
  if (!g.ok) failed += 1;
  console.log(`${pad(mark, 7)} ${g.name}\n        ${g.detail}`);
}
console.log(
  `\n${htmlFiles.length} HTML em dist/. ${failed === 0 ? "Orçamento OK." : `${failed} portão(ões) estourado(s).`}`,
);
process.exit(failed === 0 ? 0 : 1);
