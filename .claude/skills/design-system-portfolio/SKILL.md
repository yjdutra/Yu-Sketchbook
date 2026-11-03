---
name: design-system-portfolio
description: >-
  Design system do Yu-Sketchbook — o conceito "caderno de engenharia" (base limpa, sketch só como
  acento), tokens semânticos de cor por papel, os dois temas em CSS puro com data-theme e script
  anti-flash (sem a variante dark do Tailwind), escala tipográfica fluida, breakpoints mobile-
  first, motion com prefers-reduced-motion, o inventário de componentes por seção (Hero, Impacto,
  Projetos, Trajetória, álbum de badges, Contato) e acessibilidade como requisito (contraste
  calculado, foco visível, estado nunca só por cor, teclado). Use antes de criar ou alterar
  qualquer componente visual, cor, fonte, espaçamento, animação, ícone, layout responsivo ou
  estado de interação no portfólio — inclusive para revisar se uma tela segue o padrão.
---

# Design system do Yu-Sketchbook

> **Direção A · "Caderno & Caneta"**, aprovada pelo Yuri no Checkpoint A (2026-10-03): papel
> creme, tinta de caneta azul, serifa para ler e mono para a nota de margem. **Sem o
> marca-texto da direção B** (decisão do Yuri, 2026-10-03). Os valores moram em
> `src/styles/tokens.css`. Esta skill diz **o porquê e o como**; o arquivo é a fonte dos números.

## 1. Conceito

**Caderno de engenharia.** A base é limpa, de alto contraste e muito legível, e o "sketch" é
**acento**, nunca estrutura:

- um traço de caneta (SVG inline) que **sublinha o número** do achievement e **risca o valor
  antigo** no "antes → depois";
- uma **grade pontilhada** de caderno no fundo (CSS, 13–17% de opacidade);
- a **nota de margem** em mono (rótulo da seção, data, empresa); no desktop ela vai para uma
  coluna de margem, com a linha vertical do caderno;
- as badges como **adesivos colados num álbum**.

Teste de qualquer acento: se ele sair, a página perde informação? Se não perde, ele precisa ser
discreto o bastante para não competir com o texto. Se compete, ele sai. Por que esta direção: a
serifa e o creme leem como "alguém cuidadoso que documenta o que faz", o tom da história do Yuri
(do processo para o código), e a serifa conversa com a tipografia das badges da Claude Academy.

O leitor é recrutador leigo no celular. A hierarquia de cada seção começa pelo **resultado**.

## 2. Temas

O tema **não existe em React** nem na variante `dark:` do Tailwind (proibida). O mecanismo:

1. Um script inline e bloqueante no `<head>` do `BaseLayout` lê `localStorage["theme"]`, cai para
   `prefers-color-scheme` e seta `document.documentElement.dataset.theme` **antes da primeira
   pintura** (CA-04). Ele não vai para módulo, porque o módulo é adiado e o flash volta. O hash
   SHA-256 dele entra na CSP do Caddyfile (RNF-06).
2. `src/styles/tokens.css` define as cores em `:root, :root[data-theme="light"]` (o claro é o
   padrão) e `:root[data-theme="dark"]`. Um terceiro bloco, `@media (prefers-color-scheme: dark)
   { :root:not([data-theme]) }`, é **cópia exata do escuro**, só para JS desligado. **Cor nova
   exige as três entradas** e a razão WCAG anotada.
3. `src/styles/base.css` liga os tokens ao Tailwind com `@theme inline` (`bg-surface`,
   `text-ink-muted`, `border-border-strong`…). O `inline` importa: sem ele o Tailwind copia o
   valor no build e o tema não troca. A paleta padrão do Tailwind está **desligada**
   (`--color-*: initial`): `bg-blue-500` não existe, de propósito. Token que cai num namespace
   do Tailwind (`--radius-*`, `--ease-*`, `--font-*`) e não depende de tema vai no `@theme static`
   de `tokens.css`, para o utilitário (`rounded-md`, `font-mono`) usar o nosso valor e a variável
   existir mesmo sem uso.
4. O botão de tema só troca o atributo e grava a escolha.

Arquivos: `global.css` importa, nesta ordem, `tailwindcss` → `fonts.css` → `tokens.css` →
`base.css`.

## 3. Tokens

### Cor (claro / escuro). Razão WCAG em surface · raised · sunken

| Token | Papel | Claro | Escuro |
|---|---|---|---|
| `--surface` | Papel da página | `#FBF7EE` | `#13161E` |
| `--surface-raised` | Cartão | `#FFFDF8` | `#1B1F2A` |
| `--surface-sunken` | Álbum, chip de stack | `#F2ECDF` | `#0E1016` |
| `--ink` | Texto principal | `#1E2230` 14.8 · 15.6 · 13.5 | `#ECE7DA` 14.7 · 13.3 · 15.4 |
| `--ink-muted` | Texto secundário, corpo do cartão | `#474D5E` 7.9 · 8.3 · 7.2 | `#BCB6A8` 9.0 · 8.2 · 9.4 |
| `--ink-subtle` | Nota de margem, data, rótulo | `#636878` 5.2 · 5.5 · 4.7 | `#959083` 5.7 · 5.2 · 6.0 |
| `--accent` | Fundo do CTA, segmento ativo | `#2443B5` | `#93ACFF` |
| `--accent-ink` | Texto sobre `--accent` | `#FFFFFF` 8.25 | `#0E1430` 8.25 |
| `--accent-text` | Destaque **como texto**: link, número, rótulo de seção | `#2443B5` 7.7 · 8.1 · 7.0 | `#93ACFF` 8.3 · 7.5 · 8.7 |
| `--sketch` | Traço à mão (decorativo) | `#2443B5` | `#93ACFF` |
| `--border` | Divisória, contorno de cartão (decorativo) | `#DED5C3` | `#2D3343` |
| `--border-strong` | Contorno que **identifica controle** (UI ≥ 3:1) | `#8C8574` 3.4 · 3.6 · 3.1 | `#6B7287` 3.8 · 3.4 · 4.0 |
| `--focus` | Anel de foco | `#2443B5` 7.7 · 8.1 · 7.0 | `#93ACFF` 8.3 · 7.5 · 8.7 |
| `--status-production` | Selo "In production" | `#1D7348` 5.5 · 5.7 · 5.0 | `#5FD39C` 9.7 · 8.8 · 10.2 |
| `--status-development` | Selo "In development" | `#8F5300` 5.8 · 6.1 · 5.2 | `#F0B45A` 9.8 · 8.9 · 10.3 |
| `--status-archived` | Selo "Archived" | `#5B606C` 5.9 · 6.2 · 5.4 | `#A5A9B4` 7.7 · 7.0 · 8.1 |

Apoio, por tema: `--grid` (ponto da grade, `--accent` a 17% / 13%), `--sticker-edge` (borda
branca do adesivo), `--shadow-card` (box-shadow do cartão), `--shadow-sticker` e `--shadow-lift`
(valores de **`drop-shadow()`**, não de `box-shadow`, porque o PNG do selo é recortado e a sombra
precisa seguir o contorno).

**Por que `--accent-text` existe:** o destaque usado como texto precisa de 4,5:1, e o fundo do
botão não. Hoje os dois têm o mesmo valor, mas o papel é outro. Link e número usam
`--accent-text`, nunca `--accent`.

**Foco com offset:** `--focus` é a cor do botão primário (1:1 encostado nele). O `outline-offset`
de 3 px põe o anel sobre o papel. Nunca zere o offset num controle com fundo `--accent`.

### Tipografia

- **Source Serif 4** (variável, eixo `wght` 200–900, 51 KB): texto e títulos. **DM Mono só no
  400** (15 KB): nota de margem, números de rótulo, datas, chips. Só essas duas
  (`--font-*: initial`); utilitários `font-serif` e `font-mono`. **Não use mono 500**: o 500 foi
  cortado em 2026-10-03 porque cada woff2 pedido pelo Hero antes da primeira pintura custa ~150 ms
  de LCP no Lighthouse mobile simulado (home: 1503 → 1352 ms, limite 1500). Destaque em mono vem
  da cor (`--ink` sobre `--ink-muted`), não do peso.
- `fonts.css` declara as `@font-face` à mão: **só o latin, só woff2**, `font-display: swap`. Não
  importe o CSS do pacote: o da Source Serif 4 variável traz 6 subsets. Escolhemos o eixo `wght`
  e não o `opsz` (122 KB): o LCP é o título. Sem itálico (não foi baixado): não use `italic`.
- **Fallback com métrica ajustada (CLS).** Logo depois da fonte web, na pilha: `"Source Serif
  Fallback Times"` (local Times New Roman / Liberation Serif / Tinos, métrica compatível entre
  si), `"Source Serif Fallback Noto"` (Android) e `"DM Mono Fallback"` (Menlo, Courier New,
  Liberation Mono, DejaVu Sans Mono, Droid Sans Mono…). Cada face tem `size-adjust` e
  `ascent/descent/line-gap-override`; os pesos de título têm faces próprias (200–549, 550–674,
  675–900) porque o negrito local tem outra largura. Sem elas a troca de fonte re-quebrava o
  Hero: CLS 0,079 em `/` e 0,027 em `/pt/`; com elas, 0,000 e 0,001. **Como medir de novo**
  (se o conteúdo mudar muito ou entrar uma fonte): no Chromium, `FontFace` com o woff2 e com
  `local(...)`, e `canvas.measureText` sobre o texto do `main` de `/` e `/pt/` (títulos à parte
  para os pesos 600/650/700); size-adjust = largura web ÷ largura local; override = métrica
  hhea da fonte web ÷ size-adjust (Source Serif 4: 1036/335/0; DM Mono: 992/310/0, em 1000 upm). Depois **confira o Hero** com o woff2 bloqueado (`page.route("**/*.woff2", r => r.abort())`) × carregado, largura por largura: a média deu 116,35% para a Times, mas 115,5% é o que mantém o Hero idêntico de 375 a 1440.
- **Sem `<link rel="preload">` de fonte.** Medido: a primeira pintura adianta (1352 → 902 ms),
  mas a LCP passa a ser a repintura com a fonte web e piora (até 1504 ms). `font-display:
  optional` também foi medido e não muda a LCP simulada (a requisição sai do mesmo jeito);
  fica `swap`, que garante a serifa na primeira visita.
- A seta "→" (U+2192) **não está no subset latin**. Na métrica "antes → depois", use o SVG de seta.
  "−" (U+2212) está.

| Passo | 375 → 1440 | Uso | Utilitário |
|---|---|---|---|
| `--step--1` | 13 → 14 px | Nota de margem, rótulo, chip | `text-step--1` |
| `--step-0` | 16 → 18 px | Texto corrido (lh 1.6) | `text-step-0` |
| `--step-1` | 18 → 21 px | Papel no hero | `text-step-1` |
| `--step-2` | 21 → 27 px | Título de cartão (h3) | `text-step-2` |
| `--step-3` | 26 → 38 px | Proposta de valor | `text-step-3` |
| `--step-4` | 32 → 52 px | Título de seção (h2) | `text-step-4` |
| `--step-5` | 40 → 76 px | Nome (h1) | `text-step-5` |
| `--step-metric` | 36 → 56 px | Número do Impacto (o "antes → depois" cabe numa linha no cartão de 2 colunas; pior caso 1024 px) | `text-metric` |

Pesos: corpo 400, títulos 650, h1 e número 700. Títulos com `letter-spacing: -0.012em` (h1
`-0.02em`) e `text-wrap: balance`. Número com `font-variant-numeric: lining-nums tabular-nums`.

### Espaço, raio, sombra, motion

- Espaço: `--space-1..6` = 4, 8, 12, 16, 20, 24 px; `--space-7..12` = 32, 40, 48, 64, 80, 96 px.
  No Tailwind, `p-N` = N × 4 px (então `p-4` = `--space-4`, mas `p-12` ≠ `--space-12`).
- `--measure` 36em (~68 caracteres; **em, não ch**: o `ch` muda com a fonte e a troca fallback → web re-quebrava as linhas. Limite de linha em serifa vai sempre em em: 26ch = 13.8em) · `--page-max` 72rem · `--page-gutter` clamp(1rem, 4.5vw, 2.5rem) ·
  `--bar-h` 60 px.
- Raio: `--radius-sm` 6 px (chip, botão de ícone) · `--radius-md` 10 px (painel) · `--radius-lg`
  16 px (cartão, álbum) · `--radius-pill` 999 px (CTA, selo de status).
- Motion: `--ease-out` cubic-bezier(.22,.8,.26,1) · `--duration-fast` 150 ms (cor, hover) ·
  `--duration-base` 250 ms (adesivo, flip) · `--duration-draw` 380 ms (traço se desenhando, uma
  vez). Nada passa de 400 ms.

### Primitivas prontas (`base.css`)

- `.scribble` + `.scribble--under` | `.scribble--strike`: o traço de caneta. Envolva o texto num
  `<span class="relative inline-block whitespace-nowrap">` e ponha dentro o
  `<svg class="scribble scribble--under" viewBox="0 0 300 14" preserveAspectRatio="none"
  aria-hidden="true" focusable="false">` com `<path pathLength="1" d="…">`. Ele se desenha uma
  vez; com reduce, aparece pronto.
  - sublinhado: `M3 9.5c38-5 79-6.5 121-4.6 43 2 87 3.4 126 .4 16-1.2 31-2.4 47-3.3`
  - risco (viewBox `0 0 100 20`): `M2 14c20-4 46-8 96-9`
- `.margin-note`: mono `--step--1` `--ink-muted`.
- `sticker-cut` / `sticker-lift` (utilitários): borda branca recortada (4 `drop-shadow` de 1,6 px
  em `--sticker-edge`) + a sombra de repouso ou a de "descolando".
- `dot-grid` (grade de 16 px, para o álbum) e `square-grid` (quadriculado de 12 px, para o verso
  do adesivo).

### Ícones (SVG à mão, `src/components/icons/`)

Grade 24×24, `fill="none" stroke="currentColor" stroke-width="1.8"`, pontas e junções `round`,
20 px (16 px dentro de texto). `aria-hidden="true" focusable="false"`; o rótulo vai no controle.

```
sun      <circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6"/>
moon     <path d="M19.5 14.6A7.8 7.8 0 0 1 9.4 4.5a7.9 7.9 0 1 0 10.1 10.1z"/>
menu     <path d="M4 7h16M4 12h16M4 17h11"/>
arrow    <path d="M5 12h14M13 6l6 6-6 6"/>          download <path d="M12 5v14M6 13l6 6 6-6"/>
external <path d="M8 16 16 8M10 8h6v6"/>           code     <path d="M8.5 7 3.5 12l5 5M15.5 7l5 5-5 5"/>
lock     <rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>
status   production: círculo r5.5 cheio · development: círculo vazado + metade cheia
         (<path d="M12 6.5a5.5 5.5 0 0 1 0 11z" fill="currentColor"/>) · archived: círculo vazado
joystick <circle cx="12" cy="5.6" r="2.4"/><path d="M12 8v5.2M5.4 19.4 7.1 13.2h9.8l1.7 6.2z"/>
cat      <path d="M6.4 10.3 5.6 4.4 10.3 7.2a6.5 6.5 0 0 1 3.4 0L18.4 4.4l-.8 5.9a6.5 6.5 0 1 1-11.2 0z"/>
         <path d="M9.7 13.4h.01M14.3 13.4h.01"/>  (olhos: traço de comprimento zero, redondo pelo linecap)
satellite <path transform="rotate(-30 12 12)" d="M10.2 9.8h3.6v4.4h-3.6zM3.6 8h4.4v8H3.6zM16 8h4.4v8H16z
          M8 12h2.2M13.8 12h2.2M12 9.8V6.8M10.6 6.8h2.8"/>  (um d só; a rotação é do desenho)
```

Os três últimos foram escolhidos **olhando a 24 px**, não a 72 (`docs/design/screens/icons-final.png`,
2026-11-03): o gato com bigode e nariz embola, o satélite com painéis na horizontal vira três
caixas, e planeta com órbita lê "olho". Sobraram a cabeça com dois olhos de ponto, o satélite
inclinado e o joystick de fliperama.

## 4. Layout e breakpoints

**Mobile-first.** Escreva para 360 px e acrescente para cima. Breakpoints: `sm` 640, `md` 768,
`lg` 1024, `xl` 1280. Conteúdo em `--page-max` com `--page-gutter`; texto corrido em ~68ch.

- **Nenhuma rolagem horizontal** de 360 a 1920 px (RNF-04). Em flex ou grid, filhos com texto
  longo levam `min-w-0`; o `body` tem `overflow-wrap: break-word`.
- Alvos de toque ≥ 44×44 px (CTAs têm 48 px de altura).
- **Margem do caderno (≥ `lg`):** cada seção vira grid `9rem | 1fr` com gap 2.5rem; o número da
  seção (`01`, mono `--accent-text`, `aria-hidden`) vai para a coluna 1, alinhado à direita, e
  uma linha vertical de 1,5 px (`--accent` a 28%) separa as colunas. Abaixo de `lg`, o número
  fica acima do h2. **O h2 é o mesmo rótulo do item da barra** ("Impact", "Projects"…): quem toca
  em "Impact" chega em "Impact", e o subtítulo `--ink-muted` faz o papel da frase de resultado
  (validado na revisão da Etapa 2, 2026-10-03). Por isso a nota de margem é só o número. A
  coluna de margem também recebe o período da Trajetória.
- **Sexto item na barra (medido em 2026-11-03, 768 px):** com "Playground"/"Diversão" o `<ul>` do
  desktop vai a 497 px (EN) / 493 px (PT) e o nome do Yuri é cortado para "Yuri" (113 → 44 px,
  `docs/design/screens/bar-768-six-items.png`). Com 6 seções a navegação em linha só cabe de
  ~840 px para cima: ao entrar a 05, suba o breakpoint da barra de `md` para `lg` e deixe o
  `<details>` servir 768–1023.
- **Página curta:** o `body` é flex em coluna com `min-height: 100dvh` e o `main` cresce
  (`base.css`, só `@media screen`): o rodapé da 404 fica no pé da tela, não no meio.

## 5. Inventário e especificação por seção

| Seção | Componentes |
|---|---|
| Casca | `SiteHeader.astro`, `LanguageSwitch.astro`, `ThemeToggle.astro`, `SkipLink.astro` |
| Hero | `Hero.astro` |
| Impacto | `ImpactCard.astro` |
| Projetos | `ProjectCard.astro`, `StatusBadge.astro`, `VisibilityBadge.astro`; página: `ProjectGallery.astro` |
| Trajetória | `Timeline.astro`, `TimelineItem.astro` |
| Certificações | `BadgeAlbum.tsx` (ilha, §6), `CredentialList.astro` |
| Diversão (05) | `PlaygroundCard.astro` (sem ilha, sem página de detalhe) |
| Contato | `Contact.astro` |

**Casca.** Barra fixa de `--bar-h`, fundo `--surface` a 88% + `backdrop-filter: blur(10px)`,
borda inferior `--border`. Nome em serifa 600, 19 px, à esquerda. **≥ `md`:** âncoras em linha
(`--step--1`, `--ink-muted`, 44 px de altura); a ativa (`aria-current="true"`, scroll-spy) fica
`--ink` com sublinhado de 2 px `--accent` a 7 px do texto. **< `md`:** `<details>` com
`<summary>` de ícone (44×44, borda `--border-strong`, `--radius-sm`, `aria-label` localizado);
o painel abre à direita em `--surface-raised`, borda `--border-strong`, `--radius-md`,
`--shadow-card`, links de 44 px. Teclado: Enter/Espaço abre, Tab percorre os links, **Esc fecha e
devolve o foco ao summary**, clicar num link fecha. **EN/PT:** segmento de 2 células de 44×44 em
mono; a atual é `--accent`/`--accent-ink` com `aria-current`; a outra é link com `hreflang` e
`lang`. **Tema:** botão de ícone 44×44; lua no claro, sol no escuro; o `aria-label` diz a ação
("Switch to dark theme").

**Hero.** Topo = `--bar-h` + clamp(2.5rem, 7vw, 6rem). Ordem: h1 (`--step-5`, 700) → papel
(`--step-1`, 600, `--ink-muted`) → proposta de valor (`--step-3`, 400, máx. 26ch, com o trecho
`valuePropMark` do perfil sob `.scribble--under`; sem ele, a última oração) → local em mono → CTAs. CTAs em pílula de 48 px: **primário**
(`--accent`, "See projects" + seta), **secundário** (borda 1,5 px `--ink`, "Download CV" + seta
para baixo), **terciário** (texto `--accent-text` sublinhado, "Contact me"). < 520 px: o primário
ocupa a linha inteira e os outros dois dividem a de baixo. Ao lado (≥ `lg`, coluna de 17rem
alinhada embaixo) ou abaixo (< `lg`): a nota "At a glance", lista mono com o número em
`--ink` 500 e borda esquerda 1,5 px `--accent` a 45%. **Sem foto** (decisão do Yuri,
2026-10-03): a LCP é o h1.

**Impacto.** 1 coluna; 2 a partir de `md`. Cartão: `--surface-raised`, borda `--border`,
`--radius-lg`, `--shadow-card`, padding clamp(1.25rem, 3.5vw, 2rem). Ordem: **número** (`text-metric`;
valor antigo em `--ink-subtle` a .62em com `.scribble--strike`, seta SVG, valor novo em
`--accent-text` com `.scribble--under`; o `<p>` leva `aria-label` com a frase completa) → rótulo
mono `--ink-muted` → h3 `--step-2` → `<dl>` empilhado (dt mono `--ink-subtle`, sem caixa
alta forçada; dd `--ink-muted`; o "Result" em `--ink`) → rodapé mono `--ink-subtle` com borda
tracejada `--border-strong` (empresa · cargo · período). Não é clicável: sem hover. Rótulo e
frase **não** ficam lado a lado no desktop: a coluna do texto ficaria estreita demais.

**Projetos.** Cartão sem padding e com `overflow: hidden`: capa em cima (proporção da imagem,
`object-fit: cover`); a partir de `md`, 2 colunas `1.15fr | 1fr` com a capa à esquerda. Corpo:
selos → h3 `--step-3` com o link da página → tagline `--ink-muted` → até 5 chips de stack (mono,
`--surface-sunken`, `--radius-sm`) → ações de 44 px ("Read the case →" e, só se `public`,
"Code on GitHub ↗" em nova aba). A capa repete o link: `tabindex="-1"` (fora do Tab, um destino
uma parada), mas **com o `alt` localizado** e sem `aria-hidden`, porque a imagem prova o que o
projeto faz (validado na Etapa 2). **Selos
não são links:** pílula mono `--step--1`, borda 1,5 px `currentColor`. Status: cor do estado +
ícone de forma diferente + texto. Visibilidade em `--ink-muted` com borda `--border-strong`:
`code` + "Public · GitHub" ou `lock` + "Private code".

**Trajetória.** Lista do mais recente ao mais antigo. Cada item: período em mono `--ink-subtle`
(na coluna de margem a partir de `lg`, alinhado à direita como o número da seção: o item é
`position: relative` e o período `position: absolute; right: calc(100% + 2.5rem); width: 9rem`.
Não crie uma segunda coluna de data dentro do conteúdo: são duas margens e o texto encolhe),
empresa · cargo em h3
`--step-2`, local, resumo `--ink-muted`. Os achievements que já estão no Impacto aparecem como
link de âncora curto (`--accent-text`), não repetidos por extenso. Formação no fim, igual.

**Diversão (05, entre Certificações e Contato).** Apps feitos por diversão. O cartão é o
**oposto** do de Projetos, e a diferença é o conteúdo da seção: sem capa, sem selo de status ou de
visibilidade, sem página de detalhe. O de Projetos é uma peça **apoiada** no papel
(`--surface-raised` + `--shadow-card` + borda sólida + `--radius-lg`); este é **desenhado** no
papel: fundo transparente, **borda 1,5 px tracejada** `--border`, `--radius-md`, sem sombra. Esse
é o **único** gesto descontraído da seção: sem `.scribble` (o traço carrega o número do Impacto e
viraria enfeite solto), sem `square-grid` (a grade pontilhada do `body` já atravessa o cartão
vazado) e sem rotação de adesivo (é a assinatura do álbum 04; repetir duas seções depois vira
maneirismo). Ordem: ícone 24 px `--accent-text` + nome em h3 `--step-1` na mesma linha → tagline
em **serifa `--step-0` `--ink`** → "por que eu fiz" em **serifa `--step--1` `--ink-muted`** →
tecnologias em mono `--step--1` `--ink-subtle` separadas por
`·` de CSS (`content: "\00B7" / ""` no `::after` do item **anterior**, senão o separador abre
linha), **sem chip** → links em mono `--step--1` com 44 px de alvo (`code` + "Code"; `external` +
demo com "(opens in a new tab)" em `sr-only`). A hierarquia é a tinta descendo
(`--ink` → `--ink-muted` → `--ink-subtle`), não o corpo crescendo. **Mono aqui só no que é
curto** (stack, links, o número da seção): a tagline real tem 85 caracteres em EN e 88 em PT e,
em mono na coluna de 186 px de 768, vira uma parede de 5 linhas de máquina de escrever — o cartão
perde o "dois segundos" (as duas versões lado a lado em
`docs/design/screens/playground-real-768.png`, 2026-11-03). O "por que" um passo abaixo é o que
segura o cartão em ~370 px a 768 e ~200 px a 375; se o 13 px parecer pequeno no celular, a saída é
`--step-0` abaixo de 768, ao custo de ~25 px por cartão. Como o cartão não tem fundo,
todo texto fica sobre `--surface` e vale a coluna "s" da §3 — **nenhum token novo**. Grade: 1
coluna até 767 (gap `--space-4`), **3 colunas de 768 em diante** (em 768 o cartão fica com 222 px
e o parágrafo com ~24 caracteres por linha: é o limite, e é o que preserva a leitura de "três de
uma vez"); nada de 2 colunas, que com três itens deixaria um buraco. O cartão **não é clicável**:
`:hover`/`:focus-within` só trocam a borda para `--border-strong` em `--duration-fast`, e quem
marca o elemento ativo é o anel de foco global. Sem JS: com `reduce`, a rede do `base.css` já zera
a transição. Teclado: Tab segue o DOM (Code → demo → cartão seguinte), sem armadilha e sem estado
a fechar.

**Contato.** Rótulo + h2 + uma frase. Botões: e-mail (primário), LinkedIn, GitHub, CV
(secundários; externos com ícone `external` e "(opens in a new tab)" em `sr-only`).

## 6. Álbum de badges

O que tem de **gamificado** sem poluir: adesivos colados, agrupados por emissor/trilha, com
contagem ("Claude Academy · 4"). Não há barra de XP, nem slot vazio, nem confete.

- **Moldura:** `--surface-sunken` + `dot-grid`, borda `--border`, `--radius-lg`, padding
  clamp(1.25rem, 4vw, 2.5rem). Uma dica curta no topo do álbum, acima de todos os grupos (vale
  para o álbum inteiro, não para um emissor). Por grupo, o cabeçalho: h3 (`--step-2`) "Claude
  Academy", contagem mono `--accent-text` "· 4" (`aria-label="4 badges"`), emissor mono
  `--ink-subtle`. Grade de 2 colunas; 4 a partir de `md`. Selo de
  `min(100%, 12.5rem)`, quadrado. Abaixo, `CredentialList.astro` com borda superior tracejada.
- **Asset:** `src/assets/badges/<slug>.sticker.png` (~460 px, fundo transparente), exibido em
  140–200 px com `width`/`height` declarados.
- **Estrutura:** `li.sticker` (perspective 1000px, `--r`) › `.inner` (`transform-style:
  preserve-3d`, `rotate(var(--r))`, transição de transform `--duration-base` `--ease-out`) ›
  `button` (frente, `position: absolute; inset: 0`, `backface-visibility: hidden`,
  `aria-expanded`, `aria-controls`; a imagem com `sticker-cut`) + `div` do verso (`id`,
  `role="group"`, `aria-labelledby` no h4).
- **Repouso:** `--r` determinístico, derivado de um hash do slug, entre −4° e 4°.
- **Hover/foco:** `.inner` vai a `translateY(-6px) rotate(0)` e a imagem troca para
  `sticker-lift`: o adesivo descolando. O anel de foco fica no `li`
  (`:has(button:focus-visible)`, offset 6 px), porque o botão some de costas quando o selo vira.
  **As regras de hover/foco levam `.sticker:not([data-flipped])`.** Sem isso,
  `.sticker:has(.sticker__front:focus-visible) .sticker__inner` (especificidade 0,4,0) vence
  `.sticker[data-flipped] .sticker__inner` (0,3,0): quem vira pelo teclado continua com o foco
  no botão e o selo **não vira** (bug achado na Etapa 2).
- **Virado:** `.inner` em `rotate(0) rotateY(180deg)`, `--surface-raised` + `square-grid`, borda
  1,5 px `--border-strong`, raio 22 px. Conteúdo (RF-19): h4 (nome, 650), data em mono em 2
  linhas ("Issued" / data localizada), as habilidades, link **Verify** de 44 px com ícone
  `external` e "(opens in a new tab)". Com as habilidades o verso tem ~1,6× a altura do selo
  (243 px num selo de 142 px a 375; também a 768, onde o selo de 4 colunas tem ~136 px), então
  **o verso virado entra no fluxo e a linha cresce**, em vez de ficar `absolute` por cima do
  vizinho de baixo: `.sticker[data-flipped]` perde o `aspect-ratio`; a frente fica presa ao topo
  (`inset: 0 0 auto; aspect-ratio: 1`); o verso vira `position: relative; inset: auto; margin:
  -5cqi -3cqi 0; min-height: 110cqi` (o `li` é `container-type: inline-size`). O conteúdo de
  baixo desce enquanto o selo está virado; nada fica coberto. Desvirado, o verso volta a
  `absolute` (escondido). **Verso escondido com `visibility: hidden`** + `transition: visibility
  0s linear var(--duration-base)` (e `transition-delay: 0s` ao virar): o link sai do Tab e da
  árvore de acessibilidade sem cortar a animação, o que `display: none` ou `hidden` fariam.
- **Teclado:** Tab foca o selo (descola) → Enter/Espaço vira (`aria-expanded="true"`) → Tab vai
  ao Verify → **Esc** (no botão ou no link), nova ativação ou clique no verso fora do link
  desvira e **devolve o foco ao botão**. Um selo virado por vez: virar outro desvira o anterior,
  sem mover o foco.
- **Reduced motion:** sem transição; hover não sobe nem endireita (só a sombra muda); virado =
  `.inner` e verso sem transform, e a frente com `opacity: 0` (a regra de foco reduce também
  leva `:not([data-flipped])`, senão o verso aparece girado em `--r`). Em JS, cheque
  `matchMedia("(prefers-reduced-motion: reduce)")` antes de qualquer animação imperativa.

## 7. Acessibilidade: requisito, não polimento

- **Estado nunca só por cor.** Cada selo de status tem texto **e** ícone de forma própria; o
  restrito tem cadeado **e** rótulo.
- **Foco visível sempre.** `:focus-visible` global (3 px `--focus`, offset 3 px) em `base.css`.
  Nunca `outline: none` sem substituto (a exceção é o `<main tabindex="-1">`, destino do skip).
- Skip link para `#main`. Uma `<h1>` por página. Seções com `<h2>` e `aria-labelledby`.
- Imagem informativa tem `alt` localizado; decorativa (traço, grade, capa repetida) tem `alt=""`
  ou `aria-hidden`.
- `prefers-reduced-motion: reduce` desliga transform, flip, scroll suave e traço animado
  (`base.css` tem a rede de segurança global; o componente ainda declara o próprio estado final).
- `lang` correto no `<html>` (`en` / `pt-BR`).
