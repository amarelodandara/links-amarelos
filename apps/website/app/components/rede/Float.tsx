"use client";

import { useContext } from "react";
import type { ReactNode } from "react";
import ExternalLinkPill from "../ExternalLinkPill";
import { RedeContext } from "./context";
import type { Extra } from "./context";
import { NEWSLETTER, PODCAST } from "./intro";
import { SPOTIFY_SHOW, SUBSTACK } from "./graph";
import Typed from "./Typed";
import { FRAME } from "./hubDials";

/**
 * Where each extra window floats, as an offset of its center from the
 * viewport center, in px. They overlap the hub's edges like windows on a
 * desktop. The scene's loop places them (curve, parallax, zoom) and clamps
 * them inside the viewport on narrow screens.
 */
export const SLOTS = {
  newsletter: { x: 430, y: -40 },
  podcast: { x: 390, y: 190 },
} as const satisfies Record<Extra, { x: number; y: number }>;

const TITLE = "font-sans text-2xl leading-tight outline-none";
const BODY = "font-sans text-base leading-snug";

type Register = (id: Extra, el: HTMLElement | null) => void;

function Frame({ id, label, register, children }: { id: Extra; label: string; register: Register; children: ReactNode }) {
  return (
    <section
      ref={(el) => register(id, el)}
      aria-label={label}
      className={`${FRAME} absolute top-0 left-0 flex w-[min(320px,calc(100vw-32px))] origin-top-left flex-col gap-3 p-5 backface-hidden transition-[opacity,scale] duration-200 ease-out starting:scale-96 starting:opacity-0 motion-reduce:transition-none`}
    >
      {children}
    </section>
  );
}

/** The extra windows open right now, in the order they opened (later on top). */
export default function Floats({ open, register }: { open: readonly Extra[]; register: Register }) {
  const { spawn, finishIntro } = useContext(RedeContext);
  return (
    <div className="rede-stage">
      {open.map((id) => {
        switch (id) {
          case "newsletter":
            return (
              <Frame key={id} id={id} label="links amarelos" register={register}>
                <h2 className={TITLE}>links amarelos</h2>
                <Typed runs={NEWSLETTER} className={BODY} onDone={() => spawn("podcast")} />
                <ExternalLinkPill platform="substack" href={SUBSTACK} className="flex self-start bg-paint" />
              </Frame>
            );
          case "podcast":
            return (
              <Frame key={id} id={id} label="ondas amarelas" register={register}>
                <h2 className={TITLE}>ondas amarelas</h2>
                {/* The last of the intro: once it's typed, the scene steps back. */}
                <Typed runs={PODCAST} className={BODY} onDone={finishIntro} />
                <ExternalLinkPill platform="spotify" href={SPOTIFY_SHOW} className="flex self-start bg-paint" />
              </Frame>
            );
        }
      })}
    </div>
  );
}
