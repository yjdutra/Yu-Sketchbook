// CA-02 (RF-04), RF-05, RNF-06 e RNF-07 contra o container de produção: o redirect de /about, a
// barra final, a 404 por idioma, a CSP e o cache moram no Caddy, que o `astro preview` não
// reproduz. Este spec builda a imagem, sobe o container numa porta livre e o derruba no fim.
// Só roda no project `container`. Sem Docker (ou com E2E_SKIP_CONTAINER=1), é pulado e declarado.
import { execFileSync } from "node:child_process";
import { createServer } from "node:net";
import { expect, test } from "@playwright/test";
import { ROOT, projectSlugs } from "../support/content";
import { SECTION_IDS, t } from "./support";

const IMAGE = "yu-sketchbook:qa";
const NAME = "yu-sketchbook-qa";
const PORT = Number(process.env.E2E_CONTAINER_PORT ?? 8091);
const BASE = `http://localhost:${PORT}`;
const slug = projectSlugs().published[0] ?? "yu-book";

function dockerAvailable(): boolean {
  if (process.env.E2E_SKIP_CONTAINER === "1") return false;
  try {
    execFileSync("docker", ["info", "--format", "{{.ServerVersion}}"], { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

const portIsFree = (port: number) =>
  new Promise<boolean>((resolve) => {
    const server = createServer()
      .once("error", () => resolve(false))
      .once("listening", () => server.close(() => resolve(true)))
      .listen(port, "0.0.0.0");
  });

const docker = (...args: string[]) =>
  execFileSync("docker", args, {
    cwd: ROOT,
    stdio: "pipe",
    maxBuffer: 64 * 1024 * 1024,
  }).toString();

const removeContainer = () => {
  try {
    docker("rm", "-f", NAME);
  } catch {
    // não existia
  }
};

test.describe.configure({ mode: "serial", timeout: 600_000 });
test.use({ baseURL: BASE });

test.beforeAll(async () => {
  test.skip(
    !dockerAvailable(),
    "Docker indisponível (ou E2E_SKIP_CONTAINER=1): CA-02 não verificado",
  );
  removeContainer();
  if (!(await portIsFree(PORT))) throw new Error(`porta ${PORT} ocupada; use E2E_CONTAINER_PORT`);
  docker("build", "-t", IMAGE, ".");
  docker("run", "-d", "--rm", "-p", `${PORT}:8080`, "-e", "PORT=8080", "--name", NAME, IMAGE);
  // Equivalente ao `until curl -sf …; do sleep; done`, com limite de 30 s.
  const deadline = Date.now() + 30_000;
  for (;;) {
    try {
      if ((await fetch(`${BASE}/`)).ok) break;
    } catch {
      // o Caddy ainda não abriu a porta
    }
    if (Date.now() > deadline) throw new Error(`o container não respondeu em ${BASE}/ em 30 s`);
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
});

test.afterAll(() => {
  removeContainer();
});

const REDIRECTS: [string, string][] = [
  ["/about", "/"],
  ["/about/", "/"],
  ["/pt/about", "/pt/"],
  ["/pt/about/", "/pt/"],
  ["/about?utm_source=linkedin", "/?utm_source=linkedin"],
  ["/pt", "/pt/"],
  [`/projects/${slug}`, `/projects/${slug}/`],
  [`/pt/projects/${slug}`, `/pt/projects/${slug}/`],
];

for (const [from, to] of REDIRECTS) {
  test(`301 ${from} → ${to}`, async ({ request }) => {
    for (const method of ["HEAD", "GET"] as const) {
      const response = await request.fetch(from, { method, maxRedirects: 0 });
      expect(response.status(), `${method} ${from}`).toBe(301);
      expect(response.headers().location, `${method} ${from}`).toBe(to);
    }
  });
}

test("CA-02 literal: `curl -sI /about` → 301 com Location: /", () => {
  const head = execFileSync("curl", ["-sI", `${BASE}/about`]).toString();
  expect(head).toMatch(/^HTTP\/1\.1 301/m);
  expect(head).toMatch(/^location: \/\r?$/im);
});

test("caminho inexistente sem barra cai na 404, não num redirect", async ({ request }) => {
  const response = await request.get("/nada-aqui", { maxRedirects: 0 });
  expect(response.status()).toBe(404);
});

test("RF-05: 404 no idioma do caminho", async ({ page }) => {
  const en = await page.goto("/nada-aqui/");
  expect(en?.status()).toBe(404);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("main")).toContainText(t("notFound.title", "en"));

  const pt = await page.goto("/pt/nada-aqui/");
  expect(pt?.status()).toBe(404);
  await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
  await expect(page.getByRole("main")).toContainText(t("notFound.title", "pt"));
});

test("RNF-06: cabeçalhos de segurança, CSP sem unsafe-inline em script", async ({ request }) => {
  const headers = (await request.get("/")).headers();
  const csp = headers["content-security-policy"] ?? "";
  const scriptSrc = csp.split(";").find((d) => d.trim().startsWith("script-src")) ?? "";
  expect(scriptSrc).toMatch(/'sha256-/);
  expect(scriptSrc).not.toContain("unsafe-inline");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBeTruthy();
  expect(headers["permissions-policy"]).toBeTruthy();
  expect(headers.server).toBeUndefined();
});

test("RNF-07: /_astro imutável, HTML sempre revalida, texto comprimido", async ({
  page,
  request,
}) => {
  const html = await request.get("/", { headers: { "accept-encoding": "gzip" } });
  expect(html.headers()["cache-control"]).toBe("no-cache");
  expect(html.headers()["content-encoding"]).toMatch(/gzip|zstd/);

  await page.goto("/");
  const asset = await page.evaluate(
    () =>
      document.querySelector<HTMLLinkElement>('link[rel="stylesheet"][href^="/_astro/"]')?.href ??
      document.querySelector<HTMLScriptElement>('script[src^="/_astro/"]')?.src ??
      // Com `build.inlineStylesheets: "always"` a home não tem mais <link>/<script src>;
      // as imagens otimizadas continuam em /_astro e servem para conferir o cache.
      document.querySelector<HTMLImageElement>('img[src^="/_astro/"]')?.src ??
      null,
  );
  expect(asset, "a home referencia ao menos um asset em /_astro").toBeTruthy();
  const cached = await request.get(new URL(asset ?? "/").pathname);
  expect(cached.headers()["cache-control"]).toBe("public, max-age=31536000, immutable");
});

test("RNF-06: a CSP real não bloqueia o tema nem a ilha", async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { __csp: string[] }).__csp = [];
    document.addEventListener("securitypolicyviolation", (event) => {
      (window as unknown as { __csp: string[] }).__csp.push(
        `${event.violatedDirective} ${event.blockedURI || "inline"}`,
      );
    });
  });
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.locator(`#${SECTION_IDS.credentials}`).scrollIntoViewIfNeeded();
  await expect(page.locator("astro-island[ssr]")).toHaveCount(0);
  const violations = await page.evaluate(() => (window as unknown as { __csp: string[] }).__csp);
  expect(violations).toEqual([]);
  expect(errors).toEqual([]);
});

test("CV em PDF servido pelo container", async ({ request }) => {
  for (const path of ["/cv/yuri-dutra-cv-en.pdf", "/cv/yuri-dutra-cv-pt.pdf"]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    expect(response.headers()["content-type"]).toContain("application/pdf");
  }
});
