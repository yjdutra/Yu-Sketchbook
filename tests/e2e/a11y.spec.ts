// RNF-03 / CA-10: axe sem nenhuma violação (todas as severidades), em todas as páginas, nos dois
// temas, com as ilhas já hidratadas. Mais: o selo virado, o menu aberto e o foco visível.
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import {
  hydrateIslands,
  isCollapsedViewport,
  menuToggle,
  SECTION_IDS,
  sitePages,
  t,
} from "./support";

const THEMES = ["light", "dark"] as const;

async function violations(page: Page, include?: string) {
  const builder = new AxeBuilder({ page });
  if (include) builder.include(include);
  const result = await builder.analyze();
  // Resumo legível: regra, impacto e os 3 primeiros alvos (o relatório do teste é o achado).
  return result.violations.map(
    (v) =>
      `${v.id} [${v.impact ?? "?"}] ${v.help} → ${v.nodes
        .slice(0, 3)
        .map((n) => n.target.join(" "))
        .join(" | ")}${v.nodes.length > 3 ? ` (+${v.nodes.length - 3})` : ""}`,
  );
}

for (const sitePage of sitePages()) {
  // A página-fonte do CV é para impressão e fica sempre clara; não tem tema escuro a auditar.
  for (const theme of sitePage.kind === "cv" ? (["light"] as const) : THEMES) {
    test(`axe: ${sitePage.name}, tema ${theme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme });
      const response = await page.goto(sitePage.path);
      expect(response?.status()).toBe(sitePage.status);
      if (sitePage.kind !== "cv") {
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      }
      await hydrateIslands(page);
      expect(await violations(page)).toEqual([]);
    });
  }
}

for (const theme of THEMES) {
  test(`axe: selo virado, tema ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    await page.goto("/");
    await hydrateIslands(page);
    const badge = page.locator(`#${SECTION_IDS.credentials} [aria-expanded]`).first();
    await badge.scrollIntoViewIfNeeded();
    await badge.click();
    await expect(badge).toHaveAttribute("aria-expanded", "true");
    expect(await violations(page, `#${SECTION_IDS.credentials}`)).toEqual([]);
  });

  test(`axe: menu mobile aberto, tema ${theme}`, async ({ page }) => {
    test.skip(!isCollapsedViewport(page), "menu colapsado só abaixo de 768 px");
    await page.emulateMedia({ colorScheme: theme });
    await page.goto("/");
    await menuToggle(page).click();
    expect(await violations(page, "header")).toEqual([]);
  });
}

test("RNF-03: o skip link aparece no primeiro Tab e leva ao conteúdo", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: t("skip.toMain", "en") });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
});

// RNF-03: foco visível. Percorre os primeiros controles pelo Tab e exige contorno ou sombra.
for (const theme of THEMES) {
  test(`RNF-03: foco visível nos primeiros 25 controles, tema ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    await page.goto("/");
    const missing: string[] = [];
    for (let i = 0; i < 25; i += 1) {
      await page.keyboard.press("Tab");
      const info = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body) return null;
        // Indicador = algo muda no contorno ou na sombra do controle, ou de um ancestral próximo
        // (o selo desenha o anel no <li> via :has(:focus-visible)), entre focado e desfocado.
        // Comparar os dois estados evita contar uma sombra de cartão que está sempre lá.
        const chain: Element[] = [];
        for (let node: Element | null = el; node && chain.length < 4; node = node.parentElement) {
          chain.push(node);
        }
        const ring = () =>
          chain.map((node) => {
            const style = getComputedStyle(node);
            const outline =
              style.outlineStyle === "none"
                ? "none"
                : `${style.outlineStyle} ${style.outlineWidth} ${style.outlineColor}`;
            return `${outline} | ${style.boxShadow}`;
          });
        const focused = ring();
        el.blur();
        const blurred = ring();
        el.focus();
        const visible = focused.some((value, i) => value !== blurred[i]);
        const name =
          el.getAttribute("aria-label") || el.textContent?.trim() || el.id || el.className;
        const label = `${el.tagName.toLowerCase()} "${String(name).slice(0, 40)}"`;
        return { visible, label };
      });
      if (info === null) break;
      if (!info.visible) missing.push(info.label);
    }
    expect(missing, "controles sem indicador de foco").toEqual([]);
  });
}
