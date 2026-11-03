// Peças comuns aos specs. Os seletores são por papel, landmark e id (SECTION_IDS), nunca por
// classe: o visual muda sem quebrar o teste.
import { expect, type Locator, type Page, type TestInfo } from "@playwright/test";
import { SECTION_IDS, ui, type UiKey } from "../../src/i18n/ui";
import { projectSlugs } from "../support/content";

export { SECTION_IDS };
export type Locale = "en" | "pt";
export const LOCALES: Locale[] = ["en", "pt"];
export const SITE = "https://yuri-jorge.up.railway.app";

export const t = (key: UiKey, locale: Locale): string => ui[key][locale];

export const homePath = (locale: Locale) => (locale === "en" ? "/" : "/pt/");
export const projectPath = (slug: string, locale: Locale) =>
  locale === "en" ? `/projects/${slug}/` : `/pt/projects/${slug}/`;

export type SitePage = {
  name: string;
  path: string;
  locale: Locale;
  status: number;
  kind: "home" | "project" | "404" | "cv";
};

// Todas as páginas que o visitante pode abrir. A matriz da skill é o mínimo; layout e axe rodam
// em todas as páginas × todos os viewports, porque o custo é baixo e a cobertura é maior.
export function sitePages(): SitePage[] {
  const pages: SitePage[] = [];
  for (const locale of LOCALES) {
    pages.push({
      name: `home ${locale}`,
      path: homePath(locale),
      locale,
      status: 200,
      kind: "home",
    });
    for (const slug of projectSlugs().published) {
      const path = projectPath(slug, locale);
      pages.push({ name: `projeto ${slug} ${locale}`, path, locale, status: 200, kind: "project" });
    }
    pages.push({
      name: `cv ${locale}`,
      path: locale === "en" ? "/cv/" : "/pt/cv/",
      locale,
      status: 200,
      kind: "cv",
    });
  }
  // O `astro preview` responde a qualquer caminho inexistente com a 404 EN (404.html). A 404 PT
  // por caminho (/pt/xyz → pt/404) é do Caddy e é testada no redirects.spec.ts; aqui a PT é aberta
  // pelo endereço gerado.
  pages.push({
    name: "404 en",
    path: "/this-page-does-not-exist/",
    locale: "en",
    status: 404,
    kind: "404",
  });
  pages.push({ name: "404 pt", path: "/pt/404/", locale: "pt", status: 200, kind: "404" });
  return pages;
}

// Largura em que a barra passa a listar as âncoras em linha (RF-02). É o breakpoint do
// SiteHeader.astro: a 768 px de viewport o <ul> com 6 âncoras mede 493 px em PT e a marca seria
// cortada — em linha ele só cabe ao lado dela a partir de ~960 px, então o <details> serve até
// 1023 px. A 1024 px de viewport o <ul> mede 528 px em PT e a marca fica inteira.
// ATENÇÃO: esta constante é a única chave do breakpoint, e navigation, layout e a11y.spec.ts se
// penduram nela. Mudar o @media do SiteHeader sem mudar este número NÃO deixa a suíte vermelha:
// os dois testes do par (um pula se o viewport está colapsado, o outro se não está) se pulam em
// cruz e tudo fica verde testando nada. Mudou o @media? mude aqui no mesmo commit e confira a
// contagem de testes pulados.
export const INLINE_NAV_MIN_WIDTH = 1024;

// O botão que abre o menu colapsado (abaixo de INLINE_NAV_MIN_WIDTH, RF-02). Pode ser <summary>,
// <button> com aria-expanded ou um disparador de popover: o teste aceita os três.
export function menuToggle(page: Page): Locator {
  return page
    .getByRole("banner")
    .locator("summary, button[aria-expanded], [popovertarget]")
    .filter({ visible: true })
    .first();
}

// A navegação principal, aberta se estiver colapsada. Devolve o landmark visível por posição
// (nth), não por filtro de visibilidade: depois do clique o menu fecha, e um locator filtrado por
// "visível" deixaria de achar o mesmo elemento.
export async function openNav(page: Page, locale: Locale): Promise<Locator> {
  // includeHidden: o papel some da árvore quando o <details> fecha; sem ele o nth(i) mudaria de
  // alvo depois do clique.
  const all = page.getByRole("navigation", {
    name: t("nav.label", locale),
    exact: true,
    includeHidden: true,
  });
  const projectsLink = (nav: Locator) =>
    nav.getByRole("link", {
      name: t("section.projects", locale),
      exact: true,
      includeHidden: true,
    });
  const findVisible = async () => {
    const count = await all.count();
    for (let i = 0; i < count; i += 1) {
      if (await projectsLink(all.nth(i)).isVisible()) return all.nth(i);
    }
    return null;
  };
  const visible = await findVisible();
  if (visible) return visible;
  await menuToggle(page).click();
  await expect(projectsLink(all).filter({ visible: true }).first()).toBeVisible();
  const opened = await findVisible();
  if (!opened) throw new Error("o menu abriu, mas nenhuma navegação ficou visível");
  return opened;
}

// Um controle da barra superior que no celular pode estar dentro do menu colapsado (troca de
// idioma, troca de tema).
export async function visibleInHeader(page: Page, locator: Locator): Promise<Locator> {
  const visible = locator.filter({ visible: true });
  if ((await visible.count()) === 0) {
    await menuToggle(page).click();
  }
  await expect(visible.first()).toBeVisible();
  return visible.first();
}

// Faz as ilhas `client:visible` hidratarem: rola até o fim e espera o Astro tirar o `ssr`.
export async function hydrateIslands(page: Page): Promise<void> {
  const ids = Object.values(SECTION_IDS);
  for (const id of ids) {
    const section = page.locator(`#${id}`);
    if ((await section.count()) > 0) await section.scrollIntoViewIfNeeded();
  }
  await expect(page.locator("astro-island[ssr]")).toHaveCount(0);
  await page.evaluate(() => window.scrollTo(0, 0));
}

export function viewportWidths(testInfo: TestInfo): number[] {
  // RNF-04: de 360 a 1920 px. As pontas entram como larguras extras nos projects das pontas.
  switch (testInfo.project.name) {
    case "mobile":
      return [375, 360];
    case "desktop":
      return [1440, 1920];
    default:
      return [768];
  }
}

export const isCollapsedViewport = (page: Page) =>
  (page.viewportSize()?.width ?? 0) < INLINE_NAV_MIN_WIDTH;
