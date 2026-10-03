// CA-07 (RF-18, RF-19, RF-20): o álbum de badges por teclado. A ilha é `client:visible`, então
// cada teste rola até #credentials e espera a hidratação antes de interagir.
import { expect, test, type Locator, type Page } from "@playwright/test";
import { loadCollection, localizedText } from "../support/content";
import { homePath, LOCALES, SECTION_IDS, t, type Locale } from "./support";

const credentials = loadCollection("credentials").sort(
  (a, b) => Number(a.data.order) - Number(b.data.order),
);
const album = credentials.filter((c) => c.data.badge !== undefined);
const list = credentials.filter((c) => c.data.badge === undefined);

async function openAlbum(page: Page, locale: Locale) {
  await page.goto(homePath(locale));
  const section = page.locator(`#${SECTION_IDS.credentials}`);
  await section.scrollIntoViewIfNeeded();
  await expect(section.locator("astro-island")).not.toHaveCount(0);
  await expect(section.locator("astro-island[ssr]")).toHaveCount(0);
  // O selo é o controle com aria-expanded (RF-19 / CA-07).
  const badges = section.locator("[aria-expanded]");
  await expect(badges).toHaveCount(album.length);
  return { section, badges };
}

const isFocused = (locator: Locator) => locator.evaluate((el) => el === document.activeElement);

// Para a mensagem de erro: quem está com o foco de fato.
const activeElement = (page: Page) =>
  page.evaluate(() => {
    const el = document.activeElement;
    if (!el) return "nenhum";
    const name = el.getAttribute("aria-label") ?? el.textContent?.trim().slice(0, 40) ?? "";
    const controls = el.getAttribute("aria-controls") ?? "-";
    return `${el.tagName.toLowerCase()} "${name}" (${el.className || "-"}, controls=${controls})`;
  });

// Chega ao selo como o visitante: Tab a partir do título da seção.
async function tabTo(page: Page, section: Locator, target: Locator) {
  await section.getByRole("heading", { level: 2 }).click();
  for (let i = 0; i < 30; i += 1) {
    await page.keyboard.press("Tab");
    if (await isFocused(target)) return;
  }
  throw new Error("o selo não recebeu foco pelo Tab em 30 passos");
}

const verifyIn = (scope: Locator, locale: Locale) =>
  scope.getByRole("link", { name: new RegExp(t("credential.verify", locale), "i") });

// O verso do selo: o elemento controlado (aria-controls) ou, sem ele, o item do selo.
async function backOf(page: Page, badge: Locator): Promise<Locator> {
  const controls = await badge.getAttribute("aria-controls");
  if (controls) return page.locator(`[id="${controls}"]`);
  return badge.locator("xpath=ancestor::*[self::li or self::article][1]");
}

for (const locale of LOCALES) {
  test.describe(`álbum ${locale}`, () => {
    test("CA-07: Tab + Enter vira o selo, Verify só entra no Tab quando virado, Esc devolve o foco", async ({
      page,
    }) => {
      const { section, badges } = await openAlbum(page, locale);
      const first = badges.first();
      const second = badges.nth(1);
      const credential = album[0];
      if (!credential) throw new Error("álbum vazio no conteúdo");

      await tabTo(page, section, first);
      await expect(first).toHaveAttribute("aria-expanded", "false");

      // Desvirado: o Tab pula do 1º selo para o 2º, sem passar pelo Verify escondido.
      await page.keyboard.press("Tab");
      expect(await isFocused(second), "o Tab foi do 1º selo direto para o 2º").toBe(true);
      await page.keyboard.press("Shift+Tab");
      expect(await isFocused(first)).toBe(true);

      await page.keyboard.press("Enter");
      await expect(first).toHaveAttribute("aria-expanded", "true");
      const back = await backOf(page, first);
      await expect(back).toBeVisible();
      await expect(back).toContainText(String(credential.data.name));
      const skills = (credential.data.skills as unknown[] | undefined) ?? [];
      if (skills[0]) await expect(back).toContainText(localizedText(skills[0], locale));

      if (credential.data.verifyUrl) {
        const verify = verifyIn(back, locale);
        // O CA pede o verso visível antes do próximo Tab. Esperar o Verify visível aqui não
        // esconde defeito: o atraso de um quadro sob reduced motion tem teste próprio abaixo.
        await expect(verify).toBeVisible();
        await page.keyboard.press("Tab");
        await expect(verify).toHaveAttribute("href", String(credential.data.verifyUrl));
        expect(
          await isFocused(verify),
          `o Tab do selo virado vai para o Verify; foco em: ${await activeElement(page)}`,
        ).toBe(true);
        await expect(verify).toHaveAttribute("target", "_blank");
        await expect(verify).toHaveAttribute("rel", /noopener/);
      }

      await page.keyboard.press("Escape");
      await expect(first).toHaveAttribute("aria-expanded", "false");
      expect(await isFocused(first), "Esc devolve o foco ao selo").toBe(true);
    });

    test("RF-19: Espaço vira e Esc desvira com o foco no próprio selo", async ({ page }) => {
      const { section, badges } = await openAlbum(page, locale);
      const first = badges.first();
      await tabTo(page, section, first);
      await page.keyboard.press("Space");
      await expect(first).toHaveAttribute("aria-expanded", "true");
      await page.keyboard.press("Escape");
      await expect(first).toHaveAttribute("aria-expanded", "false");
      expect(await isFocused(first)).toBe(true);
    });

    test("RF-19: clique vira e um novo clique desvira", async ({ page }) => {
      const { badges } = await openAlbum(page, locale);
      const second = badges.nth(1);
      await second.click();
      await expect(second).toHaveAttribute("aria-expanded", "true");
      // Virado, o que está sob o dedo é o verso: o "novo clique" do RF-19 é nele (fora do link).
      const back = await backOf(page, second);
      await back.getByRole("heading").first().click();
      await expect(second).toHaveAttribute("aria-expanded", "false");
    });

    test("RF-18 / RF-20: álbum agrupado com contagem e lista simples sem badge", async ({
      page,
    }) => {
      const { section } = await openAlbum(page, locale);
      const tracks = new Map<string, number>();
      for (const c of album) {
        const track = String(c.data.track ?? c.data.issuer);
        tracks.set(track, (tracks.get(track) ?? 0) + 1);
      }
      for (const [track, count] of tracks) {
        await expect(section).toContainText(new RegExp(`${track}\\s*·\\s*${count}`));
      }
      for (const c of list) await expect(section).toContainText(String(c.data.name));
      // Cada selo tem nome acessível (o verso não é a única fonte do nome).
      for (const badge of await section.locator("[aria-expanded]").all()) {
        expect(
          (await badge.evaluate((el) => el.textContent ?? "")).trim().length > 0 ||
            (await badge.getAttribute("aria-label")) !== null ||
            (await badge.locator("img[alt]:not([alt=''])").count()) > 0,
        ).toBe(true);
      }
    });
  });
}

// RNF-03: o giro do selo existe com movimento liberado e some sob reduced motion. Único teste que
// liga o movimento (skill portoes-de-qualidade §2).
const motionOf = (root: Locator) =>
  root.evaluate((el) => {
    const moving = /^(all|transform|rotate|translate|scale)$/;
    const seconds = (value: string) =>
      value.split(",").map((v) => (v.trim().endsWith("ms") ? parseFloat(v) / 1000 : parseFloat(v)));
    let max = 0;
    for (const node of [el, ...el.querySelectorAll("*")]) {
      const style = getComputedStyle(node);
      const props = style.transitionProperty.split(",").map((p) => p.trim());
      const durations = seconds(style.transitionDuration);
      props.forEach((prop, i) => {
        const d = durations[i % durations.length] ?? 0;
        if (moving.test(prop)) max = Math.max(max, d);
      });
      if (style.animationName !== "none") {
        max = Math.max(max, ...seconds(style.animationDuration));
      }
    }
    return max;
  });

test.describe("movimento do álbum", () => {
  test.use({ contextOptions: { reducedMotion: "no-preference" } });

  test("RNF-03: com movimento liberado, o selo anima ao virar", async ({ page }) => {
    const { section } = await openAlbum(page, "en");
    expect(await motionOf(section.locator("astro-island").first())).toBeGreaterThan(0.01);
  });
});

test("RNF-03: sob prefers-reduced-motion, nada no álbum se move", async ({ page }) => {
  const { section, badges } = await openAlbum(page, "en");
  await badges.first().click();
  expect(await motionOf(section.locator("astro-island").first())).toBeLessThanOrEqual(0.01);
});

// Sob reduced motion, virar o selo mostra o verso no mesmo quadro. Uma transição de `visibility`
// (mesmo de 0,01 ms) mantém o Verify escondido até o próximo quadro, e um Tab rápido o pula.
test("RNF-03 / CA-07: sob reduced motion, o verso não tem transição de visibility", async ({
  page,
}) => {
  const { badges } = await openAlbum(page, "en");
  const back = await backOf(page, badges.first());
  const offenders = await back.evaluate((root) => {
    const seconds = (v: string) => (v.trim().endsWith("ms") ? parseFloat(v) / 1000 : parseFloat(v));
    return [root, ...root.querySelectorAll("*")]
      .filter((node) => {
        const style = getComputedStyle(node);
        const props = style.transitionProperty.split(",").map((p) => p.trim());
        const durations = style.transitionDuration.split(",").map(seconds);
        const delays = style.transitionDelay.split(",").map(seconds);
        return props.some((prop, i) => {
          const total =
            (durations[i % durations.length] ?? 0) + Math.max(0, delays[i % delays.length] ?? 0);
          return (prop === "all" || prop === "visibility") && total > 0;
        });
      })
      .map((node) => {
        const style = getComputedStyle(node);
        return `${node.tagName.toLowerCase()}: ${style.transitionProperty} ${style.transitionDuration}`;
      });
  });
  expect(offenders, "elementos do verso com transição de visibility").toEqual([]);
});
