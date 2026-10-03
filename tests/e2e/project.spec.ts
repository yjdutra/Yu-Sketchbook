// RF-14: a página do projeto, nos dois idiomas, com o conteúdo do YAML.
import { expect, test } from "@playwright/test";
import { loadCollection, localizedText } from "../support/content";
import { homePath, LOCALES, projectPath, t } from "./support";

const projects = loadCollection("projects").filter((p) => p.data.draft !== true);

for (const project of projects) {
  for (const locale of LOCALES) {
    test(`RF-14: ${project.id} ${locale} mostra problema, o que faz, galeria, destaques e stack`, async ({
      page,
    }) => {
      const data = project.data;
      const text = (value: unknown) => localizedText(value, locale);
      await page.goto(projectPath(project.id, locale));

      await expect(page.getByRole("heading", { level: 1 })).toContainText(String(data.name));
      const main = page.getByRole("main");
      await expect(main).toContainText(text(data.problem));
      await expect(main).toContainText(text(data.whatItDoes));
      for (const highlight of data.highlights as { title: unknown }[]) {
        await expect(main).toContainText(text(highlight.title));
      }
      for (const tech of data.stack as string[]) await expect(main).toContainText(tech);

      // Galeria: cada screenshot com o alt do YAML (RF-14, RNF-03).
      for (const item of (data.gallery as { alt: unknown }[] | undefined) ?? []) {
        await expect(main.getByRole("img", { name: text(item.alt), exact: true })).toHaveCount(1);
      }

      if (data.visibility === "public") {
        const repo = main.locator(`a[href="${String(data.repo)}"]`).first();
        await expect(repo).toBeVisible();
        await expect(repo).toHaveAttribute("target", "_blank");
        await expect(repo).toHaveAttribute("rel", /noopener/);
      } else {
        await expect(main.locator('a[href*="github.com"]')).toHaveCount(0);
        await expect(main).toContainText(t("project.visibility.restricted", locale));
      }
      if (data.liveUrl) {
        await expect(main.locator(`a[href="${String(data.liveUrl)}"]`).first()).toBeVisible();
      }

      // Volta para a home no mesmo idioma.
      const back = page.getByRole("link", { name: t("project.backHome", locale) }).first();
      await expect(back).toHaveAttribute("href", new RegExp(`^${homePath(locale)}`));
    });
  }
}

test("RN-03: a rota de um projeto draft não existe", async ({ page }) => {
  const drafts = loadCollection("projects").filter((p) => p.data.draft === true);
  test.skip(
    drafts.length === 0,
    "nenhum projeto draft no conteúdo atual (o pnpm budget também confere)",
  );
  for (const draft of drafts) {
    for (const locale of LOCALES) {
      const response = await page.goto(projectPath(draft.id, locale));
      expect(response?.status()).toBe(404);
    }
  }
});

test("RF-05: a 404 tem link de volta para a home, nos dois idiomas", async ({ page }) => {
  const response = await page.goto("/this-page-does-not-exist/");
  expect(response?.status()).toBe(404);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("link", { name: t("notFound.backHome", "en") })).toHaveAttribute(
    "href",
    "/",
  );

  await page.goto("/pt/404/");
  await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
  await expect(page.getByRole("link", { name: t("notFound.backHome", "pt") })).toHaveAttribute(
    "href",
    "/pt/",
  );
});
