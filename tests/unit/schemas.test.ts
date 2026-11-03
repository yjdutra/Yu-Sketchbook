// CA-06 e CA-08: as regras de RN-01 e RN-02 moram no schema, então o schema é quem tem de recusar.
// O build (`pnpm build`) usa estes mesmos schemas via src/content.config.ts.
import { z } from "astro/zod";
import { describe, expect, it } from "vitest";
import {
  achievementSchema,
  credentialSchema,
  experienceSchema,
  localized,
  playgroundSchema,
  profileSchema,
  projectSchema,
} from "@/lib/schemas";
import { loadCollection, type CollectionName } from "../support/content";

// `image()` e `reference()` só existem dentro do Astro; aqui entram dublês (skill
// portoes-de-qualidade §4).
const image = () => z.any();
const projects = projectSchema(image);
const credentials = credentialSchema(image);
const achievements = achievementSchema(z.object({ id: z.string() }));
// No YAML a referência é o id em texto; o Astro a transforma em { collection, id }.
const achievementsFromYaml = achievementSchema(z.string().transform((id) => ({ id })));

const L = (en: string, pt: string) => ({ en, pt });

const validProject = {
  name: "Yu-book",
  tagline: L("A tagline", "Uma tagline"),
  status: "production",
  visibility: "public",
  repo: "https://github.com/yjdutra/Yu-book",
  problem: L("Problem", "Problema"),
  whatItDoes: L("Does", "Faz"),
  highlights: [{ title: L("Title", "Título"), body: L("Body", "Corpo") }],
  stack: ["TypeScript"],
  cover: "cover.png",
  coverAlt: L("Cover", "Capa"),
  order: 1,
};

const validAchievement = {
  experience: { id: "smartek" },
  title: L("Title", "Título"),
  metric: { before: "5 s", after: "<400 ms", label: L("label", "rótulo") },
  problem: L("p", "p"),
  action: L("a", "a"),
  result: L("r", "r"),
  skills: ["React Native"],
  order: 1,
};

// Seção 05 ("Por diversão"). O fixture tem o mínimo: `liveUrl` é opcional de propósito.
const validToy = {
  name: "PokéDex Arena",
  tagline: L("All 1,025 Pokémon in one place.", "As 1025 espécies num lugar só."),
  why: L("I wanted the rules right.", "Quis acertar as regras."),
  repo: "https://github.com/yjdutra/pokedex-arena",
  stack: ["React", "TypeScript"],
  icon: "joystick",
  order: 1,
};

const issuesAt = (result: { success: boolean; error?: z.ZodError }) =>
  result.error?.issues.map((issue) => issue.path.join(".")) ?? [];

describe("localized() — RN-01", () => {
  const text = localized(z.string().trim().min(1));

  it("aceita en e pt", () => {
    expect(text.safeParse({ en: "Hi", pt: "Oi" }).success).toBe(true);
  });

  it("recusa sem pt (CA-08)", () => {
    expect(text.safeParse({ en: "Hi" }).success).toBe(false);
  });

  it("recusa sem en", () => {
    expect(text.safeParse({ pt: "Oi" }).success).toBe(false);
  });

  it("recusa pt vazio ou só com espaços", () => {
    expect(text.safeParse({ en: "Hi", pt: "" }).success).toBe(false);
    expect(text.safeParse({ en: "Hi", pt: "   " }).success).toBe(false);
  });

  it("recusa uma terceira chave (um `es` esquecido não vira lixo silencioso)", () => {
    expect(text.safeParse({ en: "Hi", pt: "Oi", es: "Hola" }).success).toBe(false);
  });
});

describe("projectSchema — RN-02 / CA-06", () => {
  it("public com repo passa", () => {
    expect(projects.safeParse(validProject).success).toBe(true);
  });

  it("public sem repo é recusado, apontando para `repo`", () => {
    const { repo: _repo, ...withoutRepo } = validProject;
    const result = projects.safeParse(withoutRepo);
    expect(result.success).toBe(false);
    expect(issuesAt(result)).toContain("repo");
  });

  it("restricted sem repo passa (o build segue e o cartão mostra o cadeado)", () => {
    const { repo: _repo, ...withoutRepo } = validProject;
    expect(projects.safeParse({ ...withoutRepo, visibility: "restricted" }).success).toBe(true);
  });

  it("restricted com repo é recusado, apontando para `repo`", () => {
    const result = projects.safeParse({ ...validProject, visibility: "restricted" });
    expect(result.success).toBe(false);
    expect(issuesAt(result)).toContain("repo");
  });

  it("repo fora do GitHub ou sem https é recusado (RF-13)", () => {
    expect(projects.safeParse({ ...validProject, repo: "https://gitlab.com/x/y" }).success).toBe(
      false,
    );
    expect(projects.safeParse({ ...validProject, repo: "http://github.com/x/y" }).success).toBe(
      false,
    );
  });

  it("draft é false por padrão (RN-03: publicar é o caso comum, esconder é explícito)", () => {
    const result = projects.parse(validProject);
    expect(result.draft).toBe(false);
  });

  it("tagline sem pt é recusada (CA-08)", () => {
    const result = projects.safeParse({ ...validProject, tagline: { en: "Only English" } });
    expect(result.success).toBe(false);
    expect(issuesAt(result)).toContain("tagline.pt");
  });

  it("status e visibility fora do enum são recusados", () => {
    expect(projects.safeParse({ ...validProject, status: "beta" }).success).toBe(false);
    expect(projects.safeParse({ ...validProject, visibility: "private" }).success).toBe(false);
  });
});

// Seção 05: o schema é leve de propósito (sem capa, sem status, sem visibilidade), mas as duas
// regras que o sustentam são duras — todo experimento é público (tem `repo`) e todo texto tem os
// dois idiomas (RN-01 / CA-08).
describe("playgroundSchema — seção 05", () => {
  it("o fixture mínimo passa (liveUrl é opcional)", () => {
    const result = playgroundSchema.safeParse(validToy);
    expect(result.error?.issues ?? []).toEqual([]);
  });

  it("sem repo é recusado, apontando para `repo`", () => {
    const { repo: _repo, ...withoutRepo } = validToy;
    const result = playgroundSchema.safeParse(withoutRepo);
    expect(result.success).toBe(false);
    expect(issuesAt(result)).toContain("repo");
  });

  it("repo fora do GitHub ou sem https é recusado", () => {
    expect(playgroundSchema.safeParse({ ...validToy, repo: "https://gitlab.com/x/y" }).success).toBe(
      false,
    );
    expect(playgroundSchema.safeParse({ ...validToy, repo: "http://github.com/x/y" }).success).toBe(
      false,
    );
  });

  it("liveUrl aceita https e recusa http", () => {
    const live = "https://yjdutra.github.io/pokedex-arena/";
    expect(playgroundSchema.safeParse({ ...validToy, liveUrl: live }).success).toBe(true);
    const result = playgroundSchema.safeParse({ ...validToy, liveUrl: "http://exemplo.com/" });
    expect(result.success).toBe(false);
    expect(issuesAt(result)).toContain("liveUrl");
  });

  it("icon fora do enum é recusado (o desenho precisa existir em Icon.astro)", () => {
    const result = playgroundSchema.safeParse({ ...validToy, icon: "rocket" });
    expect(result.success).toBe(false);
    expect(issuesAt(result)).toContain("icon");
  });

  it("stack vazia ou com 5 itens é recusada; 1 a 4 passa", () => {
    expect(playgroundSchema.safeParse({ ...validToy, stack: [] }).success).toBe(false);
    expect(playgroundSchema.safeParse({ ...validToy, stack: ["a", "b", "c", "d", "e"] }).success).toBe(
      false,
    );
    expect(playgroundSchema.safeParse({ ...validToy, stack: ["a"] }).success).toBe(true);
    expect(playgroundSchema.safeParse({ ...validToy, stack: ["a", "b", "c", "d"] }).success).toBe(
      true,
    );
    // Item vazio no meio da lista também não passa: viraria uma pastilha sem texto no cartão.
    expect(playgroundSchema.safeParse({ ...validToy, stack: ["a", ""] }).success).toBe(false);
  });

  it("texto só com `en` é recusado, em qualquer campo (RN-01 / CA-08)", () => {
    for (const field of ["tagline", "why"] as const) {
      const result = playgroundSchema.safeParse({ ...validToy, [field]: { en: "Only English" } });
      expect(result.success, `${field} só com en deveria falhar`).toBe(false);
      expect(issuesAt(result)).toContain(`${field}.pt`);
    }
  });

  it("texto em branco não passa por Localized (RN-01 não é só a chave presente)", () => {
    const result = playgroundSchema.safeParse({ ...validToy, why: L("Why", "   ") });
    expect(result.success).toBe(false);
    expect(issuesAt(result)).toContain("why.pt");
  });

  it("os três experimentos reais passam, e nenhum traz draft ou featured", () => {
    const toys = loadCollection("playground");
    expect(toys.length).toBeGreaterThan(0);
    for (const toy of toys) {
      const result = playgroundSchema.safeParse(toy.data);
      expect(result.error?.issues ?? [], `${toy.id} no schema`).toEqual([]);
      // O schema ignora chave desconhecida em silêncio: um `draft: true` aqui não esconderia
      // nada e o YAML mentiria para quem o lê. A seção 05 não tem rascunho (ver getPlayground()).
      expect(Object.keys(toy.data), `${toy.id}`).not.toContain("draft");
      expect(Object.keys(toy.data), `${toy.id}`).not.toContain("featured");
    }
  });

  // Não fixa qual experimento tem demo (isso é decisão de conteúdo), e sim que o conteúdo real
  // exercita os dois ramos: senão o e2e do segundo link passaria sem testar nada.
  it("o conteúdo real tem experimento com liveUrl e experimento sem", () => {
    const toys = loadCollection("playground");
    expect(toys.filter((toy) => toy.data.liveUrl !== undefined).length).toBeGreaterThan(0);
    expect(toys.filter((toy) => toy.data.liveUrl === undefined).length).toBeGreaterThan(0);
  });
});

describe("achievementSchema — métrica localizable", () => {
  it("aceita métrica neutra", () => {
    expect(achievements.safeParse(validAchievement).success).toBe(true);
  });

  it("aceita métrica Localized", () => {
    const metric = { after: L("3 days", "3 dias"), label: L("l", "l") };
    expect(achievements.safeParse({ ...validAchievement, metric }).success).toBe(true);
  });

  it("recusa métrica Localized sem pt (CA-08)", () => {
    const metric = { after: { en: "3 days" }, label: L("l", "l") };
    expect(achievements.safeParse({ ...validAchievement, metric }).success).toBe(false);
  });

  it("aceita achievement sem métrica (RF-11: vai só para a Trajetória)", () => {
    const { metric: _metric, ...withoutMetric } = validAchievement;
    expect(achievements.safeParse(withoutMetric).success).toBe(true);
  });

  it("featured é false por padrão e skills tem no máximo 5", () => {
    expect(achievements.parse(validAchievement).featured).toBe(false);
    const skills = ["a", "b", "c", "d", "e", "f"];
    expect(achievements.safeParse({ ...validAchievement, skills }).success).toBe(false);
  });
});

describe("profileSchema — CV sem caminho arbitrário", () => {
  const [profile] = loadCollection("profile");

  it("o profile real passa", () => {
    expect(profileSchema.safeParse(profile?.data).success).toBe(true);
  });

  it("recusa CV fora de /cv/<nome>.pdf", () => {
    const data = { ...profile?.data, cv: L("/cv/a.pdf", "https://x.com/cv.pdf") };
    expect(profileSchema.safeParse(data).success).toBe(false);
  });
});

// CA-08 no conteúdo real: para cada entrada de cada collection, remover `pt` de QUALQUER campo
// Localized (achado percorrendo o objeto) tem de quebrar a validação.
const schemaOf: Record<CollectionName, z.ZodType> = {
  profile: profileSchema,
  experience: experienceSchema,
  achievements: achievementsFromYaml,
  projects,
  playground: playgroundSchema,
  credentials,
};

type Path = (string | number)[];

function localizedPaths(value: unknown, path: Path = []): Path[] {
  if (Array.isArray(value)) return value.flatMap((item, i) => localizedPaths(item, [...path, i]));
  if (typeof value !== "object" || value === null || value instanceof Date) return [];
  const keys = Object.keys(value).sort();
  if (keys.length === 2 && keys[0] === "en" && keys[1] === "pt") return [path];
  return Object.entries(value).flatMap(([key, child]) => localizedPaths(child, [...path, key]));
}

function withoutPt(data: Record<string, unknown>, path: Path): unknown {
  const clone: unknown = structuredClone(data);
  let node: unknown = clone;
  for (const key of path) node = (node as Record<string | number, unknown>)[key];
  delete (node as { pt?: unknown }).pt;
  return clone;
}

describe.each(Object.keys(schemaOf) as CollectionName[])("conteúdo real: %s", (name) => {
  const entries = loadCollection(name);
  const schema = schemaOf[name];

  it("tem ao menos uma entrada", () => {
    expect(entries.length).toBeGreaterThan(0);
  });

  it.each(entries.map((e) => [e.id, e] as const))("%s passa no schema", (_id, entry) => {
    const result = schema.safeParse(entry.data);
    expect(result.error?.issues ?? []).toEqual([]);
  });

  it.each(entries.map((e) => [e.id, e] as const))(
    "%s: remover `pt` de qualquer campo Localized é recusado (CA-08)",
    (_id, entry) => {
      // Entrada sem nenhum Localized é legítima (credencial AWS: só nome próprio e emissor).
      for (const path of localizedPaths(entry.data)) {
        const result = schema.safeParse(withoutPt(entry.data, path));
        expect(result.success, `sem pt em ${path.join(".")} deveria falhar`).toBe(false);
      }
    },
  );
});
