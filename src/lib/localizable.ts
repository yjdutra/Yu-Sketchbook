// Resolve um valor que pode ser neutro (igual nos dois idiomas) ou `Localized`. Puro, para o
// Vitest testar sem o Astro. Usado pelos campos `metric.before`/`metric.after` (schemas.ts).
import type { Locale } from "@/i18n/utils";
import type { Localized } from "@/lib/schemas";

export function resolveLocalizable<T extends string | number>(
  value: T | Localized<T>,
  locale: Locale,
): T {
  return typeof value === "object" ? value[locale] : value;
}
