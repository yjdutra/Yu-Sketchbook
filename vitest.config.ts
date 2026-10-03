// Vitest só roda os testes puros (schemas, regras de conteúdo, datas, i18n). Nada aqui sobe o
// Astro: os módulos testados importam só `astro/zod` e o próprio src/.
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
    // Fuso negativo de propósito: a data do YAML vira meia-noite UTC, e formatar no fuso local de
    // quem builda mostraria o mês anterior. O dates.test.ts confere que o fuso pegou.
    env: { TZ: "America/Sao_Paulo" },
  },
});
