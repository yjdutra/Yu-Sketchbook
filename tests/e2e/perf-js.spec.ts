// RNF-02: antes de rolar, o JS transferido fica em ≤ 10 KB gz e nenhum pedaço do framework da ilha
// (React ou Preact: renderer, runtime e componente) desce. Ele só baixa quando #credentials fica
// visível.
// O preview local não comprime; o gz é calculado aqui, sobre o corpo de cada resposta.
import { gzipSync } from "node:zlib";
import { expect, test, type Page, type Response } from "@playwright/test";
import { projectSlugs } from "../support/content";
import { homePath, projectPath, SECTION_IDS } from "./support";

const INITIAL_JS_BUDGET = 10 * 1024;

function trackScripts(page: Page) {
  const responses: Response[] = [];
  page.on("response", (response) => {
    const url = new URL(response.url());
    if (url.pathname.endsWith(".js") || response.request().resourceType() === "script") {
      responses.push(response);
    }
  });
  return responses;
}

async function gzBytes(responses: Response[]) {
  const sizes = await Promise.all(
    responses.map(async (r) => ({
      url: new URL(r.url()).pathname,
      gz: gzipSync(await r.body()).length,
    })),
  );
  return { sizes, total: sizes.reduce((sum, s) => sum + s.gz, 0) };
}

// O que pertence à ilha, lido do próprio HTML: o componente e o renderer de cada <astro-island>.
const islandUrls = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll("astro-island")].flatMap((island) =>
      ["component-url", "renderer-url", "before-hydration-url"]
        .map((attr) => island.getAttribute(attr))
        .filter((url): url is string => Boolean(url))
        .map((url) => new URL(url, location.href).pathname),
    ),
  );

// Nomes dos chunks de runtime que o Vite gera para React e Preact.
const looksLikeFramework = (path: string) =>
  /\/(react|react-dom|preact|hooks|compat|client|jsx-runtime|signals)[.-]/i.test(path);

const slug = projectSlugs().published[0] ?? "yu-book";
const PAGES = [homePath("en"), homePath("pt"), projectPath(slug, "en")];

for (const path of PAGES) {
  const title = `RNF-02: ${path} antes de rolar: ≤ 10 KB gz de JS e nada do framework da ilha`;
  test(title, async ({ page }) => {
    const responses = trackScripts(page);
    await page.goto(path, { waitUntil: "networkidle" });
    const island = new Set(await islandUrls(page));
    const { sizes, total } = await gzBytes(responses);
    const report = sizes.map((s) => `${s.url} ${s.gz} B`).join(", ") || "nenhum";

    const early = sizes.filter((s) => island.has(s.url) || looksLikeFramework(s.url));
    expect(
      early.map((s) => s.url),
      `JS da ilha antes de rolar (${report})`,
    ).toEqual([]);
    expect(total, `JS antes de rolar: ${report}`).toBeLessThanOrEqual(INITIAL_JS_BUDGET);
    // O scroll não aconteceu: a medição só vale se a página ficou no topo.
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });
}

test("RNF-02: o framework da ilha baixa quando o álbum fica visível", async ({ page }) => {
  const responses = trackScripts(page);
  await page.goto("/", { waitUntil: "networkidle" });
  const island = await islandUrls(page);
  expect(island.length, "a home tem ao menos uma <astro-island>").toBeGreaterThan(0);

  await page.locator(`#${SECTION_IDS.credentials}`).scrollIntoViewIfNeeded();
  await expect(page.locator("astro-island[ssr]")).toHaveCount(0);
  const loaded = new Set(responses.map((r) => new URL(r.url()).pathname));
  for (const url of island) expect(loaded, `${url} baixou depois de rolar`).toContain(url);
});
