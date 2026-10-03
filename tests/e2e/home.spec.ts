// CA-05 (RF-10) e o resto do que a home promete ao recrutador: Hero (RF-08), Projetos (RF-12/13),
// Trajetória (RF-16/17) e Contato (RF-09). O esperado vem do YAML real, não de números à mão.
import { expect, test, type Locator, type Page } from "@playwright/test";
import { impactAchievements, loadCollection, localizedText } from "../support/content";
import { homePath, LOCALES, SECTION_IDS, SITE, t, type Locale } from "./support";

const profile = loadCollection("profile")[0]?.data ?? {};
const experiences = loadCollection("experience").sort(
  (a, b) => Number(a.data.order) - Number(b.data.order),
);
const companyOf = new Map(experiences.map((e) => [e.id, String(e.data.company)]));
const impact = impactAchievements();
const allAchievements = loadCollection("achievements");
const projects = loadCollection("projects").filter((p) => p.data.draft !== true);

const text = (value: unknown, locale: Locale) => localizedText(value, locale);
const cvHref = (locale: Locale) => text(profile.cv, locale);

// O cartão é o <article>/<li> mais próximo do título.
const cardOf = (heading: Locator) =>
  heading.locator("xpath=ancestor::*[self::article or self::li][1]");

async function externalLinksOpenSafely(page: Page) {
  const bad = await page.evaluate((site) => {
    return [...document.querySelectorAll<HTMLAnchorElement>("a[href^='http']")]
      .filter((a) => !a.href.startsWith(site) && !a.href.startsWith(location.origin))
      .filter((a) => a.target !== "_blank" || !/\bnoopener\b/.test(a.rel))
      .map((a) => `${a.href} (target=${a.target || "-"}, rel=${a.rel || "-"})`);
  }, SITE);
  expect(bad, "RF-09: link externo abre em nova aba com rel=noopener").toEqual([]);
}

for (const locale of LOCALES) {
  test.describe(`home ${locale}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(homePath(locale));
    });

    test("CA-05: Impacto tem de 6 a 8 cartões, cada um completo", async ({ page }) => {
      const section = page.locator(`#${SECTION_IDS.impact}`);
      await expect(section.getByRole("heading", { level: 2 })).toHaveText(
        t("section.impact", locale),
      );
      const cards = section.getByRole("heading", { level: 3 });
      await expect(cards).toHaveCount(impact.length);
      expect(impact.length).toBeGreaterThanOrEqual(6);
      expect(impact.length).toBeLessThanOrEqual(8);

      for (const achievement of impact) {
        const data = achievement.data;
        const title = text(data.title, locale);
        const card = cardOf(section.getByRole("heading", { level: 3, name: title, exact: true }));
        await expect(card, `cartão "${title}"`).toHaveCount(1);
        const metric = data.metric as { before?: unknown; after: unknown; label: unknown };
        await expect(card).toContainText(text(metric.after, locale));
        if (metric.before !== undefined)
          await expect(card).toContainText(text(metric.before, locale));
        await expect(card).toContainText(text(metric.label, locale));
        await expect(card).toContainText(text(data.problem, locale));
        await expect(card).toContainText(text(data.action, locale));
        await expect(card).toContainText(text(data.result, locale));
        await expect(card).toContainText(companyOf.get(String(data.experience)) ?? "<empresa>");
      }
    });

    test("RF-08: Hero com nome, papel, proposta, local e os 3 CTAs", async ({ page }) => {
      const h1 = page.getByRole("heading", { level: 1 });
      await expect(h1).toHaveCount(1);
      await expect(h1).toContainText(String(profile.name));
      const main = page.getByRole("main");
      await expect(main).toContainText(text(profile.headline, locale));
      await expect(main).toContainText(text(profile.valueProp, locale));
      await expect(main).toContainText(text(profile.location, locale));

      const hero = page.locator("main section, main header").filter({ has: h1 }).last();
      await expect(hero.locator('a[href$="#projects"]').first()).toBeVisible();
      await expect(hero.locator(`a[href="${cvHref(locale)}"]`).first()).toBeVisible();
      await expect(hero.locator('a[href$="#contact"]').first()).toBeVisible();
    });

    test("RF-09: Contato com e-mail, LinkedIn, GitHub e CV do idioma", async ({ page }) => {
      const contact = page.locator(`#${SECTION_IDS.contact}`);
      const links = profile.links as { linkedin: string; github: string };
      await expect(contact.locator(`a[href="mailto:${String(profile.email)}"]`)).toHaveCount(1);
      await expect(contact.locator(`a[href="${links.linkedin}"]`)).toHaveCount(1);
      await expect(contact.locator(`a[href="${links.github}"]`)).toHaveCount(1);
      await expect(contact.locator(`a[href="${cvHref(locale)}"]`)).toHaveCount(1);
      await externalLinksOpenSafely(page);
    });

    test("RF-12/13: cada projeto publicado tem cartão completo", async ({ page }) => {
      const section = page.locator(`#${SECTION_IDS.projects}`);
      for (const project of projects) {
        const data = project.data;
        const card = cardOf(section.getByRole("heading", { name: String(data.name), exact: true }));
        await expect(card, `cartão ${project.id}`).toHaveCount(1);
        await expect(card).toContainText(text(data.tagline, locale));
        const statusKey = `project.status.${String(data.status)}` as Parameters<typeof t>[0];
        await expect(card).toContainText(t(statusKey, locale));
        const visibilityKey = `project.visibility.${String(data.visibility)}` as Parameters<
          typeof t
        >[0];
        await expect(card).toContainText(t(visibilityKey, locale));
        await expect(card.getByRole("img", { name: text(data.coverAlt, locale) })).toHaveCount(1);
        await expect(card.locator(`a[href*="/projects/${project.id}/"]`).first()).toBeVisible();
        if (data.visibility === "restricted") {
          // RF-13 / CA-06: restrito não vaza link de código.
          await expect(card.locator('a[href*="github.com"]')).toHaveCount(0);
        }
      }
    });

    test("CA-06: projeto restrito mostra o cadeado e nenhum link de repositório", async ({
      page,
    }) => {
      const restricted = projects.filter((p) => p.data.visibility === "restricted");
      test.skip(restricted.length === 0, "nenhum projeto restricted publicado no conteúdo atual");
      const section = page.locator(`#${SECTION_IDS.projects}`);
      for (const project of restricted) {
        const card = cardOf(
          section.getByRole("heading", { name: String(project.data.name), exact: true }),
        );
        await expect(card).toContainText(t("project.visibility.restricted", locale));
        await expect(card.locator("svg")).not.toHaveCount(0);
        await expect(card.locator('a[href*="github.com"]')).toHaveCount(0);
      }
    });

    test("RF-16: Trajetória da experiência mais recente à mais antiga, formação no fim", async ({
      page,
    }) => {
      const journey = page.locator(`#${SECTION_IDS.journey}`);
      const content = (await journey.innerText()).replace(/\s+/g, " ");
      const positions = experiences.map((e) => {
        const summary = text(e.data.summary, locale).replace(/\s+/g, " ").slice(0, 60);
        return { id: e.id, at: content.indexOf(summary) };
      });
      for (const p of positions)
        expect(p.at, `resumo de ${p.id} na Trajetória`).toBeGreaterThan(-1);
      const order = positions.map((p) => p.at);
      expect([...order].sort((a, b) => a - b)).toEqual(order);

      const education = (profile.education as { institution: string }[] | undefined) ?? [];
      for (const item of education) {
        expect(content.indexOf(item.institution)).toBeGreaterThan(Math.max(...order));
      }
      // A data do YAML é meia-noite UTC; o mês certo é o do UTC (ver tests/unit/dates.test.ts).
      const month = new Intl.DateTimeFormat(locale === "en" ? "en" : "pt-BR", {
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      });
      for (const e of experiences) {
        await expect(journey).toContainText(String(e.data.company));
        await expect(journey).toContainText(text(e.data.role, locale));
        await expect(journey).toContainText(month.format(new Date(String(e.data.start))));
      }
    });

    test("RF-17: o que já está em Impacto vira link de âncora, não texto repetido", async ({
      page,
    }) => {
      const journey = page.locator(`#${SECTION_IDS.journey}`);
      const targetsInImpact = await journey.evaluate((root) => {
        const ids = [...root.querySelectorAll<HTMLAnchorElement>("a[href*='#']")]
          .map((a) => decodeURIComponent(new URL(a.href).hash.slice(1)))
          .filter((id) => document.getElementById(id)?.closest("#impact"));
        return [...new Set(ids)];
      });
      expect(targetsInImpact.length).toBe(impact.length);

      const impactIds = new Set(impact.map((a) => a.id));
      for (const achievement of impact) {
        await expect(journey).not.toContainText(text(achievement.data.problem, locale));
      }
      // Os que não estão em Impacto aparecem por extenso na experiência de origem (RF-11).
      for (const achievement of allAchievements.filter((a) => !impactIds.has(a.id))) {
        await expect(journey).toContainText(text(achievement.data.title, locale));
      }
    });
  });
}
