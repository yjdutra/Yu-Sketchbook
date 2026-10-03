// Lê o conteúdo real (src/content/**/*.yaml) sem o Astro, para os testes derivarem o esperado do
// mesmo YAML que o build usa (quantos cartões de Impacto, qual projeto é draft, etc.) em vez de
// repetir números à mão que envelhecem.
import { readFileSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

export const ROOT = fileURLToPath(new URL("../../", import.meta.url));
export const CONTENT_DIR = join(ROOT, "src/content");

export type CollectionName = "profile" | "experience" | "achievements" | "projects" | "credentials";

export type RawEntry = { id: string; file: string; data: Record<string, unknown> };

export function loadCollection(name: CollectionName): RawEntry[] {
  const dir = join(CONTENT_DIR, name);
  return readdirSync(dir)
    .filter((file) => file.endsWith(".yaml"))
    .sort()
    .map((file) => {
      const path = join(dir, file);
      const data: unknown = parse(readFileSync(path, "utf8"));
      if (typeof data !== "object" || data === null || Array.isArray(data)) {
        throw new Error(`${path}: o YAML não é um objeto`);
      }
      return { id: basename(file, ".yaml"), file: path, data: data as Record<string, unknown> };
    });
}

type Localized = { en: string; pt: string };

const isLocalized = (value: unknown): value is Localized =>
  typeof value === "object" && value !== null && "en" in value && "pt" in value;

export function localizedText(value: unknown, locale: "en" | "pt"): string {
  if (typeof value === "string") return value;
  if (isLocalized(value)) return value[locale];
  throw new Error(`valor não é texto nem Localized: ${JSON.stringify(value)}`);
}

// Os projetos que o build de produção publica (RN-03) e os que ele precisa esconder.
export function projectSlugs(): { published: string[]; drafts: string[] } {
  const projects = loadCollection("projects");
  return {
    published: projects.filter((p) => p.data.draft !== true).map((p) => p.id),
    drafts: projects.filter((p) => p.data.draft === true).map((p) => p.id),
  };
}

// RF-10 e RF-11: o que deve virar cartão de Impacto (mesma regra de isImpact()).
export function impactAchievements(): RawEntry[] {
  return loadCollection("achievements").filter(
    (a) => a.data.featured === true && a.data.metric !== undefined,
  );
}
