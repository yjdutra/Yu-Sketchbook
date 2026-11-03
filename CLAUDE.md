# Yu-Sketchbook

Portfólio pessoal do Yuri J. Dutra, **escrito para recrutadores de fora da área de tecnologia**
(quem é da área olha o GitHub). Site estático e bilíngue (EN em `/`, PT em `/pt`), hospedado na
Railway (plano Hobby) em `yuri-jorge.up.railway.app`, um link que já está publicado no LinkedIn como
`/about`.

| Peça | Escolha |
|---|---|
| Framework | Astro, `output: "static"` |
| Linguagem | TypeScript strict + `noUncheckedIndexedAccess` |
| Interatividade | Ilhas **Preact** (TSX), só `client:visible` (álbum de badges). React 19 custava 68 KB gz; Preact 10,9 KB (decisão do Yuri, 2026-10-03) |
| Estilo | Tailwind v4 + tokens em CSS, tema por `data-theme` |
| Conteúdo | 6 Content Collections + Zod (`src/lib/schemas.ts`), texto `Localized = { en, pt }`. A `playground` (seção 05) é a leve |
| Testes | Vitest, Playwright, @axe-core/playwright, Lighthouse CI |
| Deploy | Dockerfile `node:24-alpine` → `caddy:2-alpine`, um serviço só |
| Pacotes | pnpm, Node 24 |

## Documentos

- **PRD:** `docs/prd-portfolio.md`. Os comentários do código citam os `RF-xx`, `RNF-xx`, `RN-xx` e
  `CA-xx` de lá.
- **`docs/` é local e fica fora do git** (`.gitignore`). Tem o `Profile.pdf` do LinkedIn (com o
  telefone), o PRD e as badges de origem (`docs/badges/`). Num clone limpo ele não existe: não o
  force para o índice (`git add -f`) e não linke para ele de um arquivo versionado.
- **Fonte de verdade do currículo:** `docs/Profile.pdf`. Nenhum número é inventado nem arredondado
  para cima (RN-06).

## Regras que quebram o projeto se ignoradas

- **Todo texto que o visitante lê é `Localized`, com `en` e `pt`.** Faltar um idioma quebra o build,
  e isso é proposital (RN-01).
- **Projeto `public` tem `repo`; projeto `restricted` não tem** (RN-02). `draft: true` nunca vai para
  produção (RN-03).
- **App da seção 05 (`playground`) não é projeto:** schema leve, sem capa, selo, `draft` nem
  página de detalhe. Campo novo ali quer dizer que o experimento virou projeto e muda de
  collection (`src/lib/schemas.ts`, acima do `playgroundSchema`).
- **Nenhum JS bloqueia a primeira pintura; o framework da ilha só baixa quando ela fica visível** (JS inicial
  ≤ 10 KB gz, RNF-02). Ilha só com `client:visible`; nada de `client:load` na home.
- **Sem biblioteca de UI nem de ícones.** Ícones são SVG à mão em `src/components/icons/`.
- **Sem a variante `dark:` do Tailwind.** O tema mora inteiro em CSS (`src/styles/`).
- **O telefone do Yuri não aparece no site nem no repositório** (RN-07).
- **Push e deploy só com pedido explícito naquele turno.** Commitar é local; push publica.
- **Identificadores em inglês, comentários e docs em português.** O comentário explica o porquê.
- Não há ESLint nem Prettier: o estilo vem de imitação (2 espaços, aspas duplas, ~100 colunas).

## Agentes (`.claude/agents/`)

| Agente | Use para |
|---|---|
| `ui-ux` | Direção visual, tokens, temas, tipografia, motion, layout responsivo, design do álbum de badges |
| `frontend` | Páginas e componentes Astro, ilhas Preact, schemas de conteúdo, i18n, SEO técnico |
| `marketing` | Texto EN/PT para recrutador, entradas em `src/content/**`, novos projetos, SEO de texto |
| `qa` | Testes, axe, Lighthouse, orçamentos e matriz de viewports; aponta, não corrige |
| `publicador` | Commit, push e deploy na Railway, saúde e consumo do serviço |
| `curador` | Memória dos agentes (`.claude/agent-memory/`) e skills; fecha cada fase |

Os agentes não escrevem na própria memória: terminam com um bloco `## Para a memória` e o
`curador` persiste.

## Skills do projeto (`.claude/skills/`)

`convencoes-portfolio` · `design-system-portfolio` · `modelo-de-conteudo` · `voz-e-narrativa` ·
`portoes-de-qualidade` · `deploy-railway`

## Fases

0 Fundação → 1 Direção visual ∥ 2 Conteúdo → 3 Seções → 4 Qualidade → 5 Publicação (PRD §12).
**Estado atual (2026-11-03): Etapa 3 concluída e o portfólio no ar.** A seção 05 "Por diversão"
(`#playground`) entrou entre Certificações e Contato, a barra do topo passou a colapsar abaixo de
1024 px, os portões estão verdes (Lighthouse 100 nas 4 páginas, axe 0 violações, 222 unitários,
316 e2e) e a publicação aconteceu: repositório público em
**`https://github.com/yjdutra/Yu-Sketchbook`** e produção em
**`https://yuri-jorge.up.railway.app`** (o domínio exato do link do LinkedIn).
**A seguir:** as duas pendências da skill `deploy-railway` §7 — migrar o `railway.json` para
`.railway/railway.ts` **antes de 2026-12-01** e re-ancorar o alvo de RAM do CA-11 (decisão do
Yuri) — e o que o Yuri priorizar depois; o passo de publicação do roteiro já foi dado.
