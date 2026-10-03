---
name: deploy-railway
description: >-
  Deploy e operação do Yu-Sketchbook na Railway (plano Hobby, consumo mínimo) — Dockerfile multi-
  stage node→caddy, Caddyfile (porta $PORT, compressão, cache immutable em /_astro, cabeçalhos de
  segurança e CSP com o hash do script de tema, redirect /about, barra final por 301, 404 por
  idioma), railway.json, domínio yuri-jorge.up.railway.app, App Sleeping, healthcheck, como medir
  RAM/CPU local (docker stats) e na Railway, e a regra de nunca fazer push ou deploy sem pedido
  explícito no turno. Use ao criar ou mudar Dockerfile, Caddyfile, railway.json, .dockerignore ou
  scripts/csp.mjs, antes de qualquer push/deploy, ao configurar domínio ou variáveis, ao
  investigar o site fora do ar, lento ou caro, e quando o Yuri perguntar quanto o site está
  consumindo.
---

# Deploy na Railway

Um serviço só, estático, sem banco. O site é `dist/` servido por **Caddy** num container
`caddy:2-alpine`. O alvo é ≤ 30 MB de RAM em repouso (RNF-05, CA-11).

**Medido em 2026-10-03 (local, `docker stats`):** 11,89 MiB em repouso, 13 PIDs, Caddy 2.11.6,
imagem com 24,9 MB de conteúdo.

## 0. Fonte de verdade: os arquivos da raiz

Eles são comentados linha a linha. Leia o arquivo antes de mudá-lo; esta skill não os repete.

| Arquivo | O que faz |
|---|---|
| `Dockerfile` | Estágio `node:24-alpine` (corepack → pnpm do `packageManager`, `pnpm build`, CSP) → estágio `caddy:2-alpine` com `dist/` em `/srv` e `caddy validate` no build |
| `Caddyfile` | `$PORT`, compressão, cabeçalhos, cache, redirects `/about`, barra final, 404 por idioma |
| `scripts/csp.mjs` | Gera a CSP com o SHA-256 de cada `<script>` inline de `dist/`; falha se não achar nenhum |
| `railway.json` | Builder Dockerfile, healthcheck `/`, restart `ON_FAILURE`, 1 réplica |
| `.dockerignore` | Fora do contexto: `docs/` (RN-07), `.env*`, `.claude`, `.mcp.json`, testes, gerados |

## 1. A regra

**Push e deploy só com pedido explícito naquele turno.** A Railway fica ligada ao repositório
**público `yjdutra/Yu-Sketchbook`** no GitHub (decisão do Yuri, 2026-10-03): o `git push` para
`main` **é** deploy em produção, sem etapa de aprovação no meio. `railway up` sobe o diretório
local direto, sem git. Os dois publicam.

O `.claude/settings.json` deixa `git push`, `railway up`, `railway deploy` e `railway redeploy`
em **ask**, uma segunda trava. Não a contorne.

## 2. Por que essa forma

- **Caddy, não `node`/`serve`/`astro preview`:** o Node ocioso ocupa ~40–60 MB; o Caddy, ~12. E o
  Caddy já faz compressão, cabeçalhos e redirect sem código.
- **Multi-stage:** a imagem final tem só o Caddy e o `dist/`, sem `node_modules`. Ela é pequena,
  sobe rápido (o cold start do App Sleeping fica curto) e tem menos superfície de ataque.
- **TLS termina no edge da Railway.** O Caddy escuta HTTP puro em `$PORT`, com `auto_https off`.
- **Redirect `/about` no Caddy, com 301 de verdade**, direto à URL final com barra. O link do
  LinkedIn aponta para `/about` (RF-04).
- **Uma URL por página.** O Astro roda com `trailingSlash: "always"` e `build.format:
  "directory"`. O `file_server` resolve `<rota>/index.html` sozinho, então **não há `try_files`**:
  com ele, `/pt` e `/pt/` respondiam 200 duplicado. A barra final vem de um 301 genérico, o
  matcher `@missingSlash { not path */; file {path}/index.html }`. O matcher `file` não casa
  diretório sem a barra, por isso ele testa o `index.html`; caminho inexistente cai na 404.
- **pnpm no build:** o corepack do `node:24-alpine` ativa a versão do `packageManager`; o
  `pnpm-workspace.yaml` (com `allowBuilds`) tem de entrar no `COPY` junto do lockfile.
- **`style-src 'unsafe-inline'`:** o Astro inlina CSS pequeno e a ilha usa `style=` na rotação dos
  selos. Para removê-lo: `inlineStylesheets: "never"` e rotação por classe/custom property.

## 3. Configuração do serviço (painel da Railway)

| Item | Valor |
|---|---|
| Source | Repositório GitHub `yjdutra/Yu-Sketchbook`, branch `main` |
| Builder | Dockerfile (declarado em `railway.json`) |
| Root Directory | vazio (raiz) |
| Healthcheck | `/` (em `railway.json`) |
| Domínio | Networking → editar o domínio gerado para **`yuri-jorge.up.railway.app`** (o link do LinkedIn) |
| Réplicas | 1 |
| Variáveis | nenhuma obrigatória; `PORT` é injetada pela Railway |
| App Sleeping | **decisão do Yuri (Q-03)**, com a RAM medida. Campo: `"sleepApplication": true` em `deploy` do `railway.json` (confirmado no schema) |

Se o domínio `yuri-jorge` estiver preso a outro serviço ou projeto antigo, ele precisa ser
liberado lá primeiro. Pergunte ao Yuri, não apague serviço.

## 4. Antes do deploy

1. Portões da skill `portoes-de-qualidade` (1–6), verdes e com saída relatada.
2. Teste local do container, que é o que vai para o ar. Logo depois do `docker run` o `curl` dá
   `000`: espere o Caddy subir com o laço abaixo, não com `sleep`.
   ```bash
   docker build -t yu-sketchbook .
   docker run -d --rm -p 8080:8080 -e PORT=8080 --name ys yu-sketchbook
   until curl -s -o /dev/null localhost:8080/; do :; done
   curl -sI localhost:8080/ | head -5                  # 200, content-encoding, CSP
   curl -sI localhost:8080/about | grep -i location    # 301 → /
   curl -sI localhost:8080/pt | grep -i location       # 301 → /pt/
   curl -sI localhost:8080/_astro/<arquivo-real> | grep -i cache  # immutable
   curl -s  localhost:8080/nao-existe -o /dev/null -w '%{http_code}\n'      # 404 (EN)
   curl -s  localhost:8080/pt/nao-existe -o /dev/null -w '%{http_code}\n'   # 404 (PT)
   docker stats --no-stream ys                         # RAM em repouso
   docker stop ys
   ```
   Asset de `/_astro` **inexistente** sai `no-cache`, não `immutable`: o `header` dentro de
   `handle_errors` sobrescreve o da rota. Teste o cache com um arquivo que existe.
3. `git log --oneline origin/main..HEAD`: o que vai junto.

## 5. Depois do deploy

```bash
railway status                    # serviço e deploy ativos
railway logs --deployment | tail  # Caddy subiu sem erro
curl -sI https://yuri-jorge.up.railway.app/ | head -3
curl -sI https://yuri-jorge.up.railway.app/about | grep -i location   # 301 → /
curl -sI https://yuri-jorge.up.railway.app/pt/ | head -1              # 200 (/pt sem barra dá 301)
```

**Consumo:** depois de ~10 min sem tráfego, leia a RAM e a CPU no painel do serviço (aba Metrics)
e registre o número **medido** com a data (o curador decide o destino). Mais de 30 MB em repouso
merece investigação (CA-11).

## 6. Quando algo dá errado

- **Healthcheck falha:** quase sempre o Caddy não escuta em `$PORT`. Confira `:{$PORT:8080}` no
  Caddyfile e os logs. Caddyfile inválido já quebra no `docker build` (`caddy validate`).
- **404 numa página que existe:** confira se `dist/<rota>/index.html` existe (o Astro gerou a
  rota? é draft?). Sem a barra final, o esperado é 301, não 404.
- **`/pt` responde 200 em vez de 301:** alguém pôs `try_files` de volta. Tire-o.
- **Tema pisca ou o console acusa CSP:** o hash não bateu com o script inline. A CSP é gerada no
  build (`scripts/csp.mjs`); confira se o `Dockerfile` ainda roda o script depois do `pnpm build`.
- **Install do pnpm passa e o build quebra no esbuild:** o `pnpm-workspace.yaml` saiu do `COPY`.
- **Rollback:** pelo painel (Deployments → redeploy do anterior), ou com um commit de revert.
  Nunca `push --force`.
