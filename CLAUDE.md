# Yu-Sketchbook

Portfólio pessoal do Yuri J. Dutra, **escrito para recrutadores de fora da área de tecnologia**
(quem é da área olha o GitHub). Site estático e bilíngue (EN em `/`, PT em `/pt`), hospedado na
Railway (plano Hobby) em `yuri-jorge.up.railway.app`, um link que já está publicado no LinkedIn como
`/about`.

| Peça | Escolha |
|---|---|
| Framework | Astro, `output: "static"` |
| Linguagem | TypeScript strict + `noUncheckedIndexedAccess` |
| Interatividade | Ilhas React, só `client:visible` (álbum de badges, filtro de projetos) |
| Estilo | Tailwind v4 + tokens em CSS, tema por `data-theme` |
| Conteúdo | Content Collections + Zod (`src/lib/schemas.ts`), texto `Localized = { en, pt }` |
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
- **Nenhum JS bloqueia a primeira pintura; React só baixa quando a ilha fica visível** (JS inicial
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
| `frontend` | Páginas e componentes Astro, ilhas React, schemas de conteúdo, i18n, SEO técnico |
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
**Estado atual (2026-10-03): Etapa 1 do plano concluída (Fases 0, 1 e 2: fundação, direção visual A
"Caderno & Caneta" e conteúdo aprovado), aguardando os commits locais. A seguir: Etapa 2, seções e
qualidade (Fases 3 e 4).**
