// @ts-check
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// Rotas que existem em dist/ mas não devem ser indexadas. O /cv é a fonte do PDF (noindex) e a
// 404 não é página de conteúdo. Draft não precisa entrar aqui: getPublishedProjects()
// (src/lib/content.ts) já impede que a rota exista no build de produção (RN-03). Se um dia surgir
// outra rota fora do índice, ela entra nesta lista.
const SITEMAP_EXCLUDED = [/\/cv\/?$/, /\/404\/?$/];

export default defineConfig({
  site: "https://yuri-jorge.up.railway.app",
  output: "static",
  // O Caddy serve /pt/ a partir de pt/index.html e redireciona /pt para /pt/; com "always" o
  // canonical, o hreflang e o sitemap já apontam para a URL final, sem redirect no meio.
  trailingSlash: "always",
  build: {
    format: "directory",
  },
  i18n: {
    defaultLocale: "en",
    locales: ["en", "pt"],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  integrations: [
    react(),
    sitemap({
      filter: (page) => !SITEMAP_EXCLUDED.some((pattern) => pattern.test(new URL(page).pathname)),
      i18n: {
        defaultLocale: "en",
        locales: { en: "en", pt: "pt-BR" },
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
