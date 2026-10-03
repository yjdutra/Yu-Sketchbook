// RF-21, RF-22, RF-23: o que o Google e o preview do LinkedIn leem. Não depende do viewport; roda
// só no project desktop (playwright.config.ts).
import { expect, test, type Page } from "@playwright/test";
import { loadCollection, projectSlugs } from "../support/content";
import { homePath, LOCALES, projectPath, SITE, type Locale } from "./support";

const profile = loadCollection("profile")[0]?.data ?? {};
const { published, drafts } = projectSlugs();

type Indexable = { path: (l: Locale) => string; name: string };
const INDEXABLE: Indexable[] = [
  { name: "home", path: homePath },
  ...published.map((slug) => ({
    name: `projeto ${slug}`,
    path: (l: Locale) => projectPath(slug, l),
  })),
];

const meta = (page: Page, selector: string) =>
  page.locator(selector).first().getAttribute("content");

// Lê largura × altura do cabeçalho do PNG (IHDR) sem dependência de imagem.
function pngSize(buffer: Buffer): { width: number; height: number } | null {
  const signature = "89504e470d0a1a0a";
  if (buffer.subarray(0, 8).toString("hex") !== signature) return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

for (const route of INDEXABLE) {
  for (const locale of LOCALES) {
    const path = route.path(locale);
    test(`RF-21: ${route.name} ${locale} tem title, description, canonical, hreflang e OG`, async ({
      page,
      request,
    }) => {
      await page.goto(path);
      const head = page.locator("head");
      expect((await page.title()).trim().length).toBeGreaterThan(0);
      const description = (await meta(page, 'meta[name="description"]')) ?? "";
      expect(description.length, "meta description").toBeGreaterThanOrEqual(50);
      expect(description.length, "meta description").toBeLessThanOrEqual(160);

      const canonical = `${SITE}${path}`;
      await expect(head.locator('link[rel="canonical"]')).toHaveAttribute("href", canonical);
      await expect(head.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
        "href",
        `${SITE}${route.path("en")}`,
      );
      await expect(head.locator('link[rel="alternate"][hreflang="pt-BR"]')).toHaveAttribute(
        "href",
        `${SITE}${route.path("pt")}`,
      );
      await expect(head.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute(
        "href",
        `${SITE}${route.path("en")}`,
      );
      await expect(page.locator('meta[name="robots"][content*="noindex"]')).toHaveCount(0);

      // Open Graph e Twitter (o preview do LinkedIn usa o OG).
      expect(await meta(page, 'meta[property="og:title"]')).toBeTruthy();
      expect(await meta(page, 'meta[property="og:description"]')).toBeTruthy();
      expect(await meta(page, 'meta[property="og:url"]')).toBe(canonical);
      expect(await meta(page, 'meta[property="og:type"]')).toBeTruthy();
      expect(await meta(page, 'meta[property="og:locale"]')).toMatch(
        locale === "en" ? /^en/ : /^pt/,
      );
      expect(await meta(page, 'meta[name="twitter:card"]')).toBe("summary_large_image");
      const image = (await meta(page, 'meta[property="og:image"]')) ?? "";
      expect(image).toMatch(new RegExp(`^${SITE}/`));
      expect(await meta(page, 'meta[property="og:image:alt"]')).toBeTruthy();

      const imageResponse = await request.get(new URL(image).pathname);
      expect(imageResponse.status()).toBe(200);
      const size = pngSize(await imageResponse.body());
      const declared = {
        width: Number(await meta(page, 'meta[property="og:image:width"]')),
        height: Number(await meta(page, 'meta[property="og:image:height"]')),
      };
      expect(size ?? declared, "imagem OG 1200×630").toEqual({ width: 1200, height: 630 });
    });
  }
}

test("RF-21: o title muda com o idioma", async ({ page }) => {
  await page.goto("/");
  const en = await page.title();
  await page.goto("/pt/");
  expect(await page.title()).not.toBe(en);
});

for (const locale of LOCALES) {
  test(`RF-22: JSON-LD Person na home ${locale}, sem telefone (RN-07)`, async ({ page }) => {
    await page.goto(homePath(locale));
    const blocks = await page
      .locator('script[type="application/ld+json"]')
      .evaluateAll((nodes) => nodes.map((n) => n.textContent ?? ""));
    const graph = blocks.flatMap((raw) => {
      const parsed: unknown = JSON.parse(raw);
      const list = Array.isArray(parsed) ? parsed : [parsed];
      return list.flatMap((item: Record<string, unknown>) =>
        Array.isArray(item["@graph"]) ? (item["@graph"] as Record<string, unknown>[]) : [item],
      );
    });
    const person = graph.find((item) => item["@type"] === "Person");
    expect(person, "JSON-LD com @type Person").toBeTruthy();
    expect(person?.name).toBe(profile.name);
    expect(person?.jobTitle).toBeTruthy();
    const links = profile.links as { linkedin: string; github: string };
    expect(person?.sameAs).toEqual(expect.arrayContaining([links.linkedin, links.github]));
    const raw = blocks.join("\n");
    expect(raw).not.toMatch(/"telephone"/i);
  });
}

test("noindex: 404 e /cv ficam fora do índice e sem canonical", async ({ page }) => {
  for (const path of ["/this-page-does-not-exist/", "/pt/404/", "/cv/", "/pt/cv/"]) {
    await page.goto(path);
    await expect(page.locator('meta[name="robots"]'), path).toHaveAttribute("content", /noindex/);
    await expect(page.locator('link[rel="canonical"]'), path).toHaveCount(0);
  }
});

test("RF-23: robots.txt aponta o sitemap", async ({ request }) => {
  const response = await request.get("/robots.txt");
  expect(response.status()).toBe(200);
  const body = await response.text();
  expect(body).toMatch(/User-agent:\s*\*/i);
  expect(body).toContain(`Sitemap: ${SITE}/sitemap-index.xml`);
});

test("RF-23 / CA-09: o sitemap tem as páginas publicadas e nada fora do índice", async ({
  request,
}) => {
  const index = await request.get("/sitemap-index.xml");
  expect(index.status()).toBe(200);
  const sitemaps = [...(await index.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    (m) => m[1] ?? "",
  );
  expect(sitemaps.length).toBeGreaterThan(0);
  let body = "";
  for (const loc of sitemaps) body += await (await request.get(new URL(loc).pathname)).text();

  const urls = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1] ?? "");
  for (const route of INDEXABLE) {
    for (const locale of LOCALES) expect(urls).toContain(`${SITE}${route.path(locale)}`);
  }
  for (const url of urls) {
    expect(url).not.toMatch(/\/cv\/|\/404\/?$/);
  }
  for (const slug of drafts) expect(body).not.toContain(`/projects/${slug}/`);
  // hreflang dentro do sitemap (o @astrojs/sitemap com i18n).
  expect(body).toContain('hreflang="pt-BR"');
});

test("cada página indexável tem um único h1", async ({ page }) => {
  for (const route of INDEXABLE) {
    for (const locale of LOCALES) {
      await page.goto(route.path(locale));
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    }
  }
});
