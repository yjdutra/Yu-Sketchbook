// Schemas Zod das collections, puros: só dependem de `astro/zod` (que é o zod v4 reexportado, sem
// módulo virtual). O que só existe dentro do Astro, `image()` e `reference()`, entra por parâmetro,
// para que o Vitest consiga validar as regras de negócio sem subir o Astro.
// Ligação com os loaders: src/content.config.ts.
import { z } from "astro/zod";

// RN-01: todo texto visível existe nos dois idiomas. `strictObject` também recusa uma terceira
// chave (um "es" esquecido vira erro, não lixo silencioso).
export const localized = <T extends z.ZodType>(value: T) =>
  z.strictObject({ en: value, pt: value });

export type Localized<T> = { en: T; pt: T };

const text = localized(z.string().trim().min(1));

// Valor que pode ser neutro ("−35%", "<400 ms") ou depender do idioma ("days" / "dias"). Quem lê
// resolve com resolveLocalizable() (src/lib/localizable.ts), nunca com `typeof` no componente.
const localizable = <T extends z.ZodType>(value: T) => z.union([value, localized(value)]);

// O repositório citado num projeto público é sempre o do GitHub (RF-13).
const githubUrl = z.url({ protocol: /^https$/, hostname: /^github\.com$/ });
const httpsUrl = z.url({ protocol: /^https$/ });

export const profileSchema = z
  .object({
    name: z.string().min(1),
    headline: text, // "Software Engineer & AI Engineer"
    valueProp: text, // a frase do Hero, em linguagem leiga
    // Trecho da valueProp que leva o traço de caneta. Ausente: a última oração (src/lib/emphasis.ts).
    valuePropMark: text.optional(),
    // A nota "At a glance" ao lado do Hero: 2 a 4 números do resumo. Vazio: a nota não aparece.
    glance: z
      .array(z.object({ value: localizable(z.string().trim().min(1)), label: text }))
      .max(4)
      .default([]),
    summary: text, // 2 a 3 frases
    location: text, // "Goiânia, Brazil · open to remote"
    email: z.email(),
    links: z.object({ linkedin: httpsUrl, github: httpsUrl }),
    // Um PDF por idioma, servido de public/cv/. RN-07: o PDF não tem telefone.
    cv: localized(z.string().regex(/^\/cv\/[a-z0-9-]+\.pdf$/, "caminho esperado: /cv/<nome>.pdf")),
    // RF-16: a formação fecha a Trajetória, depois das experiências.
    education: z
      .array(
        z.object({
          institution: z.string().min(1), // nome próprio, não traduz
          degree: text,
          start: z.coerce.date(),
          end: z.coerce.date().optional(), // ausente = em andamento
        }),
      )
      .default([]),
  })
  .superRefine((profile, ctx) => {
    // O traço precisa achar o trecho nos dois idiomas; senão ele some sem aviso de um deles.
    const mark = profile.valuePropMark;
    if (!mark) return;
    for (const locale of ["en", "pt"] as const) {
      // O trecho não quebra linha (o traço não se parte); longo, abriria rolagem no celular.
      if (mark[locale].length > 32) {
        ctx.addIssue({
          code: "custom",
          path: ["valuePropMark", locale],
          message: "valuePropMark tem no máximo 32 caracteres",
        });
      }
      if (!profile.valueProp[locale].includes(mark[locale])) {
        ctx.addIssue({
          code: "custom",
          path: ["valuePropMark", locale],
          message: "valuePropMark precisa ser um trecho da valueProp do mesmo idioma",
        });
      }
    }
  });

export const experienceSchema = z.object({
  company: z.string().min(1),
  role: text,
  start: z.coerce.date(),
  end: z.coerce.date().optional(), // ausente = cargo atual
  location: z.string().min(1),
  summary: text,
  order: z.number().int(), // menor = mais recente
});

// RN-04: a referência é injetada (`reference("experience")` no Astro) para o Astro validar que a
// experiência existe. A lista de achievements de uma experiência é derivada, não duplicada.
export const achievementSchema = <R extends z.ZodType>(experienceRef: R) =>
  z.object({
    experience: experienceRef,
    title: text,
    metric: z
      .object({
        // "5 s", ou { en: "days", pt: "dias" } quando a unidade se traduz
        before: localizable(z.string().trim().min(1)).optional(),
        after: localizable(z.string().trim().min(1)), // "<400 ms"
        label: text, // "screen navigation time"
      })
      .optional(), // RF-11: sem métrica, aparece só na Trajetória
    problem: text,
    action: text,
    result: text,
    skills: z.array(z.string().min(1)).max(5),
    featured: z.boolean().default(false), // aparece em Impacto (RF-10)
    order: z.number().int(),
  });

export const projectSchema = <I extends z.ZodType>(image: () => I) =>
  z
    .object({
      name: z.string().min(1), // nome próprio, não traduz
      tagline: text,
      status: z.enum(["production", "development", "archived"]),
      visibility: z.enum(["public", "restricted"]),
      repo: githubUrl.optional(),
      liveUrl: httpsUrl.optional(),
      problem: text,
      whatItDoes: text,
      highlights: z.array(z.object({ title: text, body: text })).min(1).max(6),
      stack: z.array(z.string().min(1)).min(1),
      cover: image(),
      coverAlt: text,
      gallery: z
        .array(z.object({ image: image(), alt: text, caption: text.optional() }))
        .default([]),
      order: z.number().int(),
      featured: z.boolean().default(false),
      draft: z.boolean().default(false), // RN-03: filtrado só em getPublishedProjects()
    })
    .superRefine((project, ctx) => {
      // RN-02: público mostra o código; restrito não pode vazar o link.
      if (project.visibility === "public" && !project.repo) {
        ctx.addIssue({ code: "custom", path: ["repo"], message: "public exige repo (RN-02)" });
      }
      if (project.visibility === "restricted" && project.repo) {
        ctx.addIssue({ code: "custom", path: ["repo"], message: "restricted proíbe repo (RN-02)" });
      }
    });

// Por que `playground` não é `projects`: na seção 05 não há capa, selo de status, visibilidade nem
// página de detalhe — é a seção leve da home, e o schema leve é o que impede ela de virar
// currículo. Sem `draft` e sem `featured`: os três experimentos sempre aparecem, na ordem de
// `order`. Um campo novo aqui é sinal de que o experimento virou projeto e deve mudar de
// collection.
export const playgroundSchema = z.object({
  name: z.string().min(1), // nome próprio, não traduz ("PokéDex Arena")
  tagline: text, // uma linha, em linguagem de leigo
  why: text, // 1 a 2 frases na voz do Yuri: é o campo descontraído da página
  repo: githubUrl, // obrigatório, não opcional: todo experimento desta seção é público
  liveUrl: httpsUrl.optional(), // só o PokéDex Arena tem demo jogável
  stack: z.array(z.string().min(1)).min(1).max(4),
  icon: z.enum(["joystick", "cat", "satellite"]), // o desenho mora em Icon.astro
  order: z.number().int(),
});

export const credentialSchema = <I extends z.ZodType>(image: () => I) =>
  z.object({
    name: z.string().min(1), // nome oficial, não traduz
    issuer: z.string().min(1), // "Anthropic", "Amazon Web Services"
    track: z.string().min(1).optional(), // "Claude Academy": agrupa no álbum (RF-18)
    issuedAt: z.coerce.date().optional(),
    verifyUrl: httpsUrl.optional(),
    // RN-05: com badge vai para o álbum; sem badge, para a lista simples.
    badge: z.object({ sticker: image(), card: image() }).optional(),
    skills: z.array(text).max(4).default([]),
    order: z.number().int(),
  });
