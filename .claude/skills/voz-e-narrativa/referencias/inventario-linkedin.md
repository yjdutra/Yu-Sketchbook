# Inventário do LinkedIn (fonte: docs/Profile.pdf, lido em 2026-10-02)

Fatos extraídos sem reescrita de número. ★ = tem métrica, candidato a Impacto (RF-10). Sem ★ =
vai para a Trajetória (RF-11). O telefone do PDF **não** é transcrito aqui (RN-07).

## Perfil

- **Nome:** Yuri J. Dutra · Goiânia, Goiás, Brazil · yjdutra@gmail.com
- **LinkedIn:** linkedin.com/in/yjdutra · **GitHub:** github.com/yjdutra
- **Headline:** Software Engineer & AI Engineer • React Native expert • Node.js • AWS • MCP •
  Claude Code • Applied AI
- **Top skills:** AI Agents, Mobile Application Development, JSON-RPC
- **Resumo (fatos):** 5 anos com React/React Native para automação residencial; painéis IoT com
  1 GB de RAM; apps offline na rede local; mais de 10.000 dispositivos conectados em campo; o
  último ano focado em IA aplicada; stack React.js, React Native, Next.js, Node.js, TypeScript,
  PostgreSQL, ElasticSearch, Docker, AWS (Lambda, S3), MQTT, BLE; aberto a trabalho remoto com
  times internacionais.

## Experiência

### Smartek Life · Software Engineering · set/2024 – atual · Goiânia, GO
Contexto: plataforma de automação predial e residencial de ponta a ponta (APIs Node.js/Feathers.js,
PostgreSQL, ElasticSearch, Docker, apps React Native e React.js), **10.000+ dispositivos em campo**,
discovery de processos com vendas, operações, suporte e estoque; decide onde a IA generativa gera
valor; **mentora um dev júnior e um estagiário**.

- ★ **Observabilidade:** stack com Sentry, Elastic e MQTT cobrindo app, API e hardware.
  Identificar a causa raiz caiu **de dias para minutos**; erros em produção caíram **35%**.
- ★ **Comando de voz com GPT:** contexto dinâmico configurável em runtime, **95% de precisão de
  interpretação**; integração com **Amazon Alexa** em AWS Lambda e S3.
- ★ **CRM próprio:** substituiu a cadeia Pipedrive + Zapier + Make + n8n (a captura de leads
  quebrava quando qualquer um falhava). Node.js, Next.js, PostgreSQL, integrações com Meta,
  Pipedrive e WhatsApp, enriquecimento automático. Eliminou o ponto único de falha e cortou
  **70% do custo** com ferramentas de vendas e automação.
- ★ **ERP:** existia só como rascunho no-code; reconstruído como sistema sob medida, usado todo dia
  por **4 departamentos** (estoque, operações, suporte, vendas).

### Smartek Life · Software Engineer · out/2022 – set/2024 · Goiânia, GO
Contexto: app de automação em React Native (Expo) + TypeScript, Android e iOS de uma base só;
camada de comunicação app ↔ hardware de campo; padronizou o código do time com ESLint e Git.

- ★ **Performance no painel SK40CNG#AL3** (1 GB de RAM, SoC IoT fraco): a navegação levava
  **5 s**; depois do profiling e do retrabalho de renderização e navegação, **menos de 400 ms**,
  sem trocar o hardware.
- **Iluminação:** integração e controle de LED, dimmer e RGB, com brilho e cor ajustáveis pelo app
  (a função que o cliente mais usa).
- ★ **10+ classes de dispositivos:** interruptores, portões, cortinas, som AAT e qualquer controle
  IR ou RF, online e **offline na rede local**.

### Supera Inovação em Tecnologia · Software Engineer · out/2021 – out/2022 · Goiânia
Contexto: full stack numa software house (~70% front), **4 aplicações proprietárias** para
clientes diferentes; React, React Native, Node.js, TypeScript.

- **Sincronização BLE** com data loggers proprietários em campo: controle de vazão, integridade e
  retomada de conexão; a sincronização é interrompível e retomável sem perder nem duplicar
  registros (sessões com milhares de registros).
- **App agritech** (React Native): transformou o monitoramento do clima em recomendação de
  irrigação.
- **App de engajamento para varejo:** gestão de contatos e campanhas promocionais, do front à API.

### Bristom · Software Project Manager · mai/2021 – out/2022 · Goiânia, GO
Contexto: startup agritech incubada; traduzia demandas do campo em requisitos; foi onde aprendeu a
programar; a Supera absorveu a operação por mudança societária.

- **Requisitos:** sentava com produtores e agrônomos, transformava a demanda em requisito e escopo,
  da descoberta à entrega ("começar pelo processo, não pelo código").
- **Coordenação** do time de desenvolvimento: prazo, escopo e qualidade de entrega.
- **Transição para código:** apps web React e mobile React Native, contribuindo com design e
  arquitetura de código.

## Formação

- **Universidade Estadual de Goiás:** Engenharia Agrícola, jan/2015 – nov/2020.

## Projetos citados no resumo (não são achievements)

- Sistema de gestão de trabalho em que agentes executam tarefas nos repositórios dele.
- App de notas como servidor MCP (é o **Yu-book**, `github.com/yjdutra/Yu-book`).

## Credenciais

Ver `docs/badges/badges.yaml`. São 4 badges da Claude Academy (Claude Code 101, Claude Code in
Action, Introduction to MCP, MCP: Advanced Topics) e 2 da AWS sem imagem (Cloud Practitioner
Essentials, AWS Cloud Club Sul-Americana). A "Introduction to MCP" tem badge mas não está no
LinkedIn; entra no site por decisão do Yuri (2026-10-03). As da AWS ficam sem data, e o Cloud Club
sem skills, data e link (skill `modelo-de-conteudo`, "Decisões do Yuri em vigor").
