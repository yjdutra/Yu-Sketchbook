// CA-01 (RF-01, RF-02): menu → âncora → aria-current, ordem das seções, menu colapsado < 768 px.
import { expect, test } from "@playwright/test";
import {
  homePath,
  isCollapsedViewport,
  LOCALES,
  menuToggle,
  openNav,
  SECTION_IDS,
  t,
} from "./support";

const SECTION_KEYS = {
  impact: "section.impact",
  projects: "section.projects",
  journey: "section.journey",
  credentials: "section.credentials",
  contact: "section.contact",
} as const;

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

    test("RF-01: a barra lista as 5 âncoras e cada uma tem destino", async ({ page }) => {
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

    test("RF-02: abaixo de 768 px o menu colapsa e abre por teclado", async ({ page }) => {
      test.skip(!isCollapsedViewport(page), "só existe menu colapsado abaixo de 768 px");
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

    test("RF-02: a partir de 768 px as âncoras ficam visíveis sem menu", async ({ page }) => {
      test.skip(isCollapsedViewport(page), "abaixo de 768 px a barra colapsa por design");
      const nav = page.getByRole("navigation", { name: t("nav.label", locale), exact: true });
      await expect(
        nav.getByRole("link", { name: t("section.projects", locale), exact: true }),
      ).toBeVisible();
    });
  });
}
