// Rotação de repouso do adesivo no álbum (skill design-system-portfolio §6). Derivada do slug, e
// não de Math.random(), para o build ser reproduzível e o selo não "pular" entre deploys. Pura.

const MAX_DEGREES = 4;

// FNV-1a de 32 bits: curto, sem dependência e bem espalhado para slugs parecidos.
function hash(text: string): number {
  let value = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    value ^= text.charCodeAt(i);
    value = Math.imul(value, 0x01000193);
  }
  return value >>> 0;
}

// Ângulo entre −4° e 4°, com uma casa decimal.
export function stickerRotation(slug: string): number {
  const unit = hash(slug) / 0xffffffff; // 0..1
  return Math.round((unit * 2 - 1) * MAX_DEGREES * 10) / 10;
}
