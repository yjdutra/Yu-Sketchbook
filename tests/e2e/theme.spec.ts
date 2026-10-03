// CA-04 (RF-07): o primeiro quadro já tem o tema certo. O script inline do <head> precisa ter
// gravado `data-theme` antes de o <body> existir, isto é, antes de qualquer pintura.
import { expect, test, type Browser } from "@playwright/test";
import { t, visibleInHeader } from "./support";

// Roda antes de qualquer script da página: anota o data-theme no instante em que o <body> é
// inserido e no DOMContentLoaded.
const RECORD_THEME = `
  window.__theme = {};
  new MutationObserver((_, observer) => {
    if (document.body) {
      window.__theme.atBody = document.documentElement.getAttribute("data-theme");
      observer.disconnect();
    }
  }).observe(document, { childList: true, subtree: true });
  document.addEventListener("DOMContentLoaded", () => {
    window.__theme.atDomContentLoaded = document.documentElement.getAttribute("data-theme");
  });
`;

type Recorded = { atBody?: string | null; atDomContentLoaded?: string | null };

async function firstFrameTheme(
  browser: Browser,
  colorScheme: "light" | "dark",
  saved?: "light" | "dark",
): Promise<Recorded> {
  const context = await browser.newContext({ colorScheme, reducedMotion: "reduce" });
  if (saved) {
    await context.addInitScript((value) => localStorage.setItem("theme", value), saved);
  }
  await context.addInitScript(RECORD_THEME);
  const page = await context.newPage();
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const recorded = await page.evaluate(() => (window as unknown as { __theme: Recorded }).__theme);
  await context.close();
  return recorded;
}

test("CA-04: sistema escuro, sem escolha salva → escuro antes do <body>", async ({ browser }) => {
  const theme = await firstFrameTheme(browser, "dark");
  expect(theme.atBody).toBe("dark");
  expect(theme.atDomContentLoaded).toBe("dark");
});

test("RF-07: sistema claro, sem escolha salva → claro antes do <body>", async ({ browser }) => {
  const theme = await firstFrameTheme(browser, "light");
  expect(theme.atBody).toBe("light");
});

test("RF-07: a escolha salva vence o sistema já no primeiro quadro", async ({ browser }) => {
  expect((await firstFrameTheme(browser, "dark", "light")).atBody).toBe("light");
  expect((await firstFrameTheme(browser, "light", "dark")).atBody).toBe("dark");
});

test("RF-07: valor salvo inválido cai no tema do sistema", async ({ browser }) => {
  const context = await browser.newContext({ colorScheme: "dark" });
  await context.addInitScript(() => localStorage.setItem("theme", "sepia"));
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await context.close();
});

test("RF-07: o botão alterna o tema, persiste e muda as cores de fato", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  const html = page.locator("html");
  await expect(html).toHaveAttribute("data-theme", "light");
  const background = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  const lightBackground = await background();

  // O rótulo diz a ação (estado nunca só por cor, RNF-03).
  const toDark = page.getByRole("button", { name: t("theme.toDark", "en"), exact: true });
  await (await visibleInHeader(page, toDark)).click();
  await expect(html).toHaveAttribute("data-theme", "dark");
  await expect(
    page.getByRole("button", { name: t("theme.toLight", "en"), exact: true }).first(),
  ).toBeVisible();
  // Uma transição de cor (permitida sob reduced motion: não é movimento) pode atrasar o valor.
  await expect.poll(background).not.toBe(lightBackground);
  expect(await page.evaluate(() => localStorage.getItem("theme"))).toBe("dark");

  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "dark");
  // Depois do reload o rótulo acompanha o tema salvo.
  await expect(
    page.getByRole("button", { name: t("theme.toLight", "en"), exact: true }).first(),
  ).toBeAttached();
});

test("RF-07: o botão de tema tem nome em PT na página PT", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/pt/");
  const toggle = page.getByRole("button", { name: t("theme.toDark", "pt"), exact: true });
  await expect(toggle.first()).toBeAttached();
});
