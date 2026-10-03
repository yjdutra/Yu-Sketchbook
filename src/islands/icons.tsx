// Os mesmos desenhos de src/components/icons/Icon.astro, para a ilha Preact (que não renderiza
// componente Astro). Decorativos: o nome vai no controle ou no texto ao lado. Atributos SVG em
// kebab-case: sem o compat, o Preact não traduz strokeWidth para stroke-width.

export function ExternalIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width={1.8}
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M8 16 16 8M10 8h6v6" />
    </svg>
  );
}
