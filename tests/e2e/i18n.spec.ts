// CA-03 (RF-06): a troca de idioma leva à mesma página no outro idioma, não à home.
import { expect, test, type Page } from "@playwright/test";
import { projectSlugs } from "../support/content";
import { homePath, projectPath, t, visibleInHeader, type Locale } from "./support";

const HTML_LANG: Record<Locale, string> = { en: "en", pt: "pt-BR" };
const other = (locale: Locale): Locale => (locale === "en" ? "pt" : "en");

// O link mostra o nome do idioma de destino escrito nele mesmo ("Português", "English").
async function switchLanguage(page: Page, from: Locale) {
  const target = other(from);
  const link = page
    .getByRole("banner")
    .getByRole("link", { name: new RegExp(t("language.name", target), "i") });
  await (await visibleInHeader(page, link)).click();
}

const slug = projectSlugs().published[0] ?? "yu-book";

const routes: { name: string; path: (locale: Locale) => string }[] = [
  { name: "home", path: homePath },
  { name: `projeto ${slug}`, path: (locale) => projectPath(slug, locale) },
];

for (const route of routes) {
  for (const from of ["en", "pt"] as const) {
    const to = other(from);
    test(`CA-03: ${route.name} ${from} → ${to} preserva a rota`, async ({ page }) => {
      await page.goto(route.path(from));
      await expect(page.locator("html")).toHaveAttribute("lang", HTML_LANG[from]);
      await switchLanguage(page, from);
      await expect(page).toHaveURL(new RegExp(`${route.path(to).replace(/\//g, "\\/")}$`));
      await expect(page.locator("html")).toHaveAttribute("lang", HTML_LANG[to]);
    });
  }
}

test("CA-03 literal: /projects/yu-book/ → /pt/projects/yu-book/", async ({ page }) => {
  await page.goto("/projects/yu-book/");
  await switchLanguage(page, "en");
  await expect(page).toHaveURL(/\/pt\/projects\/yu-book\/$/);
});

test("o link de idioma declara o idioma de destino (hreflang/lang)", async ({ page }) => {
  await page.goto("/");
  const link = page
    .getByRole("banner")
    .getByRole("link", { name: new RegExp(t("language.name", "pt"), "i") })
    .first();
  // Leitor de tela pronuncia "Português" com a voz certa só se o idioma estiver marcado.
  const marked = await link.evaluate(
    (el) =>
      el.getAttribute("hreflang") ??
      el.getAttribute("lang") ??
      el.querySelector("[lang]")?.getAttribute("lang") ??
      "",
  );
  expect(marked).toMatch(/^pt/);
});
