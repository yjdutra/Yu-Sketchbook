// E2E sobre o build de produção. Matriz da skill portoes-de-qualidade §2: mobile 375×812,
// tablet 768×1024, desktop 1440×900, com reduced motion por padrão (só o teste da animação do
// álbum liga o movimento).
//
// Servidor: `astro preview` em PRIMEIRO PLANO. No Astro 7 o preview vira daemon só com
// `--background`; sem a flag ele fica no terminal e o Playwright consegue matá-lo no fim.
// `--ignore-lock` deixa o teste rodar mesmo com um `pnpm preview` (daemon) do frontend aberto, e a
// porta própria (4329) evita colidir com ele. `E2E_NO_BUILD=1` pula o build quando o portão 3
// (`pnpm build`) acabou de rodar.
//
// O project `container` roda só o redirects.spec.ts (CA-02): /about, a barra final e a 404 por
// idioma moram no Caddy, que o `astro preview` não reproduz. Ele sobe a imagem Docker sozinho.
import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 4329);
// O binário direto (e não `pnpm …`) evita o overhead do pnpm e funciona numa cópia do repositório
// com node_modules por symlink.
const ASTRO = "node_modules/.bin/astro";
const build = process.env.E2E_NO_BUILD === "1" ? "" : `${ASTRO} build && `;

// Specs que não dependem do viewport rodam só no desktop, para não triplicar o tempo.
const VIEWPORT_INDEPENDENT = [/seo\.spec\.ts/, /cv\.spec\.ts/];
const CONTAINER_ONLY = /redirects\.spec\.ts/;

const desktopChrome = devices["Desktop Chrome"];

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: true,
  // Retry não conserta teste instável (skill portoes-de-qualidade §6): instável é investigado.
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    browserName: "chromium",
    contextOptions: { reducedMotion: "reduce" },
    trace: "retain-on-failure",
  },
  webServer: {
    command: `${build}${ASTRO} preview --port ${PORT} --ignore-lock`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: false,
    timeout: 120_000,
    stdout: "ignore",
    stderr: "pipe",
  },
  projects: [
    {
      name: "mobile",
      testIgnore: [...VIEWPORT_INDEPENDENT, CONTAINER_ONLY],
      use: {
        ...desktopChrome,
        viewport: { width: 375, height: 812 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "tablet",
      testIgnore: [...VIEWPORT_INDEPENDENT, CONTAINER_ONLY],
      use: {
        ...desktopChrome,
        viewport: { width: 768, height: 1024 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "desktop",
      testIgnore: CONTAINER_ONLY,
      use: { ...desktopChrome, viewport: { width: 1440, height: 900 } },
    },
    {
      name: "container",
      testMatch: CONTAINER_ONLY,
      use: { ...desktopChrome, viewport: { width: 1440, height: 900 } },
    },
  ],
});
