// RF-18 / RF-19: o álbum de selos (skill design-system-portfolio §6). É a única ilha da home e
// hidrata com client:visible: o Preact só baixa quando o álbum entra na tela (RNF-02).
// Recebe tudo pronto do Credentials.astro: textos no idioma da página e URLs de imagem já
// processadas por getImage(). Não importa astro:content nem faz fetch.
import type { CSSProperties, TargetedKeyboardEvent, TargetedMouseEvent } from "preact";
import { useRef, useState } from "preact/hooks";
import { ExternalIcon } from "@/islands/icons";
import "@/islands/BadgeAlbum.css";

export type AlbumBadge = {
  slug: string;
  name: string;
  rotation: number; // graus, −4..4, derivado do slug (src/lib/sticker.ts)
  image: { src: string; srcSet: string; width: number; height: number; alt: string };
  issued?: string; // data já formatada no idioma
  skills: string[];
  verifyUrl?: string;
};

export type AlbumGroup = {
  id: string;
  title: string; // "Claude Academy"
  issuedBy: string; // "Issued by Anthropic"
  count: number;
  countLabel: string; // "4 badges", para leitor de tela
  badges: AlbumBadge[];
};

export type AlbumLabels = {
  hint: string;
  issued: string;
  skills: string;
  verify: string;
  newTab: string;
};

export type BadgeAlbumProps = { groups: AlbumGroup[]; labels: AlbumLabels };

// A rotação vai por variável CSS: o CSS decide quando ela vale (repouso) e quando não (hover,
// foco, virado, reduced motion).
type StickerStyle = CSSProperties & Record<`--${string}`, string>;

export default function BadgeAlbum({ groups, labels }: BadgeAlbumProps) {
  // Um selo virado por vez: virar outro desvira o anterior, sem mover o foco.
  const [flipped, setFlipped] = useState<string | null>(null);
  const buttons = useRef(new Map<string, HTMLButtonElement>());

  // Desvirar devolve o foco ao selo (CA-07): o link Verify some do Tab quando o verso fecha.
  function unflip(slug: string) {
    setFlipped(null);
    buttons.current.get(slug)?.focus();
  }

  function onKeyDown(slug: string, event: TargetedKeyboardEvent<HTMLLIElement>) {
    if (event.key === "Escape" && flipped === slug) {
      event.preventDefault();
      unflip(slug);
    }
  }

  function onBackClick(slug: string, event: TargetedMouseEvent<HTMLDivElement>) {
    if (event.target instanceof Element && event.target.closest("a")) return;
    unflip(slug);
  }

  return (
    <div className="album">
      <p className="album__hint">{labels.hint}</p>
      {groups.map((group) => (
        <div className="album__group" key={group.id}>
          <div className="album__head">
            <h3 className="album__title">{group.title}</h3>
            <span className="album__count" aria-hidden="true">
              · {group.count}
            </span>
            <span className="sr-only">{group.countLabel}</span>
            <span className="album__issuer">{group.issuedBy}</span>
          </div>
          <ul className="stickers">
            {group.badges.map((badge) => {
              const isFlipped = flipped === badge.slug;
              const backId = `badge-back-${badge.slug}`;
              const titleId = `badge-title-${badge.slug}`;
              const style: StickerStyle = { "--r": `${badge.rotation}deg` };
              return (
                <li
                  key={badge.slug}
                  className="sticker"
                  data-flipped={isFlipped ? "" : undefined}
                  style={style}
                  onKeyDown={(event) => onKeyDown(badge.slug, event)}
                >
                  <div className="sticker__inner">
                    <button
                      ref={(node) => {
                        if (node) buttons.current.set(badge.slug, node);
                        else buttons.current.delete(badge.slug);
                      }}
                      className="sticker__front"
                      type="button"
                      aria-expanded={isFlipped}
                      aria-controls={backId}
                      onClick={() => setFlipped(isFlipped ? null : badge.slug)}
                    >
                      <img
                        className="sticker__img sticker-cut"
                        src={badge.image.src}
                        srcSet={badge.image.srcSet}
                        width={badge.image.width}
                        height={badge.image.height}
                        alt={badge.image.alt}
                        loading="lazy"
                        decoding="async"
                      />
                    </button>
                    <div
                      className="sticker__back square-grid"
                      id={backId}
                      role="group"
                      aria-labelledby={titleId}
                      onClick={(event) => onBackClick(badge.slug, event)}
                    >
                      <h4 id={titleId} className="sticker__name">
                        {badge.name}
                      </h4>
                      {badge.issued && (
                        <p className="sticker__when">
                          <span>{labels.issued}</span> {badge.issued}
                        </p>
                      )}
                      {badge.skills.length > 0 && (
                        <ul className="sticker__skills" aria-label={labels.skills}>
                          {badge.skills.map((skill) => (
                            <li key={skill}>{skill}</li>
                          ))}
                        </ul>
                      )}
                      {badge.verifyUrl && (
                        <a
                          className="sticker__verify"
                          href={badge.verifyUrl}
                          target="_blank"
                          rel="noopener"
                        >
                          {labels.verify}
                          <ExternalIcon />
                          <span className="sr-only">{labels.newTab}</span>
                        </a>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
