// Regras puras de seleção e ordem (src/lib/content-rules.ts): RN-03 (draft), RF-10/11 (Impacto),
// RF-15/16 (ordem) e RN-04 (referência achievement → experiência).
import { describe, expect, it } from "vitest";
import {
  achievementsOf,
  byOrder,
  danglingAchievements,
  isImpact,
  isPublished,
} from "@/lib/content-rules";

describe("isPublished — RN-03 / CA-09", () => {
  it("draft fica fora do build de produção", () => {
    expect(isPublished({ draft: true }, false)).toBe(false);
  });

  it("não-draft é publicado", () => {
    expect(isPublished({ draft: false }, false)).toBe(true);
    expect(isPublished({ draft: false }, true)).toBe(true);
  });

  it("em dev o draft aparece para revisão", () => {
    expect(isPublished({ draft: true }, true)).toBe(true);
  });
});

describe("byOrder — RF-15 / RF-16", () => {
  it("ordena por `order` crescente", () => {
    const items = [3, 1, 2].map((order) => ({ id: `x${order}`, data: { order } }));
    expect(items.sort(byOrder).map((i) => i.data.order)).toEqual([1, 2, 3]);
  });

  it("aceita ordem negativa e empate sem lançar", () => {
    const items = [0, -1, 0].map((order, i) => ({ id: `x${i}`, data: { order } }));
    expect(items.sort(byOrder).map((i) => i.data.order)).toEqual([-1, 0, 0]);
  });
});

const ach = (id: string, experience: string) => ({ id, data: { experience: { id: experience } } });

describe("achievementsOf — RN-04", () => {
  const all = [ach("a", "smartek"), ach("b", "supera"), ach("c", "smartek")];

  it("deriva a lista da referência no achievement, mantendo a ordem de entrada", () => {
    expect(achievementsOf(all, "smartek").map((a) => a.id)).toEqual(["a", "c"]);
  });

  it("experiência sem achievement devolve lista vazia", () => {
    expect(achievementsOf(all, "bristom")).toEqual([]);
  });
});

describe("danglingAchievements — RN-04", () => {
  const experiences = new Set(["smartek", "supera"]);

  it("vazio quando toda referência existe", () => {
    expect(danglingAchievements([ach("a", "smartek"), ach("b", "supera")], experiences)).toEqual(
      [],
    );
  });

  it("aponta o achievement cuja experiência não existe", () => {
    const dangling = danglingAchievements(
      [ach("a", "smartek"), ach("typo", "smartk"), ach("gone", "bristom")],
      experiences,
    );
    expect(dangling.map((a) => a.id)).toEqual(["typo", "gone"]);
  });
});

describe("isImpact — RF-10 / RF-11", () => {
  const metric = { after: "<400 ms", label: { en: "l", pt: "l" } };

  it("destaque com métrica entra em Impacto", () => {
    expect(isImpact({ featured: true, metric })).toBe(true);
  });

  it("destaque sem métrica fica só na Trajetória", () => {
    expect(isImpact({ featured: true })).toBe(false);
  });

  it("métrica sem destaque não entra", () => {
    expect(isImpact({ featured: false, metric })).toBe(false);
  });
});
