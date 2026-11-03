---
name: voz-e-narrativa
description: >-
  Voz, tom e narrativa do portfólio do Yuri J. Dutra para recrutadores de fora da tecnologia, em
  inglês e português — o leitor-alvo, a estrutura problema → ação → resultado com o número
  primeiro, o glossário que traduz jargão técnico (MCP, BLE, MQTT, observabilidade, offline-first)
  para linguagem leiga, limites de tamanho por campo, palavras proibidas, e como o português
  difere do inglês (não é tradução literal). Inclui o inventário de fatos e números do LinkedIn.
  Use sempre que for escrever, revisar ou traduzir qualquer texto que o visitante lê — hero,
  achievements, descrição de projeto, alt de imagem, rótulo de botão, meta description, texto de
  Open Graph — e também ao decidir a hierarquia visual de uma seção, porque o design segue a ordem
  da narrativa.
---

# Voz e narrativa

## 1. Para quem se escreve

**Recrutador, RH ou gestor sem formação técnica.** Lê no celular, em 30 s a 2 min, e decide se
encaminha o Yuri para a próxima etapa. Ele não sabe o que é MQTT e não precisa saber. Ele precisa
sair com:

1. **O que o Yuri faz:** constrói apps e sistemas de IA que funcionam no mundo real.
2. **Que resultado já entregou:** números, com contexto.
3. **Como falar com ele:** e-mail, LinkedIn.

Quem é técnico vai ao GitHub. O portfólio não tenta impressionar engenheiro; tenta não perder o
recrutador.

## 2. A voz

- **Primeira pessoa, direta, sem floreio:** "I cut sales tool costs by 70%." / "Reduzi em 70% o
  custo com ferramentas de vendas."
- **Concreta.** Troque "melhorei a performance" por "a navegação caiu de 5 s para menos de 400 ms".
- **Humana, com contexto:** a história de vida vale. Ele começou na Engenharia Agrícola, gerenciou
  projeto antes de programar e projeta "do processo para o código". Isso diferencia.
- **Confiante sem autopromoção vazia.** O número fala; o adjetivo não.

**Palavras proibidas** (EN/PT): passionate/apaixonado, results-driven/focado em resultados,
rockstar, ninja, guru, synergy/sinergia, cutting-edge/de ponta, innovative/inovador (sem prova ao
lado), "leverage", "robust", "seamless", "world-class", "disruptivo".

## 3. Estrutura do achievement: problema → ação → resultado

O número aparece **primeiro** (é o que o olho pega), depois a história em três frases curtas.

```
Métrica:   5 s → <400 ms   · tempo para trocar de tela
Problema:  The app ran on a cheap smart-home panel with 1 GB of RAM, and every screen took
           5 seconds to open. It felt broken.
Ação:      I profiled the app and rebuilt how screens load and render.
Resultado: Screens now open in under 400 ms — on the same hardware, at no extra cost.
```

- **Problema:** a dor de quem usa ou do negócio, sem jargão. Uma frase, duas no máximo.
- **Ação:** o que o Yuri fez, com verbo ativo na primeira pessoa. Uma frase.
- **Resultado:** o efeito para o negócio ou para a pessoa. Repita o número com contexto.

## 4. Glossário: técnico → leigo

| Termo | EN para leigo | PT para leigo |
|---|---|---|
| MCP server | lets AI assistants (like Claude) use the app directly | permite que assistentes de IA (como o Claude) usem o app diretamente |
| AI agents | AI that carries out tasks step by step, not just chats | IA que executa tarefas passo a passo, não só conversa |
| Observability / Sentry, Elastic | tools that show exactly where and why something broke | ferramentas que mostram exatamente onde e por que algo quebrou |
| MQTT / IoT | the network that connects the devices in a smart home | a rede que conecta os aparelhos de uma casa inteligente |
| BLE sync | wireless sync with field sensors | sincronização sem fio com sensores de campo |
| Offline-first / local network | keeps working even without internet | continua funcionando mesmo sem internet |
| React Native | one app for both iPhone and Android | um app só para iPhone e Android |
| API / backend | the server behind the app | o servidor por trás do app |
| No-code ERP | a makeshift system built with drag-and-drop tools | um sistema improvisado em ferramentas de arrastar e soltar |
| Rate limit / spend cap | a daily spending limit for the AI | um teto diário de gasto com IA |
| Seismic data / sismos | earthquakes | terremotos |
| ISS | the space station | a estação espacial |

O termo técnico pode aparecer **depois** da explicação, entre parênteses ou na lista de stack,
para o leitor técnico achar: "lets AI assistants use the app directly (an MCP server)".

## 5. Limites de tamanho

| Campo | Limite |
|---|---|
| Proposta de valor (Hero) | ≤ 14 palavras |
| Título de achievement | ≤ 8 palavras |
| Problema / ação / resultado | ≤ 25 palavras cada |
| Tagline de projeto | ≤ 18 palavras |
| Destaque de projeto (corpo) | ≤ 40 palavras |
| `meta description` | 140–160 caracteres |
| `alt` de imagem | ≤ 125 caracteres, diz o que a imagem prova |

Passou do limite? Corte o adjetivo, depois a oração subordinada. O número fica.

## 6. Português não é tradução do inglês

Escreva o EN, depois **reescreva** em PT com o ritmo do português:
- "I cut costs by 70%" → "Cortei 70% do custo", não "Eu cortei custos em 70%".
- Use números no formato brasileiro: 10.000+, 95%, 0,4 s, "menos de 400 ms".
- Use datas por extenso no locale ("agosto de 2026" / "August 2026"), formatadas pelo código.
- Mantenha os nomes próprios e de produto em inglês: Claude Code, Model Context Protocol, AWS.
- Mantenha o tom: o PT também é direto e em primeira pessoa, sem "o profissional", sem
  terceira pessoa de currículo.

## 7. Registro da seção 05 (Diversão)

Os apps de fim de semana (`src/content/playground/`) são o **único** lugar do site com registro
descontraído, e ele tem regra:

- **`tagline`:** o que o app faz, em linguagem de leigo, uma linha. O jargão de domínio também é
  traduzido aqui ("sismos" → "terremotos", "ISS" → "estação espacial"); a sigla, se precisar
  aparecer, fica no `why`, nunca na tagline.
- **`why`:** por que o Yuri fez, em primeira pessoa, 1 a 2 frases. É o campo que diverte.
- **Número divertido entra** (1025 espécies, 15 expressões, oito fontes de dados). **Métrica de
  negócio, contagem de testes e "impacto" ficam fora:** esta seção não é currículo, e o
  recrutador já leu os números nas seções 02 e 03.
- **Leve é o tom, não a qualidade.** O texto **não** diminui o trabalho. O Yuri chama esses apps
  de "bobinhas"; **o site não** — quem escreve ali é o portfólio, não a conversa.

## 8. Fatos e números

O inventário completo do LinkedIn (cargos, períodos, key achievements e números) está em
**`referencias/inventario-linkedin.md`**. Use-o como fonte de verdade junto com
`docs/Profile.pdf`. **Nenhum número fora dele (ou do README do projeto) entra no site** (RN-06).

## 9. Decisões do Yuri em vigor

- **2026-10-03:** o cargo atual na Smartek é exibido como **"Software Engineer & AI Engineer"** /
  "Engenheiro de Software e de IA" (o LinkedIn diz "Software Engineering"). É também a headline.
- **2026-10-03:** os textos da v1 (Checkpoint B) estão **aprovados**. Texto aprovado só muda com
  pedido do Yuri ou por fato novo da fonte; ajuste de estilo não é motivo.
