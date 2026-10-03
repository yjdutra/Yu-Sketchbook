// Gera os CVs em PDF (EN e PT) a partir das páginas /cv/ e /pt/cv/ do build. Rodado por `pnpm cv`
// (que builda antes) quando o conteúdo muda; os PDFs são versionados em public/cv/ para o Docker
// não precisar de Chromium. Decisão do Yuri (2026-10-03): PDF próprio, sem telefone (RN-07).
//
// Serve dist/ com um servidor estático mínimo numa porta livre, em vez do `astro preview`: o
// preview do Astro 7 é daemon único, e o qa pode estar com um aberto.
import { readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { chromium } from "@playwright/test";

const DIST = "dist";
const PAGES = ["/cv/", "/pt/cv/"];
const MAX_PAGES = 2;
// RN-07: nenhuma sequência com cara de telefone (8+ dígitos, com ou sem separadores) no PDF.
const PHONE = /\+?\d[\d\s().-]{7,}\d/;

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".woff2": "font/woff2",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
};

const server = createServer(async (request, response) => {
  const path = normalize(decodeURIComponent(new URL(request.url ?? "/", "http://x").pathname));
  const file = join(DIST, path.endsWith("/") ? `${path}index.html` : path);
  try {
    const body = await readFile(file);
    response.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
    response.end(body);
  } catch {
    response.writeHead(404).end();
  }
});
await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
const address = server.address();
if (address === null || typeof address === "string") throw new Error("cv.ts: porta indefinida");
const base = `http://127.0.0.1:${address.port}`;

const browser = await chromium.launch();
const problems: string[] = [];
try {
  const page = await browser.newPage();
  await page.emulateMedia({ media: "print", colorScheme: "light" });
  for (const route of PAGES) {
    const response = await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
    if (response?.status() !== 200) throw new Error(`cv.ts: ${route} respondeu ${response?.status()}`);
    await page.evaluate(() => document.fonts.ready);
    const target = await page.locator("[data-cv-pdf]").getAttribute("data-cv-pdf");
    if (!target) throw new Error(`cv.ts: ${route} sem data-cv-pdf`);

    const pdf = await page.pdf({ printBackground: true, preferCSSPageSize: true, tagged: true });
    const output = join("public", target);
    await writeFile(output, pdf);

    const pages = pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g)?.length ?? 0;
    const text = await page.locator("body").innerText();
    console.log(`${output}: ${pages} página(s), ${Math.round(pdf.length / 1024)} KB`);
    if (pages < 1 || pages > MAX_PAGES) problems.push(`${output} tem ${pages} páginas`);
    const phone = text.match(PHONE);
    if (phone) problems.push(`${output}: sequência com cara de telefone "${phone[0]}" (RN-07)`);
  }
} finally {
  await browser.close();
  server.close();
}

if (problems.length > 0) {
  console.error(problems.join("\n"));
  process.exit(1);
}
