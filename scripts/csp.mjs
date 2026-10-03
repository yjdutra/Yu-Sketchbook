// RNF-06: o Astro injeta scripts inline (runtime de ilha, script de tema) cujo conteúdo muda com
// a versão. Hash escrito à mão envelhece em silêncio e o tema volta a piscar; este script lê o que
// de fato saiu no build e imprime a diretiva do Caddy (o Dockerfile grava em csp.caddy).
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return walk(path);
    return path.endsWith(".html") ? [path] : [];
  });

const hashes = new Set();
for (const file of walk("dist")) {
  const html = readFileSync(file, "utf8");
  for (const [, body] of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)) {
    if (body?.trim()) hashes.add(`'sha256-${createHash("sha256").update(body).digest("base64")}'`);
  }
}

// Todo HTML tem ao menos o script de tema (RF-07). Zero hashes quer dizer que a leitura falhou, e
// uma CSP sem o hash dele bloquearia o script em produção: melhor quebrar o build aqui.
if (hashes.size === 0) {
  console.error("csp.mjs: nenhum <script> inline encontrado em dist/; a CSP sairia sem o tema.");
  process.exit(1);
}

const csp = [
  "default-src 'self'",
  `script-src 'self' ${[...hashes].join(" ")}`,
  // O Astro inlina CSS pequeno (inlineStylesheets "auto") e as ilhas usam style= na rotação dos
  // selos. Script é o vetor que importa e está fechado por hash.
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

console.log(`header Content-Security-Policy "${csp}"`);
