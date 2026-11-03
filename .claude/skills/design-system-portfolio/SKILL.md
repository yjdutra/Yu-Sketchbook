---
name: design-system-portfolio
description: >-
  Design system do Yu-Sketchbook — o conceito "caderno de engenharia" (base limpa, sketch só como
  acento), tokens semânticos de cor por papel, os dois temas em CSS puro com data-theme e script
  anti-flash (sem a variante dark do Tailwind), escala tipográfica fluida, breakpoints mobile-
  first, motion com prefers-reduced-motion, o inventário de componentes por seção (Hero, Impacto,
  Projetos, Trajetória, álbum de badges, Diversão, Contato — a especificação detalhada de cada uma
  fica em referencias/especificacao-por-secao.md) e acessibilidade como requisito (contraste
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
  400** (15 KB) e **só em texto curto**: nota de margem, números de rótulo, datas, chips.
  Parágrafo em mono vira parede de máquina de escrever — a medida que fechou essa regra está em
  `referencias/especificacao-por-secao.md` (seção 05). Só essas duas
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

**Ícone novo se escolhe olhando a 24 px, que é o tamanho de uso — nunca a 72:** o detalhe que
encanta no grande some ou embola no pequeno. Os três últimos saíram assim
(`docs/design/screens/icons-final.png`, 2026-11-03): o gato com bigode e nariz embola, o satélite com painéis na horizontal vira três
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
- **A barra em linha pede `lg`, não `md` (resolvido em 2026-11-03).** Com a 6ª âncora
  ("Playground"/"Por diversão") o `<ul>` do desktop mede **497 px em EN e 493 px em PT a 768 px
  de viewport**, e o nome do Yuri cai de 113 px para 44 px — cortado pela elipse
  (`docs/design/screens/bar-768-six-items.png`). Em linha ele só cabe ao lado da marca **a partir
  de ~960 px**, então o breakpoint é o `lg` **1024** que o resto do layout já usa e o `<details>`
  serve **768–1023**. A **1024 px de viewport** o `<ul>` mede **528 px em PT** e a marca fica
  inteira.
- **Largura de barra se mede nos dois idiomas, e o número diz de que viewport é.** Medindo só em
  EN o limite dava ~880 px, que corta o nome em PT (**o PT é o idioma mais longo na barra**). E
  como `--step--1` é `clamp` com `vw`, a largura dos itens muda com o viewport: medida de 768 px
  **não** se extrapola para 1024. Número de barra sem o viewport ao lado é número errado —
  foi o que bagunçou três comentários antes desta linha existir.
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
| Certificações | `BadgeAlbum.tsx` (ilha), `CredentialList.astro` |
| Diversão (05) | `PlaygroundCard.astro` (sem ilha, sem página de detalhe) |
| Contato | `Contact.astro` |

A especificação de cada seção — medidas, ordem dos elementos, estados, teclado — e a do álbum de
badges estão em **`referencias/especificacao-por-secao.md`**. São ~130 linhas que só valem para a
seção que se está mexendo, então elas não ficam sempre carregadas: **abra o arquivo antes de
criar ou alterar um componente de seção.**

## 6. Acessibilidade: requisito, não polimento

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
