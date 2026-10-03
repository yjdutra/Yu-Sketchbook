// Regras de seleção e ordem do conteúdo, puras (sem `astro:content`), para o Vitest testar sem o
// Astro. Quem busca as collections é src/lib/content.ts, que aplica estas funções.

// RN-03: o único predicado que decide se um projeto é publicado. Em dev os drafts aparecem (com a
// faixa DRAFT) para revisão; em build de produção, nunca.
export function isPublished(data: { draft: boolean }, includeDrafts: boolean): boolean {
  return includeDrafts || !data.draft;
}

// RF-15 e RF-16: `order` crescente; menor aparece primeiro (e, na Trajetória, é o mais recente).
export function byOrder<T extends { data: { order: number } }>(a: T, b: T): number {
  return a.data.order - b.data.order;
}

// RN-04: os achievements de uma experiência são derivados da referência no achievement, nunca
// listados à mão no YAML da experiência.
export function achievementsOf<T extends { data: { experience: { id: string } } }>(
  achievements: readonly T[],
  experienceId: string,
): T[] {
  return achievements.filter((achievement) => achievement.data.experience.id === experienceId);
}

// RN-04: achievements cuja experiência não existe. No Astro 7.3 o `reference()` inválido só gera
// um "[ERROR] Invalid content reference" no log e o build sai com código 0; quem para o build é
// o getJourney(), que lança se esta lista não vier vazia.
type WithExperienceRef = { id: string; data: { experience: { id: string } } };

export function danglingAchievements<T extends WithExperienceRef>(
  achievements: readonly T[],
  experienceIds: ReadonlySet<string>,
): T[] {
  return achievements.filter((achievement) => !experienceIds.has(achievement.data.experience.id));
}

// RF-10 e RF-11: Impacto só mostra o que é destaque E tem número.
export function isImpact(data: { featured: boolean; metric?: unknown }): boolean {
  return data.featured && data.metric !== undefined;
}
