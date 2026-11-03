---
name: modelo-de-conteudo
description: >-
  Modelo de conteúdo do Yu-Sketchbook — as seis Content Collections (profile, experience,
  achievements, projects, credentials, playground) em YAML validado por Zod, o tipo Localized {en, pt} que
  torna obrigatório o par de idiomas, as regras de negócio do PRD (RN-01 a RN-05: idioma,
  public×restricted e repo, draft, referências entre achievement e experiência, badge vs lista), o
  roteamento i18n EN em / e PT em /pt, onde ficam as imagens, e o checklist passo a passo para
  adicionar um projeto (público ou restrito, como o yu-fin), uma credencial/badge ou um
  achievement. Use sempre que for criar, editar ou ler conteúdo do portfólio, mexer em
  src/content.config.ts, em src/lib/schemas.ts, em src/content/**, em src/assets/, em rotas por
  idioma, ou quando alguém disser "adiciona o projeto X", "coloca essa certificação" ou "traduz
  isso".
---

# Modelo de conteúdo

Todo o conteúdo do portfólio é **arquivo YAML versionado**, validado por Zod no build. Não há CMS
nem banco. O schema é o contrato entre o `marketing` (que escreve) e o `frontend` (que renderiza):
**se o schema aceitou, o componente confia.**

## 0. Fonte de verdade: o código

Esta skill diz o porquê e o como. Os campos moram no código, e **o código vence** esta skill:

| Arquivo | O que tem |
|---|---|
| `src/lib/schemas.ts` | Os schemas Zod, puros (testáveis no Vitest). `image()` e `reference()` entram por parâmetro |
| `src/content.config.ts` | Só liga os schemas aos loaders `glob` (YAML) |
| `src/lib/content-rules.ts` | Regras puras: draft, ordem, achievements derivados, órfãos, Impacto |
| `src/lib/content.ts` | O ponto único de leitura: `getPublishedProjects`, `getProfile`, `getJourney`, `getImpactAchievements`, `getCredentials`, `getProjectPaths` |
| `src/lib/localizable.ts`, `src/lib/dates.ts` | `resolveLocalizable()` e `formatMonthYear()`/`formatPeriod()` |

Para uma entrada nova, **copie a forma de uma vizinha** (`projects/yu-book.yaml`,
`credentials/intro-mcp.yaml`, `achievements/observability.yaml`).

### Astro 7 / zod 4: o que muda em relação a exemplos antigos (Astro 5)

- `z` vem de **`astro/zod`** (zod v4). O `z` de `astro:content` está deprecated e some no Astro 8.
- zod 4: `z.email()`, `z.url({ protocol, hostname })`, `z.strictObject()`, `z.ZodType` (não
  `z.string().email()`, `.url()`, `.strict()`, `ZodTypeAny`).
- `reference()` inválido **não quebra o build** no Astro 7.3: só loga `[ERROR] Invalid content
  reference` e sai com código 0. Quem quebra é o `getJourney()` (ver RN-04).
- Sem o `sharp` instalado, qualquer `image()` publicada falha com `MissingSharp`.

## 1. As collections

| Collection | Onde | Uma entrada é… |
|---|---|---|
| `profile` | `src/content/profile/profile.yaml` (exatamente 1) | O Yuri: nome, headline, proposta de valor, resumo, links, CV, `education` |
| `experience` | `src/content/experience/<empresa>-<cargo>.yaml` | Um cargo numa empresa |
| `achievements` | `src/content/achievements/<slug>.yaml` | Um key achievement (problema → ação → resultado) |
| `projects` | `src/content/projects/<slug>.yaml` | Um projeto (público ou restrito) |
| `credentials` | `src/content/credentials/<slug>.yaml` | Uma certificação, com ou sem badge |
| `playground` | `src/content/playground/<slug>.yaml` | Um app feito por diversão (seção 05): schema leve, sem capa, sem selo e sem página de detalhe |

O id da entrada é o nome do arquivo sem extensão, e vira o slug da rota. **Não renomeie** um
arquivo de experiência: os achievements o referenciam. A `education` (RF-16) fecha a Trajetória.

## 2. `Localized` e `localizable`

- **`localized(t)`** = `z.strictObject({ en: t, pt: t })`. Todo texto que o visitante lê usa isso.
  **Faltar `pt` ou `en` quebra o build (RN-01), e esse é o objetivo.** Uma terceira chave (`es`)
  também quebra. Nome próprio (empresa, projeto, certificação, instituição) é `z.string()`.
- **`localizable(t)`** = neutro **ou** `Localized`. Só em `metric.before`/`metric.after`: `"−35%"`
  é igual nos dois idiomas, `{ en: "days", pt: "dias" }` não. Quem lê resolve com
  `resolveLocalizable(value, locale)`, **nunca com `typeof` no componente**.
- No componente: `entry.data.title[locale]`, com `locale: "en" | "pt"`.

## 3. Regras de negócio (do PRD)

- **RN-01:** Todo texto visível é `Localized`.
- **RN-02:** `visibility: "public"` exige `repo` (só `https://github.com/…`). `"restricted"`
  proíbe `repo`. Mora no `superRefine` do `projectSchema`.
- **RN-03:** `draft: true` nunca chega à produção. O filtro mora **num predicado só**
  (`isPublished`), aplicado por `getPublishedProjects()`, que serve listagem, `getStaticPaths`
  (`getProjectPaths`) e sitemap. Não filtre `draft` em outro lugar. Em `pnpm dev` os drafts
  aparecem com a faixa "DRAFT". **Atenção:** o draft não gera rota, mas **as imagens dele vão
  para `dist/_astro` mesmo assim**. Screenshot sensível não entra no repositório, nem como draft.
- **RN-04:** `achievement.experience` é `reference("experience")`. Como o Astro 7.3 não para o
  build com referência inválida, `getJourney()` checa os órfãos (`danglingAchievements`) e lança.
  A lista de achievements de uma experiência é **derivada**, nunca duplicada no YAML dela.
- **RN-05:** Credencial com `badge` vai para o álbum; sem `badge`, para a lista simples.
- **RN-06:** Número só vem de fonte (`docs/Profile.pdf`, README do projeto). Nunca é inventado.
  Campo sem fonte fica vazio ou omitido, não "plausível".

## 4. i18n, rotas e datas

- `i18n: { defaultLocale: "en", locales: ["en", "pt"], routing: { prefixDefaultLocale: false } }`.
- `/` e `/projects/<slug>/` em EN; `/pt/` e `/pt/projects/<slug>/` em PT. As páginas EN e PT
  importam o mesmo componente de `src/components/pages/` e passam `locale`.
- **`trailingSlash: "always"`:** link interno termina em `/` (`/pt/`, `/projects/yu-book/`). Sem
  a barra, o Caddy responde 301. A 404 PT sai em `dist/pt/404/index.html`.
- A troca de idioma leva à **mesma página** (RF-06), por `localizePath(path, locale)`. O slug é o
  mesmo nos dois idiomas.
- Strings de interface ficam em `src/i18n/ui.ts`, `Localized` por chave.
- **Datas:** o YAML vira meia-noite UTC. Formate só com `src/lib/dates.ts` (`timeZone: "UTC"`);
  `Intl.DateTimeFormat` sem isso mostra o mês anterior em fuso negativo.

## 5. Imagens

- `src/assets/projects/<slug>/cover.png` mais a galeria (`01-<assunto>.png`, …).
- `src/assets/badges/<slug>.sticker.png` (álbum) e `<slug>.card.png` (verso/ampliação).
- No YAML, a imagem é referenciada por **caminho relativo ao arquivo YAML**
  (`../../assets/projects/yu-book/cover.png`) e validada com `image()`. Caminho errado quebra o
  build.
- O `alt` é `Localized` e descreve o que a imagem **prova**.
- Original no repositório ≤ 1 MB. O `astro:assets` (com `sharp`) gera AVIF/WebP e `srcset`.

## 6. Checklist: adicionar um projeto

Exemplo: o **yu-fin** (finanças pessoais, em produção, repositório ainda sendo organizado).

1. **Decida a visibilidade.** O repositório vai ser público? Se sim, `visibility: public` + `repo`.
   Se não, ou se ainda não, `visibility: restricted` sem `repo`: o card mostra "Private code ·
   details on request". Quando o repo abrir, troque para `public` e acrescente `repo`.
2. **Crie** `src/content/projects/yu-fin.yaml` com `draft: true`. Copie a forma de `yu-book.yaml`.
3. **Leia a fonte:** o README (se houver), o próprio app e o que o Yuri contar. Extraia o problema,
   o que o produto faz, 3 a 5 destaques de engenharia **traduzidos para leigo** (skill
   `voz-e-narrativa`) e a stack.
4. **Imagens:** `src/assets/projects/yu-fin/cover.png` (16:10, ≥ 1600 px de largura) e 2 a 5
   screenshots. **Dados financeiros reais não aparecem em screenshot, nem com `draft: true`**
   (a imagem do draft vai para `dist/`): use uma conta de demonstração ou borre antes de copiar.
5. **Ordem:** ajuste `order`, já que menor aparece primeiro. Defina `featured` se ele deve ir
   para o topo.
6. `pnpm build`: o schema valida os idiomas, as imagens e a regra de repo.
7. `pnpm dev` e confira `/projects/yu-fin/` e `/pt/projects/yu-fin/` em 375 e 1440 px.
8. Mostre ao Yuri. Com o OK dele, `draft: false`.

Nenhum componente deveria mudar para isso (métrica M5 do PRD). Se mudou, o modelo tem uma lacuna:
reporte ao `frontend`.

## 7. Checklist: adicionar uma credencial ou badge

1. Origem em `docs/badges/` (local): `badges.yaml` e os PNG recortados. O `docs/badges/README.md`
   explica como recortar uma badge nova com `cut_badges.py`.
2. Copie `<slug>.sticker.png` e `<slug>.card.png` para `src/assets/badges/`.
3. Crie `src/content/credentials/<slug>.yaml` a partir da entrada do manifesto: `issuedAt`,
   `verifyUrl` e `track` vêm de lá; `skills` (2 a 4, `Localized`) você escreve.
4. Credencial sem imagem: omita `badge`, e ela vai para a lista simples.

## 8. Checklist: adicionar um achievement

1. A fonte é o `docs/Profile.pdf` (seção "Key achievements" de cada cargo).
2. Crie `src/content/achievements/<slug>.yaml` com `experience: <id-da-experiência>`.
3. Se há número na fonte, preencha `metric` (`before` opcional, `after` obrigatório, ambos
   `localizable`; `label` `Localized`) e decida `featured` (a seção Impacto mostra de 6 a 8). Sem
   número, não há `metric`, e ele aparece só na Trajetória (RF-11).

## 9. Checklist: adicionar um app à Diversão (05)

1. **A fonte é o README do próprio repositório** (o campo `repo`). Os três atuais têm README
   denso, em português e na voz do Yuri: número e tom saem de lá, nada é inventado (RN-06).
2. Crie `src/content/playground/<slug>.yaml` copiando a forma de uma vizinha
   (`pokedex-arena.yaml`). Os campos moram em `src/lib/schemas.ts` (`playgroundSchema`), e o
   comentário acima dele diz por que o schema é leve.
3. **Sem `draft` e sem `featured`:** o que entra aparece, na ordem de `order`.
4. `repo` é **obrigatório** (todo app desta seção é público); `liveUrl` só se houver demo.
5. `icon` é um `enum`: o desenho tem de existir em `src/components/icons/Icon.astro`.
6. O texto segue a seção **"Registro da seção 05"** da skill `voz-e-narrativa` — registro
   descontraído, e nenhuma métrica de negócio.
7. **Precisou de um campo novo?** O experimento virou projeto: ele muda de collection para
   `projects`, em vez de engordar o schema leve.

## 10. Decisões do Yuri em vigor

- **2026-10-03:** a badge **Introduction to MCP entra** no álbum (4 selos da Claude Academy),
  embora não esteja no LinkedIn.
- **2026-10-03:** as 2 credenciais da AWS ficam **sem data** (lista simples). O **AWS Cloud Club
  Sul-Americana** fica sem `skills`, data e link: não há fonte, e não se inventa (RN-06).
- **2026-10-03:** o **CV é um PDF próprio**, EN e PT, gerado do conteúdo do site, **sem
  telefone** (RN-07), em `public/cv/yuri-dutra-cv-{en,pt}.pdf`.
