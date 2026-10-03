// Strings de interface (rótulos, títulos de seção, avisos). O texto é do marketing; a forma é do
// frontend. Toda chave tem `en` e `pt`: o `satisfies` quebra o `pnpm check` se faltar um (RN-01).
// Texto de conteúdo (nome, achievements, projetos) não mora aqui, mora em src/content/**.
import type { Localized } from "@/lib/schemas";

export const ui = {
  "skip.toMain": { en: "Skip to content", pt: "Pular para o conteúdo" },

  // Títulos das seções da home (RF-01). As âncoras são fixas e moram em SECTION_IDS.
  "section.impact": { en: "Impact", pt: "Impacto" },
  "section.projects": { en: "Projects", pt: "Projetos" },
  "section.journey": { en: "Journey", pt: "Trajetória" },
  "section.credentials": { en: "Certifications", pt: "Certificações" },
  "section.contact": { en: "Contact", pt: "Contato" },

  // Subtítulos das seções: uma linha que diz ao recrutador o que ele vai achar ali.
  "section.impact.subtitle": {
    en: "What changed after my work, in numbers.",
    pt: "O que mudou depois do meu trabalho, em números.",
  },
  "section.projects.subtitle": {
    en: "Products I built, from the problem to production.",
    pt: "Produtos que construí, do problema à produção.",
  },
  "section.journey.subtitle": {
    en: "From agricultural engineering to software and applied AI.",
    pt: "Da Engenharia Agrícola ao software e à IA aplicada.",
  },
  "section.credentials.subtitle": {
    en: "Courses in applied AI and cloud.",
    pt: "Cursos de IA aplicada e nuvem.",
  },
  "section.contact.subtitle": {
    en: "Open to remote work with international teams. Email is the fastest way to reach me.",
    pt: "Aberto a trabalho remoto com times internacionais. O e-mail é o jeito mais rápido de falar comigo.",
  },

  // Chamadas para ação (Hero e Contato).
  "cta.email": { en: "Email me", pt: "Mande um e-mail" },
  "cta.linkedin": { en: "Connect on LinkedIn", pt: "Conecte-se no LinkedIn" },
  "cta.github": { en: "See my GitHub", pt: "Ver meu GitHub" },
  "cta.downloadCv": { en: "Download CV", pt: "Baixar currículo" },
  "cta.seeProjects": { en: "See projects", pt: "Ver projetos" },

  // Achievement: rótulos de problema → ação → resultado (skill voz-e-narrativa §3).
  "achievement.problem": { en: "Problem", pt: "Problema" },
  "achievement.action": { en: "What I did", pt: "O que fiz" },
  "achievement.result": { en: "Result", pt: "Resultado" },

  // Trajetória: cargo sem `end` é o atual.
  "experience.present": { en: "Present", pt: "Atual" },
  // RF-16: título do bloco de formação, no fim da Trajetória.
  "journey.education": { en: "Education", pt: "Formação" },

  // Projeto: status, visibilidade (RN-02) e títulos da página de projeto (RF-14).
  "project.status.production": { en: "In production", pt: "Em produção" },
  "project.status.development": { en: "In development", pt: "Em desenvolvimento" },
  "project.status.archived": { en: "Archived", pt: "Arquivado" },
  "project.visibility.public": { en: "Public · GitHub", pt: "Público · GitHub" },
  "project.visibility.restricted": {
    en: "Private code · details on request",
    pt: "Código privado · detalhes sob consulta",
  },
  "project.viewCode": { en: "View the code on GitHub", pt: "Ver o código no GitHub" },
  "project.openLive": { en: "Open the app", pt: "Abrir o app" },
  "project.readMore": { en: "See the project", pt: "Ver o projeto" },
  "project.problem": { en: "The problem", pt: "O problema" },
  "project.whatItDoes": { en: "What it does", pt: "O que faz" },
  "project.highlights": { en: "Highlights", pt: "Destaques" },
  "project.stack": { en: "Built with", pt: "Feito com" },
  "project.gallery": { en: "Screens", pt: "Telas" },

  // Credenciais (RF-18).
  "credential.verify": { en: "Verify", pt: "Verificar" },
  "credential.issued": { en: "Issued", pt: "Emitida em" },
  "credential.skills": { en: "What it covers", pt: "O que cobre" },

  // RF-21: meta description da home, 140–160 caracteres. Números do docs/Profile.pdf (RN-06).
  "meta.home.description": {
    en: "Yuri J. Dutra, software and AI engineer in Brazil. Real products: 70% lower sales tool costs, 35% fewer production errors. Open to remote work.",
    pt: "Yuri J. Dutra, engenheiro de software e IA no Brasil. Produtos reais: 70% menos custo com ferramentas, 35% menos erros em produção. Aberto a remoto.",
  },

  "nav.label": { en: "Main", pt: "Principal" },
  "theme.toggle": { en: "Toggle theme", pt: "Alternar tema" },
  "language.label": { en: "Language", pt: "Idioma" },
  // Nome do idioma de destino, escrito nele mesmo (o leitor procura a própria língua).
  "language.name": { en: "English", pt: "Português" },

  "project.backHome": { en: "Back to home", pt: "Voltar para o início" },
  "draft.banner": {
    en: "DRAFT: not published in production",
    pt: "RASCUNHO: não é publicado em produção",
  },

  "notFound.title": { en: "Page not found", pt: "Página não encontrada" },
  "notFound.body": {
    en: "This page doesn't exist or has moved. The home page has my results, projects and contact.",
    pt: "Esta página não existe ou mudou de endereço. Na página inicial estão meus resultados, projetos e contato.",
  },
  "notFound.backHome": { en: "Go to the home page", pt: "Ir para a página inicial" },
} as const satisfies Record<string, Localized<string>>;

export type UiKey = keyof typeof ui;

// RF-01: âncoras da home, iguais nos dois idiomas para o link /#projects valer em /pt/#projects.
export const SECTION_IDS = {
  impact: "impact",
  projects: "projects",
  journey: "journey",
  credentials: "credentials",
  contact: "contact",
} as const;
