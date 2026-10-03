# Memória — ui-ux

<!-- Curado por: curador. Limite: 2 KB / 60 linhas. Registro contradito pelo código é removido. -->
<!-- Um item por linha, com arquivo:linha quando houver. Nada de parágrafo. -->

## Onde ficam as coisas

- `docs/design/_fonte/palettes.py` (local) — fonte do cálculo WCAG das razões anotadas em `src/styles/tokens.css`.
- `docs/design/direcao-{a,b,c}.html` e `docs/design/screens/` (local) — mockups e capturas do Checkpoint A (2026-10-03).

## O que já nos mordeu

- Playwright MCP bloqueia `file://` e só salva captura dentro da raiz: sirva `docs/` com `python3 -m http.server` e salve em `docs/design/screens/` (`.playwright-mcp/` já ignorado, `.gitignore:22`).

## Decisões em vigor
