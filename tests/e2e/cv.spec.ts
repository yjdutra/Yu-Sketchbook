// RF-09 e RF-08: o CV em PDF, um por idioma, servido de public/cv/. O conteúdo (sem telefone,
// RN-07) é conferido pelo `pnpm budget`, que extrai o texto do PDF.
import { expect, test } from "@playwright/test";
import { loadCollection, localizedText } from "../support/content";
import { homePath, LOCALES } from "./support";

const profile = loadCollection("profile")[0]?.data ?? {};

for (const locale of LOCALES) {
  const href = localizedText(profile.cv, locale);

  test(`CV ${locale}: ${href} existe e é um PDF`, async ({ request }) => {
    const response = await request.get(href);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("application/pdf");
    const body = await response.body();
    expect(body.subarray(0, 5).toString()).toBe("%PDF-");
    expect(body.length).toBeGreaterThan(2048);
  });

  test(`CV ${locale}: a página-fonte /cv responde e a home linka o PDF do idioma`, async ({
    page,
    request,
  }) => {
    const source = await request.get(locale === "en" ? "/cv/" : "/pt/cv/");
    expect(source.status()).toBe(200);
    await page.goto(homePath(locale));
    // Hero (RF-08) e Contato (RF-09).
    expect(await page.locator(`a[href="${href}"]`).count()).toBeGreaterThanOrEqual(2);
    const other = localizedText(profile.cv, locale === "en" ? "pt" : "en");
    await expect(page.locator(`a[href="${other}"]`)).toHaveCount(0);
  });
}
