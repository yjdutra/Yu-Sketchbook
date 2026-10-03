// Separa a proposta de valor do Hero no trecho que leva o traço de caneta (skill
// design-system-portfolio §5, "Hero"). Pura, para o Vitest testar.

// Mesmo limite do schema (profile.valuePropMark).
export const MAX_MARK_LENGTH = 32;

export type Emphasis = { before: string; mark: string; after: string };

// `mark` vem do conteúdo (profile.valuePropMark) e o schema garante que é um trecho do texto. Sem
// ele, o traço vai na última oração (depois da última vírgula), sem o ponto final.
export function splitEmphasis(text: string, mark?: string): Emphasis {
  if (mark) {
    const at = text.indexOf(mark);
    if (at !== -1) {
      return { before: text.slice(0, at), mark, after: text.slice(at + mark.length) };
    }
  }
  const trimmed = text.trimEnd();
  const punctuation = /[.!?]$/.test(trimmed) ? trimmed.slice(-1) : "";
  const body = punctuation ? trimmed.slice(0, -1) : trimmed;
  const comma = body.lastIndexOf(", ");
  // O trecho marcado não quebra linha (o traço não se parte); longo demais abriria rolagem
  // horizontal no celular. Sem vírgula, ou com a última oração longa, ficam as 3 últimas palavras.
  const clause = comma === -1 ? "" : body.slice(comma + 2);
  if (clause && clause.length <= MAX_MARK_LENGTH) {
    return { before: body.slice(0, comma + 2), mark: clause, after: punctuation };
  }
  const words = body.split(" ");
  const tail = words.slice(-3).join(" ");
  return { before: body.slice(0, body.length - tail.length), mark: tail, after: punctuation };
}
