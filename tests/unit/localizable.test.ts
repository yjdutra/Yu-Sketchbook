// resolveLocalizable: métrica neutra ("<400 ms") ou que se traduz ("days" / "dias").
import { describe, expect, it } from "vitest";
import { resolveLocalizable } from "@/lib/localizable";

describe("resolveLocalizable", () => {
  it("valor neutro volta igual nos dois idiomas", () => {
    expect(resolveLocalizable("<400 ms", "en")).toBe("<400 ms");
    expect(resolveLocalizable("<400 ms", "pt")).toBe("<400 ms");
  });

  it("número neutro volta igual", () => {
    expect(resolveLocalizable(35, "pt")).toBe(35);
  });

  it("Localized resolve no idioma pedido", () => {
    const value = { en: "3 days", pt: "3 dias" };
    expect(resolveLocalizable(value, "en")).toBe("3 days");
    expect(resolveLocalizable(value, "pt")).toBe("3 dias");
  });
});
