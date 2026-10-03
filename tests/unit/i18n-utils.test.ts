// RF-06: a troca de idioma leva para a página equivalente. Espelha o astro.config.mjs: EN sem
// prefixo, PT em /pt, trailingSlash "always" (exceto arquivo).
import { describe, expect, it } from "vitest";
import { SECTION_IDS, ui } from "@/i18n/ui";
import {
  alternatePath,
  getLocale,
  HTML_LANG,
  isLocale,
  localizePath,
  stripLocale,
  t,
} from "@/i18n/utils";

describe("localizePath", () => {
  it.each([
    ["/", "en", "/"],
    ["/", "pt", "/pt/"],
    ["/projects/yu-book", "en", "/projects/yu-book/"],
    ["/projects/yu-book/", "pt", "/pt/projects/yu-book/"],
    ["/pt/projects/yu-book/", "en", "/projects/yu-book/"],
    ["/pt/projects/yu-book/", "pt", "/pt/projects/yu-book/"],
    ["/pt", "en", "/"],
    ["/pt", "pt", "/pt/"],
    ["/#contact", "pt", "/pt/#contact"],
    ["/pt/#contact", "en", "/#contact"],
    ["/projects/yu-book/?utm_source=linkedin", "pt", "/pt/projects/yu-book/?utm_source=linkedin"],
    ["/cv/yuri-dutra-cv-en.pdf", "en", "/cv/yuri-dutra-cv-en.pdf"],
  ] as const)("%s em %s → %s", (path, locale, expected) => {
    expect(localizePath(path, locale)).toBe(expected);
  });

  it("não confunde um caminho que só começa com 'pt' com o prefixo de idioma", () => {
    expect(localizePath("/ptx/", "en")).toBe("/ptx/");
    expect(localizePath("/ptx/", "pt")).toBe("/pt/ptx/");
  });
});

describe("alternatePath — CA-03", () => {
  it("/projects/yu-book/ → /pt/projects/yu-book/ e volta", () => {
    expect(alternatePath("/projects/yu-book/", "pt")).toBe("/pt/projects/yu-book/");
    expect(alternatePath("/pt/projects/yu-book/", "en")).toBe("/projects/yu-book/");
  });

  it("a 404 PT gerada em /pt/404/ tem equivalente EN em /404/", () => {
    expect(alternatePath("/pt/404/", "en")).toBe("/404/");
  });
});

describe("stripLocale", () => {
  it("remove só o prefixo /pt", () => {
    expect(stripLocale("/pt/")).toBe("/");
    expect(stripLocale("/pt/projects/x/")).toBe("/projects/x/");
    expect(stripLocale("/projects/x/")).toBe("/projects/x/");
  });
});

describe("getLocale / isLocale", () => {
  it("currentLocale desconhecido ou ausente cai no padrão en", () => {
    expect(getLocale({ currentLocale: "pt" })).toBe("pt");
    expect(getLocale({ currentLocale: undefined })).toBe("en");
    expect(getLocale({ currentLocale: "es" })).toBe("en");
    expect(isLocale("pt")).toBe(true);
    expect(isLocale("pt-BR")).toBe(false);
  });

  it("HTML_LANG usa pt-BR (o texto é português do Brasil)", () => {
    expect(HTML_LANG).toEqual({ en: "en", pt: "pt-BR" });
  });
});

describe("strings de interface — RN-01", () => {
  it.each(Object.keys(ui) as (keyof typeof ui)[])("%s tem en e pt não vazios", (key) => {
    expect(t(key, "en").trim()).not.toBe("");
    expect(t(key, "pt").trim()).not.toBe("");
  });

  it("as âncoras do RF-01 são as do PRD, iguais nos dois idiomas", () => {
    expect(Object.values(SECTION_IDS)).toEqual([
      "impact",
      "projects",
      "journey",
      "credentials",
      "contact",
    ]);
  });
});
