---
name: convencoes-portfolio
description: >-
  Convenções de código do Yu-Sketchbook (portfólio Astro + TypeScript + ilhas React + Tailwind v4)
  — estrutura de pastas e quem é dono de cada uma, identificadores em inglês e comentários em
  português citando RF/RN do PRD, TypeScript strict com noUncheckedIndexedAccess, quando um
  componente é .astro e quando vira ilha React, o orçamento de JS (nada bloqueia a pintura, React
  só quando a ilha fica visível), ícones SVG à mão, ausência deliberada de linter e de biblioteca
  de UI. Use antes de criar, alterar ou revisar qualquer arquivo em src/, tests/ ou na raiz deste
  repositório, e sempre que precisar decidir onde algo mora ou como nomeá-lo — mesmo numa mudança
  pequena.
---

# Convenções do Yu-Sketchbook

Não há ESLint, Prettier nem Biome, e isso é decisão: o projeto é pequeno e a consistência vem de
imitação. Antes de criar um arquivo, abra um vizinho da mesma pasta e copie a forma. O estilo é 2
espaços, aspas duplas, ponto e vírgula e ~100 colunas.

## 1. Onde as coisas moram, e de quem são

| Caminho | Dono | O quê |
|---|---|---|
| `src/lib/schemas.ts`, `src/content.config.ts` | frontend | Schemas Zod (puros) e a ligação com os loaders |
| `src/content/**` | marketing | Entradas YAML de conteúdo (EN+PT) |
| `src/i18n/ui.ts` | marketing (texto) / frontend (forma) | Strings de interface `Localized` |
| `src/i18n/utils.ts` | frontend | `t()`, `localizePath()`, `getLocale()` |
| `src/styles/**` | ui-ux | Tokens, temas, base |
| `src/layouts/`, `src/pages/`, `src/components/`, `src/islands/`, `src/lib/` | frontend | Código |
| `src/assets/**` | marketing (insere) | Imagens processadas por `astro:assets` |
| `tests/**`, configs de teste | qa | Testes |
| `Dockerfile`, `Caddyfile`, `railway.json`, `.dockerignore`, `scripts/csp.mjs` | publicador | Deploy |
| `.claude/**`, `CLAUDE.md` | curador | Estrutura de agentes |

Ao precisar mudar algo de outro dono, peça, não edite. A fronteira mais importante é o schema: o
marketing escreve conteúdo e o frontend define o que é conteúdo válido.

## 2. Idioma

- **Identificadores em inglês:** componentes (`ImpactCard`, `BadgeAlbum`), funções
  (`getPublishedProjects`), arquivos (`impact-card.ts`, `ImpactCard.astro`), chaves de schema
  (`visibility`, `issuedAt`). O repositório é público e a audiência é internacional.
- **Comentários, docs, mensagens de commit e de teste em português.** O comentário explica **por
  quê**, nunca o quê, e cita o requisito quando existe: `// RN-03: draft nunca vai para produção`.
- **Texto para o visitante nunca fica hardcoded.** Vem de `src/content/**` ou de `src/i18n/ui.ts`.

## 3. TypeScript

`strict: true` e **`noUncheckedIndexedAccess: true`**. Todo acesso por índice devolve
`T | undefined`, e o tratamento é explícito (`?? fallback`, guarda com `if`). Proibidos: `any`,
`@ts-ignore`, `@ts-expect-error` sem comentário de porquê, e `as` para calar o compilador.

Tipos de conteúdo vêm de `CollectionEntry<"projects">` e de `z.infer`, nunca redeclarados à mão.
Se dois lugares precisam do mesmo tipo, ele mora em `src/lib/types.ts`.

Import com alias `@/` (configurado no `tsconfig.json`): `import { t } from "@/i18n/utils"`.

## 4. `.astro` ou ilha React?

**Padrão: `.astro`.** Componente Astro é renderizado no build e não manda JS. Só vira ilha
(`src/islands/*.tsx`) o que **precisa de estado no navegador**:

| Componente | Tipo | Hidratação |
|---|---|---|
| Álbum de badges (virar o selo, teclado) | ilha | `client:visible` |
| Filtro de projetos (quando houver 4+) | ilha | `client:visible` |
| Menu mobile | **`.astro` + `<script>` pequeno** | Não é ilha: `<details>`/`popover` resolve com quase nada de JS |
| Troca de tema | script inline no `<head>` + `<script>` do botão | Não é ilha |
| Scroll-spy | `<script>` com `IntersectionObserver` | Não é ilha |

A regra (RNF-02): **nenhum JS bloqueia a primeira pintura, o React só baixa quando a ilha fica
visível, e o JS inicial fica em ≤ 10 KB gz**. `client:load` na home é regressão. O
`<script>` de componente Astro é empacotado e adiado pelo Vite, então fica permitido para
interações pequenas. Antes de criar uma ilha nova, pergunte se um `<script>` de 20 linhas resolve.

A ilha recebe props **já resolvidas no idioma** e serializáveis (strings, números, URLs de imagem
já processadas por `getImage()`). Ela não importa `astro:content`.

## 5. Ícones e UI

**Sem biblioteca de UI** (shadcn, Radix, Headless UI, MUI) **e sem pacote de ícones** (lucide,
heroicons, react-icons). Ícone é um componente Astro em `src/components/icons/`, SVG à mão na grade
24×24, `stroke="currentColor"`, `aria-hidden="true"` (o texto ao lado dá o nome). Para a ilha React,
o mesmo desenho em `src/islands/icons.tsx`. Antes de desenhar, procure se já existe:
`grep -rl "<svg" src/components/icons`.

## 6. Nomes de arquivo

- Componentes: `PascalCase.astro` / `PascalCase.tsx`.
- Módulos TS: `kebab-case.ts`.
- Conteúdo e imagens: `kebab-case` (`yu-book.yaml`, `claude-code-101.sticker.png`).
- Testes: `tests/unit/<alvo>.test.ts`, `tests/e2e/<fluxo>.spec.ts`.

## 7. Comandos

```bash
pnpm dev        # servidor de desenvolvimento
pnpm check      # astro check (tipos .astro + TS)
pnpm build      # valida conteúdo e gera dist/
pnpm preview    # serve dist/ como produção
pnpm test       # vitest
pnpm test:e2e   # playwright
```

No Astro 7 o `astro dev` e o `astro preview` rodam como **daemon, um de cada por vez**: antes de
subir outro, `pnpm astro dev status` / `pnpm astro dev stop` (idem `preview stop`).

A skill `portoes-de-qualidade` define quais rodam antes de entregar.
