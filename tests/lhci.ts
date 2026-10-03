// `pnpm lhci`: Lighthouse CI mobile sobre dist/ (lighthouserc.json), com o Chromium que o
// Playwright já instalou, para não depender de um Chrome do sistema. Imprime a mediana das 3
// rodadas por URL e sai com o código do `lhci autorun` (asserts dos orçamentos da skill).
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import { ROOT } from "./support/content";

if (!existsSync(join(ROOT, "dist/index.html"))) {
  console.error("dist/ sem index.html: rode `pnpm build` antes do `pnpm lhci`.");
  process.exit(1);
}

const run = spawnSync(join(ROOT, "node_modules/.bin/lhci"), ["autorun"], {
  cwd: ROOT,
  stdio: "inherit",
  env: { ...process.env, CHROME_PATH: chromium.executablePath() },
});

// Resumo: mediana por URL (o relatório do filesystem guarda uma entrada por rodada).
const outDir = join(ROOT, ".lighthouseci/report");
const manifestPath = join(outDir, "manifest.json");
if (existsSync(manifestPath)) {
  type Entry = { url: string; isRepresentativeRun: boolean; jsonPath: string };
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Entry[];
  console.log("\nMediana (rodada representativa) por URL:");
  for (const entry of manifest.filter((e) => e.isRepresentativeRun)) {
    const lhr = JSON.parse(readFileSync(entry.jsonPath, "utf8")) as {
      categories: Record<string, { score: number }>;
      audits: Record<string, { numericValue?: number }>;
    };
    const score = (id: string) => Math.round((lhr.categories[id]?.score ?? 0) * 100);
    const lcp = lhr.audits["largest-contentful-paint"]?.numericValue ?? NaN;
    const cls = lhr.audits["cumulative-layout-shift"]?.numericValue ?? NaN;
    console.log(
      `  ${new URL(entry.url).pathname.padEnd(24)} perf ${score("performance")} · a11y ${score("accessibility")} · bp ${score("best-practices")} · seo ${score("seo")} · LCP ${Math.round(lcp)} ms · CLS ${cls.toFixed(3)}`,
    );
  }
} else {
  console.log(
    `(sem manifest em ${outDir}: ${readdirSync(ROOT).includes(".lighthouseci") ? "pasta vazia" : "pasta ausente"})`,
  );
}

process.exit(run.status ?? 1);
