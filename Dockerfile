# Estágio 1: build. Só existe para gerar dist/ e não vai para a imagem final.
FROM node:24-alpine AS build
WORKDIR /app
# O corepack do Node 24 (0.36) lê o "packageManager" do package.json e baixa o pnpm 12.8.1.
# Sem o prompt de download, que travaria o build num terminal não interativo.
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
# O pnpm-workspace.yaml entra junto do lockfile: o pnpm 12 só roda o postinstall do esbuild
# porque ele está em allowBuilds ali. Sem esse arquivo, o install passa e o build quebra depois.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
# A CSP sai dos scripts inline que de fato estão em dist/ (RNF-06), nunca de hash escrito à mão.
RUN pnpm build \
 && node scripts/csp.mjs > /app/csp.caddy

# Estágio 2: serve. Só o Caddy e os arquivos estáticos, ~10–20 MB de RAM em repouso (RNF-05).
FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/csp.caddy /etc/caddy/csp.caddy
COPY --from=build /app/dist /srv
# Caddyfile inválido quebra aqui, no build, e não no healthcheck da Railway com o site fora do ar.
RUN caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
# CMD herdado da imagem: caddy run --config /etc/caddy/Caddyfile --adapter caddyfile
