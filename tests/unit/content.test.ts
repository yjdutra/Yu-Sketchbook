// Invariantes do conteúdo real (src/content/**), aplicando as regras puras ao YAML. Pega cedo, sem
// build, o que o PRD exige da combinação de entradas e que nenhum schema isolado enxerga.
import { describe, expect, it } from "vitest";
import { danglingAchievements, isImpact, isPublished } from "@/lib/content-rules";
import { impactAchievements, loadCollection, projectSlugs } from "../support/content";

describe("conteúdo real", () => {
  it("existe exatamente um profile", () => {
    expect(loadCollection("profile")).toHaveLength(1);
  });

  it("RF-10 / CA-05: de 6 a 8 achievements de Impacto (featured e com métrica)", () => {
    const count = loadCollection("achievements").filter((a) =>
      isImpact({ featured: a.data.featured === true, metric: a.data.metric }),
    ).length;
    expect(count).toBe(impactAchievements().length);
    expect(count).toBeGreaterThanOrEqual(6);
    expect(count).toBeLessThanOrEqual(8);
  });

  it("RN-04: todo achievement aponta para uma experiência existente", () => {
    const experiences = new Set(loadCollection("experience").map((e) => e.id));
    const achievements = loadCollection("achievements").map((a) => ({
      id: a.id,
      data: { experience: { id: String(a.data.experience) } },
    }));
    expect(danglingAchievements(achievements, experiences).map((a) => a.id)).toEqual([]);
  });

  it("RN-05: credencial com badge vai para o álbum; sem badge, para a lista", () => {
    const credentials = loadCollection("credentials");
    const album = credentials.filter((c) => c.data.badge !== undefined);
    const list = credentials.filter((c) => c.data.badge === undefined);
    // Decisão do Yuri (2026-10-03): 4 selos da Claude Academy no álbum, 2 da AWS na lista.
    expect(album.map((c) => c.data.track)).toEqual(Array(album.length).fill("Claude Academy"));
    expect(album.length).toBe(4);
    expect(list.length).toBe(2);
  });

  it("RN-03 / CA-09: o filtro de produção remove exatamente os drafts", () => {
    const { published, drafts } = projectSlugs();
    const filtered = loadCollection("projects")
      .filter((p) => isPublished({ draft: p.data.draft === true }, false))
      .map((p) => p.id);
    expect(filtered).toEqual(published);
    for (const slug of drafts) expect(filtered).not.toContain(slug);
    // O CA-03 testa a troca de idioma em /projects/yu-book: ele precisa continuar publicado.
    expect(published).toContain("yu-book");
  });
});
