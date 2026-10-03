# Memória — frontend

<!-- Curado por: curador. Limite: 2 KB / 60 linhas. Registro contradito pelo código é removido. -->
<!-- Um item por linha, com arquivo:linha quando houver. Nada de parágrafo. -->

## Onde ficam as coisas

## O que já nos mordeu

- `package.json:33` — TypeScript fixado em ^6: o @astrojs/check 0.9.10 (`package.json:30`) não aceita TS 7; o TS 6 depreca `baseUrl`, por isso o alias é só `paths` (`tsconfig.json:9`).
- `pnpm-workspace.yaml:1` — o pnpm 12 recusa postinstall fora de `allowBuilds`; dependência nova com build: `pnpm approve-builds <pkg>`.
- `package.json:26` — `sharp` é obrigatório com imagem publicada (`MissingSharp`); o 0.35 dispensa allowBuilds e roda no node:24-alpine (musl).

## Decisões em vigor
