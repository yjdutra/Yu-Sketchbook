// Só liga os schemas (src/lib/schemas.ts) aos loaders. As regras moram nos schemas; aqui entram as
// duas peças que só existem dentro do Astro: `image()` e `reference()`.
import { defineCollection, reference } from "astro:content";
import { glob } from "astro/loaders";
import {
  achievementSchema,
  credentialSchema,
  experienceSchema,
  playgroundSchema,
  profileSchema,
  projectSchema,
} from "@/lib/schemas";

// Todas as collections são YAML, para a RN-01 valer de forma uniforme pelo schema. O id da
// entrada é o nome do arquivo sem extensão (`yu-book.yaml` → `yu-book`), que vira o slug da rota.
const yaml = (dir: string) => glob({ pattern: "**/*.yaml", base: `./src/content/${dir}` });

const profile = defineCollection({ loader: yaml("profile"), schema: profileSchema });

const experience = defineCollection({ loader: yaml("experience"), schema: experienceSchema });

const achievements = defineCollection({
  loader: yaml("achievements"),
  schema: achievementSchema(reference("experience")),
});

const projects = defineCollection({
  loader: yaml("projects"),
  schema: ({ image }) => projectSchema(image),
});

// A seção 05 ("Por diversão") não tem imagem nem referência: o schema entra inteiro.
const playground = defineCollection({ loader: yaml("playground"), schema: playgroundSchema });

const credentials = defineCollection({
  loader: yaml("credentials"),
  schema: ({ image }) => credentialSchema(image),
});

export const collections = {
  profile,
  experience,
  achievements,
  projects,
  playground,
  credentials,
};
