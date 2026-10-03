// Funções puras de idioma e rota. Não importam `astro:i18n` de propósito: assim o Vitest testa a
// troca de idioma (RF-06) sem subir o Astro. As regras espelham o astro.config.mjs: EN sem
// prefixo, PT em /pt, trailingSlash "always".
import { ui, type UiKey } from "@/i18n/ui";

export const LOCALES = ["en", "pt"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

// Valor de <html lang> e de hreflang. "pt-BR" porque o texto é português do Brasil.
export const HTML_LANG: Record<Locale, string> = { en: "en", pt: "pt-BR" };

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

// Recebe o `Astro` da página (só o campo que interessa, para não acoplar ao tipo inteiro).
export function getLocale(astro: { currentLocale: string | undefined }): Locale {
  return isLocale(astro.currentLocale) ? astro.currentLocale : DEFAULT_LOCALE;
}

export function t(key: UiKey, locale: Locale): string {
  return ui[key][locale];
}

// String com lacunas ("From {before} to {after}"). Lacuna sem valor fica como está, para o erro
// aparecer na tela em vez de virar "undefined".
export function tf(key: UiKey, locale: Locale, values: Record<string, string | number>): string {
  return t(key, locale).replace(/\{(\w+)\}/g, (slot, name: string) => {
    const value = values[name];
    return value === undefined ? slot : String(value);
  });
}

// Separa "/projects/x/?a=1#y" em caminho e sufixo, para mexer só no caminho.
function splitPath(path: string): { pathname: string; suffix: string } {
  const cut = path.search(/[?#]/);
  return cut === -1
    ? { pathname: path, suffix: "" }
    : { pathname: path.slice(0, cut), suffix: path.slice(cut) };
}

// trailingSlash "always", exceto arquivo (/cv/yuri-dutra-cv-en.pdf).
function withTrailingSlash(pathname: string): string {
  if (pathname.endsWith("/") || /\.[a-z0-9]+$/i.test(pathname)) return pathname;
  return `${pathname}/`;
}

// "/pt/projects/x/" → "/projects/x/". Caminho já neutro volta igual.
export function stripLocale(path: string): string {
  const { pathname, suffix } = splitPath(path);
  const neutral = pathname.replace(/^\/pt(?=\/|$)/, "") || "/";
  return withTrailingSlash(neutral.startsWith("/") ? neutral : `/${neutral}`) + suffix;
}

// Caminho neutro ("/projects/x", "/#contact") → caminho no idioma pedido.
export function localizePath(path: string, locale: Locale): string {
  const neutral = stripLocale(path);
  if (locale === DEFAULT_LOCALE) return neutral;
  return `/${locale}${neutral}`;
}

// RF-06: a mesma página no outro idioma, a partir do caminho atual (com ou sem /pt).
export function alternatePath(currentPath: string, target: Locale): string {
  return localizePath(currentPath, target);
}
