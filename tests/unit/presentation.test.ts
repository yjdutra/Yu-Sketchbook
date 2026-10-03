// Helpers puros de apresentação: o traço da proposta de valor (Hero), a rotação do adesivo
// (álbum), a data de emissão e as strings com lacuna.
import { describe, expect, it } from "vitest";
import { tf } from "@/i18n/utils";
import { formatDate } from "@/lib/dates";
import { MAX_MARK_LENGTH, splitEmphasis } from "@/lib/emphasis";
import { profileSchema } from "@/lib/schemas";
import { stickerRotation } from "@/lib/sticker";
import { loadCollection } from "../support/content";

describe("splitEmphasis", () => {
  const join = (e: { before: string; mark: string; after: string }) => e.before + e.mark + e.after;

  it("usa o trecho pedido quando ele existe no texto", () => {
    const e = splitEmphasis("I build apps that work in real life.", "real life");
    expect(e).toEqual({ before: "I build apps that work in ", mark: "real life", after: "." });
  });

  it("sem trecho, marca a última oração depois da vírgula, sem o ponto", () => {
    const e = splitEmphasis("I build apps and AI systems that work in real life, not just demos.");
    expect(e.mark).toBe("not just demos");
    expect(e.after).toBe(".");
  });

  it("trecho pedido que não existe cai na regra padrão, sem perder texto", () => {
    const text = "Crio apps e sistemas de IA que funcionam de verdade, não só no slide.";
    expect(join(splitEmphasis(text, "inexistente"))).toBe(text);
  });

  it("última oração longa demais vira as 3 últimas palavras (não abre rolagem no celular)", () => {
    const text = `Short start, ${"a very long closing clause that goes on ".repeat(2).trim()}.`;
    const e = splitEmphasis(text);
    expect(e.mark.split(" ")).toHaveLength(3);
    expect(e.mark.length).toBeLessThanOrEqual(MAX_MARK_LENGTH);
    expect(join(e)).toBe(text);
  });

  it("o profile real produz um traço nos dois idiomas", () => {
    const profile = profileSchema.parse(loadCollection("profile")[0]?.data);
    for (const locale of ["en", "pt"] as const) {
      const e = splitEmphasis(profile.valueProp[locale], profile.valuePropMark?.[locale]);
      expect(e.mark.length).toBeGreaterThan(0);
      expect(e.mark.length).toBeLessThanOrEqual(MAX_MARK_LENGTH);
    }
  });
});

describe("profileSchema.valuePropMark", () => {
  const profile = loadCollection("profile")[0]?.data ?? {};

  it("recusa um trecho que não está na valueProp do mesmo idioma", () => {
    const data = { ...profile, valuePropMark: { en: "real life", pt: "real life" } };
    expect(profileSchema.safeParse(data).success).toBe(false);
  });
});

describe("stickerRotation", () => {
  it("é determinística (o selo não pula entre deploys)", () => {
    expect(stickerRotation("claude-code-101")).toBe(stickerRotation("claude-code-101"));
  });

  it("fica entre −4° e 4°, com uma casa decimal", () => {
    for (const slug of ["claude-code-101", "intro-mcp", "mcp-advanced-topics", "a", ""]) {
      const angle = stickerRotation(slug);
      expect(Math.abs(angle)).toBeLessThanOrEqual(4);
      expect(Math.round(angle * 10) / 10).toBe(angle);
    }
  });

  it("slugs parecidos não ficam com o mesmo ângulo", () => {
    const angles = new Set(loadCollection("credentials").map((c) => stickerRotation(c.id)));
    expect(angles.size).toBeGreaterThan(1);
  });
});

describe("formatDate", () => {
  it("dia 1 à meia-noite UTC não volta um dia no fuso negativo", () => {
    expect(formatDate(new Date("2026-08-01"), "en")).toBe("Aug 1, 2026");
    expect(formatDate(new Date("2026-08-21"), "pt")).toBe("21 de ago. de 2026");
  });
});

describe("tf", () => {
  it("preenche as lacunas no idioma pedido", () => {
    expect(tf("metric.change", "en", { before: "5 s", after: "<400 ms" })).toBe(
      "From 5 s to <400 ms",
    );
    expect(tf("metric.change", "pt", { before: "5 s", after: "<400 ms" })).toBe(
      "De 5 s para <400 ms",
    );
  });

  it("lacuna sem valor fica visível, não vira 'undefined'", () => {
    expect(tf("metric.change", "en", { before: "5 s" })).toBe("From 5 s to {after}");
  });
});
