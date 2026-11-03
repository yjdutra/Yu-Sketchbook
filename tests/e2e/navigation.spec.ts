// CA-01 (RF-01, RF-02): menu → âncora → aria-current, ordem das seções e o menu recolhível abaixo
// de INLINE_NAV_MIN_WIDTH (1024 px desde a 6ª âncora; ver o comentário em support.ts).
import { expect, test, type Page } from "@playwright/test";
import { loadCollection } from "../support/content";
import {
  homePath,
  INLINE_NAV_MIN_WIDTH,
  isCollapsedViewport,
  LOCALES,
  menuToggle,
  openNav,
  SECTION_IDS,
  t,
} from "./support";

// O rótulo de cada âncora. Uma seção nova na home sem entrada aqui faz o teste de cobertura
// abaixo falhar, em vez de a seção ficar sem teste em silêncio.
const SECTION_KEYS = {
  impact: "section.impact",
  projects: "section.projects",
  journey: "section.journey",
  credentials: "section.credentials",
  playground: "section.playground",
  contact: "section.contact",
} as const;

test("RF-01: toda âncora de SECTION_IDS tem rótulo neste spec", () => {
  expect(Object.keys(SECTION_KEYS)).toEqual(Object.values(SECTION_IDS));
});

// A marca da barra é o nome do perfil, lido do YAML real.
const PROFILE_NAME = String(loadCollection("profile")[0]?.data.name ?? "");

const brandLink = (page: Page) =>
  page.getByRole("banner").getByRole("link", { name: PROFILE_NAME, exact: true });

// A marca tem `overflow: hidden` com elipse: comprimida, ela não desaparece — ela é cortada, e o
// único sinal é scrollWidth > clientWidth. 1 px de folga porque as duas medidas são arredondadas.
async function expectBrandNotClipped(page: Page, width: number) {
  const box = await brandLink(page).evaluate((el) => ({
    client: el.clientWidth,
    scroll: el.scrollWidth,
  }));
  expect(box.client, `${width}px: a marca ficou sem largura`).toBeGreaterThan(0);
  expect(box.scroll, `${width}px: marca cortada (${box.scroll} px em ${box.client} px)`).toBeLessThanOrEqual(box.client + 1);
}

for (const locale of LOCALES) {
  test.describe(`navegação ${locale}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(homePath(locale));
    });

    test('CA-01: o item Projects rola até #projects e fica com aria-current="true"', async ({
      page,
    }) => {
      const nav = await openNav(page, locale);
      const link = nav.getByRole("link", {
        name: t("section.projects", locale),
        exact: true,
        includeHidden: true,
      });
      await expect(link).toHaveAttribute("href", /#projects$/);
      await link.click();

      await expect(page).toHaveURL(/#projects$/);
      await expect(page.locator(`#${SECTION_IDS.projects}`)).toBeInViewport();
      // O scroll-spy marca o item; o atributo vale mesmo com o menu já fechado.
      await expect(link).toHaveAttribute("aria-current", "true");
      await expect(nav.locator('[aria-current="true"]')).toHaveCount(1);
      if (isCollapsedViewport(page)) {
        // Reaberto, o menu mostra o item atual marcado.
        const reopened = await openNav(page, locale);
        await expect(
          reopened.getByRole("link", { name: t("section.projects", locale), exact: true }),
        ).toHaveAttribute("aria-current", "true");
      }
    });

    test("RF-01: a barra lista todas as âncoras do PRD e cada uma tem destino", async ({ page }) => {
      const nav = await openNav(page, locale);
      for (const [id, key] of Object.entries(SECTION_KEYS)) {
        const link = nav.getByRole("link", { name: t(key, locale), exact: true });
        await expect(link, `link para #${id}`).toHaveAttribute("href", new RegExp(`#${id}$`));
        await expect(page.locator(`#${id}`), `seção #${id}`).toHaveCount(1);
      }
    });

    test("RF-01: as seções aparecem na ordem do PRD, depois do Hero", async ({ page }) => {
      const ids = Object.values(SECTION_IDS);
      const tops = await page.evaluate(
        (sectionIds) =>
          sectionIds.map((id) => document.getElementById(id)?.getBoundingClientRect().top ?? NaN),
        ids,
      );
      expect(tops.every((top) => Number.isFinite(top))).toBe(true);
      expect([...tops].sort((a, b) => a - b)).toEqual(tops);
      const h1 = await page.getByRole("heading", { level: 1 }).boundingBox();
      expect(h1?.y ?? Infinity).toBeLessThan(tops[0] ?? -Infinity);
    });

    test("o título da seção não fica escondido sob a barra fixa", async ({ page }) => {
      const nav = await openNav(page, locale);
      await nav.getByRole("link", { name: t("section.journey", locale), exact: true }).click();
      await expect(page).toHaveURL(/#journey$/);
      const heading = page.locator(`#${SECTION_IDS.journey}`).getByRole("heading").first();
      await expect(heading).toBeInViewport();
      const header = await page.getByRole("banner").boundingBox();
      const box = await heading.boundingBox();
      expect(box?.y ?? -1).toBeGreaterThanOrEqual((header?.y ?? 0) + (header?.height ?? 0) - 1);
    });

    test("RF-02: abaixo de 1024 px o menu colapsa e abre por teclado", async ({ page }) => {
      test.skip(!isCollapsedViewport(page), "só existe menu colapsado abaixo de 1024 px");
      const probe = page
        .getByRole("navigation", { name: t("nav.label", locale), exact: true })
        .getByRole("link", { name: t("section.projects", locale), exact: true })
        .filter({ visible: true });
      await expect(probe).toHaveCount(0);

      const toggle = menuToggle(page);
      await toggle.focus();
      await page.keyboard.press("Enter");
      await expect(probe.first()).toBeVisible();
      await probe.first().focus();
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(/#projects$/);
    });

    test("RF-02: a partir de 1024 px as âncoras ficam visíveis sem menu", async ({ page }) => {
      test.skip(isCollapsedViewport(page), "abaixo de 1024 px a barra colapsa por design");
      const nav = page.getByRole("navigation", { name: t("nav.label", locale), exact: true });
      await expect(
        nav.getByRole("link", { name: t("section.projects", locale), exact: true }),
      ).toBeVisible();
    });

    // O defeito que moveu o breakpoint para 1024: com 6 âncoras em linha, a marca (o nome do
    // Yuri) era comprimida até 0 px em 768. Nesta faixa quem serve é o <details>, e a marca fica
    // inteira. Mede as duas pontas, 768 e 1023.
    test("RF-02: de 768 a 1023 px o menu recolhível serve as 6 âncoras e a marca fica inteira", async ({
      page,
    }, testInfo) => {
      test.skip(testInfo.project.name !== "tablet", "faixa do tablet: o teste redimensiona sozinho");
      for (const width of [768, INLINE_NAV_MIN_WIDTH - 1]) {
        await page.setViewportSize({ width, height: 1024 });
        await page.goto(homePath(locale));

        // A barra em linha não aparece nesta faixa: quem serve é o botão do menu.
        const inline = page
          .getByRole("navigation", { name: t("nav.label", locale), exact: true })
          .getByRole("link", { name: t("section.projects", locale), exact: true })
          .filter({ visible: true });
        await expect(inline, `${width}px: a barra em linha não devia aparecer`).toHaveCount(0);
        await expect(menuToggle(page), `${width}px: botão do menu`).toBeVisible();

        const nav = await openNav(page, locale);
        const entries = Object.entries(SECTION_KEYS);
        await expect(nav.getByRole("link"), `${width}px: itens do menu`).toHaveCount(entries.length);
        for (const [id, key] of entries) {
          const link = nav.getByRole("link", { name: t(key, locale), exact: true });
          await expect(link, `${width}px: item #${id} visível`).toBeVisible();
          await expect(link).toHaveAttribute("href", new RegExp(`#${id}$`));
        }
        await expect(brandLink(page), `${width}px: marca visível`).toBeVisible();
        await expectBrandNotClipped(page, width);
      }
    });

    // A outra ponta: em 1024 a barra em linha cabe junto com a marca, sem cortar nada e sem abrir
    // rolagem horizontal (o PT é o idioma apertado: 537 px só de âncoras).
    test("RF-02: em 1024 px as 6 âncoras cabem em linha, com a marca inteira", async ({
      page,
    }, testInfo) => {
      test.skip(testInfo.project.name !== "desktop", "o teste redimensiona para 1024 e 1440");
      for (const width of [INLINE_NAV_MIN_WIDTH, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(homePath(locale));

        const nav = page.getByRole("navigation", { name: t("nav.label", locale), exact: true });
        for (const [id, key] of Object.entries(SECTION_KEYS)) {
          const link = nav.getByRole("link", { name: t(key, locale), exact: true });
          await expect(link, `${width}px: âncora #${id} em linha`).toBeVisible();
        }
        // O botão do menu sai de cena: dois caminhos de navegação visíveis duplicariam o foco.
        await expect(page.getByRole("banner").locator("summary")).toBeHidden();
        await expect(brandLink(page), `${width}px: marca visível`).toBeVisible();
        await expectBrandNotClipped(page, width);

        const scroll = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        }));
        expect(scroll.scrollWidth, `${width}px: rolagem horizontal`).toBeLessThanOrEqual(
          scroll.clientWidth,
        );
      }
    });
  });
}
