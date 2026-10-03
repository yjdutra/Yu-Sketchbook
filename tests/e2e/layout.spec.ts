// RNF-04 / CA-10: nenhuma rolagem horizontal, em todas as páginas e larguras de 360 a 1920 px.
import { expect, test, type Page } from "@playwright/test";
import {
  hydrateIslands,
  isCollapsedViewport,
  menuToggle,
  sitePages,
  viewportWidths,
} from "./support";

async function overflow(page: Page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    // Quem passa da borda direita, para o relatório apontar o culpado.
    const culprits = [...document.querySelectorAll<HTMLElement>("body *")]
      .filter((el) => el.getBoundingClientRect().right > root.clientWidth + 1)
      .filter((el) => getComputedStyle(el).position !== "fixed")
      .slice(0, 5)
      .map(
        (el) =>
          `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""} → ${Math.round(el.getBoundingClientRect().right)}px`,
      );
    return { scrollWidth: root.scrollWidth, clientWidth: root.clientWidth, culprits };
  });
}

for (const sitePage of sitePages()) {
  test(`RNF-04: ${sitePage.name} sem rolagem horizontal`, async ({ page }, testInfo) => {
    for (const width of viewportWidths(testInfo)) {
      const height = page.viewportSize()?.height ?? 900;
      await page.setViewportSize({ width, height });
      const response = await page.goto(sitePage.path);
      expect(response?.status()).toBe(sitePage.status);
      await hydrateIslands(page);
      const result = await overflow(page);
      expect(result.scrollWidth, `${width}px: ${result.culprits.join(", ")}`).toBeLessThanOrEqual(
        result.clientWidth,
      );
    }
  });
}

test("RNF-04: o menu aberto também não cria rolagem horizontal", async ({ page }) => {
  test.skip(!isCollapsedViewport(page), "menu colapsado só abaixo de 768 px");
  await page.goto("/");
  await menuToggle(page).click();
  const result = await overflow(page);
  expect(result.scrollWidth, result.culprits.join(", ")).toBeLessThanOrEqual(result.clientWidth);
});
