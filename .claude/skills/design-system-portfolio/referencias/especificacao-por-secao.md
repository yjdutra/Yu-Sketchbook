# Especificação por seção — skill `design-system-portfolio`

Detalhe de cada componente de seção e do álbum de badges. O `SKILL.md` tem o conceito, os tokens,
os breakpoints, o inventário e a acessibilidade; isto aqui é o que só interessa à seção que você
está mexendo. **Leia o trecho da sua seção antes da primeira linha de código.** "§3", "§4" e
"§5" se referem às seções do `SKILL.md`.

## Componentes por seção

**Casca.** Barra fixa de `--bar-h`, fundo `--surface` a 88% + `backdrop-filter: blur(10px)`,
borda inferior `--border`. Nome em serifa 600, 19 px, à esquerda. **≥ `lg` (1024, §4):**
âncoras em linha (`--step--1`, `--ink-muted`, 44 px de altura); a ativa (`aria-current="true"`,
scroll-spy) fica `--ink` com sublinhado de 2 px `--accent` a 7 px do texto. **< `lg`
(768–1023 inclusive):** `<details>` com
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

## Álbum de badges (seção 04)

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
