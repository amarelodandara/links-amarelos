import type { CSSProperties } from "react";
import Image from "next/image";
import Button from "../Button";
import ExternalLinkPill from "../ExternalLinkPill";

type TasteEndingProps = {
  onAgain: () => void;
};

const MEDIA = [
  {
    key: "newsletter",
    name: "links amarelos",
    kind: "a newsletter",
    cover: "/brand/links-amarelos-8.png",
    platform: "substack",
    href: "https://amarelodandara.substack.com",
    tilt: "-rotate-6",
  },
  {
    key: "podcast",
    name: "ondas amarelas",
    kind: "o podcast",
    cover: "/brand/ondas-amarelas-8.png",
    platform: "spotify",
    href: "https://open.spotify.com/show/043Gs7eyY2KOlotEWSTSxB?si=e7abf2b9730747d7",
    tilt: "rotate-6",
  },
] satisfies readonly {
  key: string;
  name: string;
  kind: string;
  cover: string;
  platform: "substack" | "spotify";
  href: string;
  tilt: string;
}[];

// Each popping piece reads its place in the stagger from --i.
const beat = (index: number): CSSProperties & Record<"--i", string> => ({
  "--i": String(index),
});

// The ending mounts as the view starts closing in (framingSeconds in
// field.ts); the first piece lands near the end of that move.
const ENTER: CSSProperties & Record<"--pop-delay", string> = {
  "--pop-delay": "1000ms",
};

/** Beside the turning patch: the two places the rest of the links live.
 *  Each piece pops in on its own beat (`taste-pop` in globals.css,
 *  staggered through --i). */
export default function TasteEnding({ onAgain }: TasteEndingProps) {
  return (
    <div className="flex w-full max-w-sm flex-col gap-4" style={ENTER}>
      {/* Headline copy goes here once it is written. */}
      {MEDIA.map((media, index) => (
        <div
          key={media.key}
          className="taste-pop flex items-center gap-4 rounded-2xl border border-brand-black bg-brand-white p-3 shadow-[0.25rem_0.25rem_0] shadow-brand-black/15"
          style={beat(index)}
        >
          <Image
            src={media.cover}
            width={2000}
            height={2000}
            alt={`capa de ${media.name}`}
            className={`size-16 shrink-0 outline outline-2 outline-sun-light ${media.tilt}`}
          />
          <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
            <div>
              <p className="font-manrope font-bold tracking-tight">
                {media.name}
              </p>
              <p className="font-space-mono text-xs lowercase text-brand-black/70">
                {media.kind}
              </p>
            </div>
            <ExternalLinkPill
              platform={media.platform}
              href={media.href}
              className="bg-white/60"
            />
          </div>
        </div>
      ))}

      <div className="taste-pop self-center" style={beat(2)}>
        <Button variant="ghost" onClick={onAgain}>
          provar de novo
        </Button>
      </div>
    </div>
  );
}
