// Seção 05 ("Por diversão"): a seção leve da home — ícone, nome, tagline, o porquê, as
// tecnologias e os links. Ela ainda não tem RF próprio no PRD (§5.1 lista cinco seções), então o
// contrato testado aqui é o do playgroundSchema + PlaygroundCard.astro: todo experimento é público
// (link de código), a demo é a exceção, e todo texto tem os dois idiomas (RN-01).
// O esperado vem do YAML real (tests/support/content.ts): nenhum número à mão.
import { expect, test, type Locator } from "@playwright/test";
import { localizedText, playgroundToys } from "../support/content";
import { homePath, LOCALES, SECTION_IDS, t, type Locale } from "./support";

const toys = playgroundToys();
const text = (value: unknown, locale: Locale) => localizedText(value, locale);

// O cartão é o <li> mais próximo do título (o mesmo padrão do home.spec.ts).
const cardOf = (heading: Locator) =>
  heading.locator("xpath=ancestor::*[self::article or self::li][1]");

// O rótulo do link vira regex para casar dentro do nome acessível, que também traz o aviso de
// nova aba. "(abre em nova aba)" tem parênteses: escapar é obrigatório.
const escapeRe = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// O YAML chega como Record<string, unknown>; sem `as`, a lista vem por guarda.
const stackOf = (data: Record<string, unknown>): string[] =>
  Array.isArray(data.stack) ? data.stack.map(String) : [];

for (const locale of LOCALES) {
  test.describe(`seção 05 ${locale}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(homePath(locale));
    });

    test("a seção #playground existe, com o h2 e a linha de apoio do idioma", async ({ page }) => {
      const section = page.locator(`#${SECTION_IDS.playground}`);
      await expect(section).toHaveCount(1);
      await expect(section.getByRole("heading", { level: 2 })).toHaveText(
        t("section.playground", locale),
      );
      await expect(section).toContainText(t("section.playground.subtitle", locale));
    });

    test("um cartão por experimento do YAML, na ordem de `order`", async ({ page }) => {
      const section = page.locator(`#${SECTION_IDS.playground}`);
      const headings = section.getByRole("heading", { level: 3 });
      await expect(headings).toHaveCount(toys.length);
      const rendered = (await headings.allInnerTexts()).map((value) => value.trim());
      expect(rendered).toEqual(toys.map((toy) => String(toy.data.name)));
    });

    test("cada cartão traz nome, tagline, o porquê e as tecnologias do idioma", async ({
      page,
    }) => {
      const section = page.locator(`#${SECTION_IDS.playground}`);
      for (const toy of toys) {
        const data = toy.data;
        const heading = section.getByRole("heading", {
          level: 3,
          name: String(data.name),
          exact: true,
        });
        const card = cardOf(heading);
        await expect(card, `cartão ${toy.id}`).toHaveCount(1);
        // O ícone é o único desenho do cartão e não entra no nome acessível (aria-hidden).
        await expect(heading.locator("svg")).toHaveCount(1);
        await expect(card).toContainText(text(data.tagline, locale));
        await expect(card).toContainText(text(data.why, locale));

        const stack = stackOf(data);
        const list = card.getByRole("list", { name: t("project.stack", locale) });
        await expect(list, `stack de ${toy.id}`).toHaveCount(1);
        await expect(list.getByRole("listitem")).toHaveCount(stack.length);
        for (const tech of stack) await expect(list).toContainText(tech);
      }
    });

    test("todo cartão linka o código; a demo aparece só onde o YAML tem liveUrl", async ({
      page,
    }) => {
      const section = page.locator(`#${SECTION_IDS.playground}`);
      for (const toy of toys) {
        const data = toy.data;
        const card = cardOf(
          section.getByRole("heading", { level: 3, name: String(data.name), exact: true }),
        );

        const repo = card.locator(`a[href="${String(data.repo)}"]`);
        await expect(repo, `link de código de ${toy.id}`).toHaveCount(1);
        await expect(repo).toBeVisible();
        await expect(repo).toContainText(t("playground.code", locale));

        // Sem demo o cartão tem UM link; com demo, dois. A contagem é o que impede o segundo link
        // de aparecer onde não há liveUrl.
        const live = data.liveUrl;
        await expect(card.getByRole("link"), `links de ${toy.id}`).toHaveCount(live ? 2 : 1);
        if (live !== undefined) {
          const demo = card.locator(`a[href="${String(live)}"]`);
          await expect(demo, `link de demo de ${toy.id}`).toHaveCount(1);
          await expect(demo).toBeVisible();
          await expect(demo).toContainText(t("playground.live", locale));
        }
      }
    });

    test("os links da seção abrem em nova aba com rel=noopener e aviso para leitor de tela", async ({
      page,
    }) => {
      const section = page.locator(`#${SECTION_IDS.playground}`);
      const links = section.getByRole("link");
      const expected = toys.length + toys.filter((toy) => toy.data.liveUrl !== undefined).length;
      await expect(links).toHaveCount(expected);

      const notice = t("a11y.newTab", locale);
      for (const link of await links.all()) {
        const href = (await link.getAttribute("href")) ?? "";
        await expect(link, `${href}: target`).toHaveAttribute("target", "_blank");
        await expect(link, `${href}: rel`).toHaveAttribute("rel", /\bnoopener\b/);
        // O aviso é sr-only: invisível na tela, presente no nome acessível.
        await expect(link, `${href}: aviso de nova aba`).toHaveAccessibleName(
          new RegExp(escapeRe(notice)),
        );
      }
    });

    test("a seção não manda JS: nenhuma ilha e nenhum <script> dentro dela", async ({ page }) => {
      const section = page.locator(`#${SECTION_IDS.playground}`);
      await expect(section.locator("astro-island")).toHaveCount(0);
      await expect(section.locator("script")).toHaveCount(0);
      // Nenhum link interno: a seção não tem página de detalhe (é o oposto de Projetos).
      await expect(section.locator('a[href^="/"], a[href^="#"]')).toHaveCount(0);
    });
  });
}
