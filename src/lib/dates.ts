// Datas de período (experiência, formação) em "mês ano" no idioma da página. Puro e testável.
import { HTML_LANG, type Locale } from "@/i18n/utils";

// As datas do YAML viram meia-noite UTC do dia 1 (`2024-09-01`). Formatar no fuso local de quem
// builda (ou do navegador, num fuso negativo) mostraria o mês anterior; por isso UTC fixo.
export function formatMonthYear(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(HTML_LANG[locale], {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

// "Sep 2024 – Present". O rótulo do período aberto vem do chamador (t("experience.present")),
// para este módulo não conhecer as strings de interface.
export function formatPeriod(
  start: Date,
  end: Date | undefined,
  locale: Locale,
  openEnd: string,
): string {
  const to = end ? formatMonthYear(end, locale) : openEnd;
  return `${formatMonthYear(start, locale)} – ${to}`;
}

// Data de emissão de credencial ("Aug 21, 2026" / "21 de ago. de 2026"). Mesmo motivo do UTC fixo.
export function formatDate(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(HTML_LANG[locale], { dateStyle: "medium", timeZone: "UTC" }).format(
    date,
  );
}
