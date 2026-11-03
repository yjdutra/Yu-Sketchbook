---
name: portoes-de-qualidade
description: >-
  Portões de qualidade do Yu-Sketchbook — a ordem dos comandos (check, test, build, e2e, axe,
  Lighthouse, orçamento), a matriz de teste 2 idiomas × 3 viewports (375/768/1440), os orçamentos
  numéricos de desempenho, peso de JS e imagem, acessibilidade e responsividade, como medir cada
  um, o mapa dos critérios de aceitação CA-01..CA-11 para testes, e o que bloqueia uma entrega
  versus o que é observação. Use antes de fechar qualquer fase, antes de commit ou push, ao
  escrever ou revisar testes, ao investigar regressão de Lighthouse ou de bundle, e sempre que
  alguém perguntar "está pronto?", "posso publicar?" ou "passou?".
---

# Portões de qualidade

Não há CI: **os portões são estes comandos, rodados por quem entrega**, com a saída real relatada.
Um portão vermelho interrompe a entrega. Os orçamentos só mudam por decisão do Yuri, registrada
aqui com data.

## 1. Ordem

```bash
rm -rf playwright-report test-results   # 0. sobra do e2e anterior (nota abaixo)
pnpm check        # 1. tipos (.astro + TS). Rápido; pega quase tudo
pnpm test         # 2. Vitest: schemas e helpers
pnpm build        # 3. valida conteúdo (Zod), gera dist/
pnpm test:e2e     # 4. Playwright sobre `pnpm preview` (no Astro 7 é daemon: `pnpm astro preview stop`)
pnpm budget       # 5. orçamento de peso sobre dist/ (script em tests/budget.ts)
pnpm lhci         # 6. Lighthouse CI sobre dist/ (só antes de publicar ou ao mexer em peso)
```

Os passos 1–3 rodam em toda entrega. O 4 e o 5, em toda entrega que toca `src/`. O 6, ao fechar uma
fase e antes de todo push.

**Por que o `rm -rf` vem antes:** o `tsconfig.json` inclui `**/*` e exclui só `dist` e `docs`,
então `playwright-report/` e `test-results/` deixados por um `pnpm test:e2e` entram no `pnpm
check` e viram ~188 hints de bundle minificado — ruído que esconde o erro de verdade. Apagar sai
mais barato que ler. (A correção definitiva é acrescentar os dois ao `exclude` do `tsconfig.json`;
tarefa aberta.)

## 2. Matriz

| | 375×812 (celular) | 768×1024 (tablet) | 1440×900 (desktop) |
|---|---|---|---|
| `/` (EN) | ✔ | ✔ | ✔ |
| `/pt` | ✔ | ✔ | ✔ |
| `/projects/yu-book` | ✔ | — | ✔ |
| `/pt/projects/yu-book` | ✔ | — | ✔ |
| `/404` (página inexistente) | ✔ | — | — |

Configure como `projects` do Playwright (`mobile`, `tablet`, `desktop`), com `reducedMotion:
"reduce"` por padrão (tira a instabilidade de transição). Só o teste da animação do álbum liga o
motion.

## 3. Orçamentos

| Dimensão | Orçamento | Como medir |
|---|---|---|
| Lighthouse mobile: Performance | ≥ 95 | `pnpm lhci` |
| Lighthouse: Accessibility / SEO | = 100 / = 100 | `pnpm lhci` |
| Lighthouse: Best Practices | ≥ 95 | `pnpm lhci` |
| LCP (4G simulado) | < 2,5 s ("bom" do Core Web Vitals; decisão do Yuri em 2026-10-03, medido ~1,35 s na home) | `pnpm lhci` |
| CLS | < 0,1 ("bom" do Core Web Vitals; medido 0,001 na home) | `pnpm lhci` |
| JS bloqueante no `<head>` | só o script inline de tema (≤ 1 KB) | `pnpm budget` lê `dist/**/*.html` |
| JS transferido no carregamento, antes de rolar | ≤ 10 KB gz | Playwright: soma `/_astro/*.js` até `load`, sem scroll |
| Chunk do framework da ilha antes de ela ficar visível | nenhum | Playwright: nenhum chunk de runtime (`react`, `preact`, `hooks`, `compat`, `client`, `jsx-runtime`, `signals`) até rolar a `#credentials` (`tests/e2e/perf-js.spec.ts`) |
| JS total das ilhas | ≤ 60 KB gz | `pnpm budget`, só o JS que algum HTML de `dist/` referencia |
| Maior imagem servida | ≤ 200 KB | `pnpm budget` em `dist/_astro/*.{avif,webp,png,jpg}` |
| CSS total | ≤ 30 KB gz | `pnpm budget` |
| Violações do axe | 0 (todas as severidades) | `@axe-core/playwright` em cada página da matriz, nos 2 temas |
| Rolagem horizontal | nenhuma | `scrollWidth <= clientWidth` em cada célula da matriz |

Por que "≤ 10 KB" e não "0 KB": quando existe uma ilha, o Astro injeta um runtime inline pequeno, e
os `<script>` de componente (scroll-spy, botão de tema) são módulos adiados. Nada disso bloqueia a
pintura. O orçamento barra o que importa: o framework da ilha não baixa até ser necessário.

**O orçamento de JS mede o que o HTML referencia, nunca `dist/_astro/*.js` inteiro.** Na época do
`@astrojs/react` o renderer emitia um `client.*.js` de ~220 KB que nenhum HTML referenciava, e
somar a pasta reprovava um site correto; com o Preact o que está em `dist/_astro` é pequeno, mas a
regra fica, porque é ela que descreve o que o visitante baixa. O `pnpm budget` parte do que
`dist/**/*.html` referencia (`<script src>`,
`modulepreload`, `component-url`/`renderer-url` das `<astro-island>`) e segue os imports dos
módulos; somar a pasta toda reprovaria um site correto.

## 4. Critérios de aceitação → testes

| CA | Teste |
|---|---|
| CA-01 menu/âncora/`aria-current` | `tests/e2e/navigation.spec.ts` |
| CA-02 `/about` → 301 | `tests/e2e/redirects.spec.ts` contra o container (`docker run`), porque o redirect mora no Caddy; o `pnpm preview` não o cobre |
| CA-03 troca de idioma preserva a rota | `tests/e2e/i18n.spec.ts` |
| CA-04 tema sem flash | `tests/e2e/theme.spec.ts`: `colorScheme: "dark"`, lê `data-theme` com `page.evaluate` no `domcontentloaded` |
| CA-05 6–8 cartões de Impacto completos | `tests/e2e/home.spec.ts` |
| CA-06 restrito sem repo / com repo quebra | `tests/unit/schemas.test.ts` (o schema rejeita) + e2e do cadeado quando houver projeto restrito |
| CA-07 álbum por teclado | `tests/e2e/credentials.spec.ts` |
| CA-08 sem `pt` quebra | `tests/unit/schemas.test.ts` |
| CA-09 draft fora de `dist/` e do sitemap | `tests/unit/content.test.ts` (`isPublished`) + `pnpm budget` faz `grep` do slug de draft no HTML e no sitemap de `dist/`. As **imagens** do draft vão para `dist/_astro` mesmo assim (limite do Astro): o teste não as cobre, e screenshot sensível não entra no repo |
| CA-10 Lighthouse/axe/rolagem | `pnpm lhci` + `tests/e2e/a11y.spec.ts` + `tests/e2e/layout.spec.ts` |
| CA-11 RAM em repouso | manual, pelo `publicador` (skill `deploy-railway`). **O alvo de 30 MB é da régua do `docker stats`; a métrica da Railway (~78 MB na mesma imagem) não é comparável, e re-ancorar o CA-11 é decisão pendente do Yuri** |

Os schemas e as regras já são puros, para o Vitest testar sem subir o Astro:
`src/lib/schemas.ts` (com `z` de `astro/zod`; `image()` e a referência de experiência entram por
parâmetro, no teste `() => z.any()` e um `z.object({ id: z.string() })`) e
`src/lib/content-rules.ts` (`isPublished`, `byOrder`, `achievementsOf`, `danglingAchievements`,
`isImpact`). O RN-04 precisa de teste próprio: no Astro 7.3 o `reference()` inválido não para o
build; quem para é o `getJourney()` via `danglingAchievements`.

## 5. Armadilhas desta suíte

- **Suíte verde não prova o breakpoint da barra.** `INLINE_NAV_MIN_WIDTH` (`tests/e2e/support.ts`)
  é a **única** chave do breakpoint, e `navigation`, `layout` e `a11y.spec.ts` se penduram nela.
  Mudar o `@media` do `SiteHeader.astro` sem mudar a constante **não** deixa a suíte vermelha: os
  dois testes do par (um pula se o viewport está colapsado, o outro se não está) se pulam em cruz
  e tudo fica verde **testando nada**. Mudou o `@media`? mude a constante no mesmo commit e
  confira a contagem de testes **pulados**, não só a de verdes.
- **Texto cortado por elipse passa por todo assert óbvio.** `toBeVisible()` e `textContent` não
  acusam nada: o nó está lá e o texto completo também. O único sinal é `scrollWidth >
  clientWidth` no elemento com `overflow: hidden` — foi assim que apareceu o nome do Yuri cortado
  na barra com a 6ª âncora.
- **Largura medida só vale com o viewport e o idioma ao lado.** A tipografia é fluida (`--step--1`
  é `clamp` com `vw`): medida de 768 px não se extrapola para 1024, e o PT é mais longo que o EN.
- **Para medir no build sem rodar a suíte:** `node_modules/.bin/astro preview --port 4330
  --ignore-lock` convive com o daemon do `pnpm dev`, e o navegador mede na 4330.

## 6. Severidade

| Severidade | O que é | Bloqueia? |
|---|---|---|
| **Bloqueante** | Viola um CA/RN/RNF do PRD ou um orçamento acima | Sim |
| **Defeito** | Comportamento errado não coberto explicitamente | Não, mas entra na fila |
| **Observação** | Vale saber | Não |

## 7. Regras

- **Saída real ou não aconteceu.** Relate o resumo do comando (contagens, números do Lighthouse).
- **Retry não conserta teste instável.** Ache a causa.
- **Não baixe o orçamento para passar.**
- O Lighthouse varia ±3 pontos por rodada. Em caso de dúvida, rode 3 vezes e use a mediana
  (`numberOfRuns: 3` no `lighthouserc.json`).
- **Conferência do telefone (RN-07) não é `git grep`.** Ele acusa os PDFs de `public/cv/` por
  falso positivo de bytes de stream comprimido. O que vale é `pdftotext`, mais os streams
  descomprimidos com zlib e o `pdfinfo` (metadados).
