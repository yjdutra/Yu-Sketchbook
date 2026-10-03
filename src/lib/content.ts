// Ponto único de leitura das collections para páginas, componentes e sitemap. As regras puras
// (draft, ordem, relação derivada) moram em src/lib/content-rules.ts.
import { getCollection, type CollectionEntry } from "astro:content";
import {
  achievementsOf,
  byOrder,
  danglingAchievements,
  isImpact,
  isPublished,
} from "@/lib/content-rules";

export type Profile = CollectionEntry<"profile">;
export type Experience = CollectionEntry<"experience">;
export type Achievement = CollectionEntry<"achievements">;
export type Project = CollectionEntry<"projects">;
export type Credential = CollectionEntry<"credentials">;

// RN-03: listagem, getStaticPaths e sitemap passam por aqui. Não filtre `draft` em outro lugar.
export async function getPublishedProjects(): Promise<Project[]> {
  const projects = await getCollection("projects", (p) => isPublished(p.data, import.meta.env.DEV));
  return projects.sort(byOrder);
}

// O profile é único. Zero ou dois arquivos é erro de conteúdo, e o build deve parar.
export async function getProfile(): Promise<Profile> {
  const entries = await getCollection("profile");
  const [profile, ...rest] = entries;
  if (!profile || rest.length > 0) {
    throw new Error(`src/content/profile/ precisa de exatamente 1 entrada; há ${entries.length}.`);
  }
  return profile;
}

export type JourneyItem = { experience: Experience; achievements: Achievement[] };

// RF-16 e RN-04: experiências da mais recente para a mais antiga, cada uma com os achievements
// derivados da referência.
export async function getJourney(): Promise<JourneyItem[]> {
  const [experiences, achievements] = await Promise.all([
    getCollection("experience"),
    getCollection("achievements"),
  ]);
  const dangling = danglingAchievements(achievements, new Set(experiences.map((e) => e.id)));
  if (dangling.length > 0) {
    const list = dangling.map((a) => `${a.id} → ${a.data.experience.id}`).join(", ");
    throw new Error(`RN-04: achievement aponta para experiência inexistente: ${list}`);
  }
  const sortedAchievements = achievements.sort(byOrder);
  return experiences.sort(byOrder).map((experience) => ({
    experience,
    achievements: achievementsOf(sortedAchievements, experience.id),
  }));
}

// RF-10: os cartões de Impacto.
export async function getImpactAchievements(): Promise<Achievement[]> {
  const achievements = await getCollection("achievements", (a) => isImpact(a.data));
  return achievements.sort(byOrder);
}

// RN-05: com badge vai para o álbum; sem badge, para a lista simples.
export async function getCredentials(): Promise<{ album: Credential[]; list: Credential[] }> {
  const credentials = (await getCollection("credentials")).sort(byOrder);
  return {
    album: credentials.filter((c) => c.data.badge !== undefined),
    list: credentials.filter((c) => c.data.badge === undefined),
  };
}

// getStaticPaths compartilhado pelas rotas EN e PT do projeto (RF-03), para as duas usarem o
// mesmo filtro de draft.
export async function getProjectPaths() {
  const projects = await getPublishedProjects();
  return projects.map((project) => ({ params: { slug: project.id }, props: { project } }));
}
