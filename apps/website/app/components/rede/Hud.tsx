"use client";

import type { ReactNode, Ref } from "react";
import Link from "next/link";
import Button from "../Button";
import LogoOdometer from "../LogoOdometer";

type HudProps = {
  /** The status line's text node: the scene writes coordinates into it every frame. */
  statusRef: Ref<HTMLSpanElement>;
  onToggleTheme: () => void;
};

/** A keycap, Fez / Watch Dogs style. */
function Key({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-grid min-w-7 place-items-center rounded-sm border-2 border-(--rede-ink) px-1.5 py-0.5 font-geist-mono text-[11px] leading-none text-(--rede-ink)">
      {children}
    </kbd>
  );
}

const PANEL = "rounded-md border-2 border-(--rede-ink) bg-(--rede-hud) backdrop-blur-sm";

/**
 * The front layer: fixed chrome that never moves with the camera. Logo,
 * theme and support at the top; controls legend and status at the bottom.
 */
export default function Hud({ statusRef, onToggleTheme }: HudProps) {
  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-20 flex items-start justify-between p-4 md:p-6">
        <Link
          href="/"
          aria-label="links amarelos — página inicial"
          className={`${PANEL} pointer-events-auto px-3 py-2 text-(--rede-ink) focus-visible:outline-2 focus-visible:outline-(--rede-accent)`}
        >
          <LogoOdometer interactive />
        </Link>
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleTheme}
            className={`${PANEL} grid size-11 place-items-center text-(--rede-ink) focus-visible:outline-2 focus-visible:outline-(--rede-accent)`}
          >
            <span className="rede-light-only">
              <span className="sr-only">tema escuro</span>
              <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
                <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" fill="currentColor" />
              </svg>
            </span>
            <span className="rede-dark-only">
              <span className="sr-only">tema claro</span>
              <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
                <circle cx="12" cy="12" r="5" fill="currentColor" />
                <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                </g>
              </svg>
            </span>
          </button>
          <span className="rede-light-only">
            <Button variant="primary" href="/apoio" className="text-sm">
              Apoie
            </Button>
          </span>
          <span className="rede-dark-only">
            <Button variant="primary-inverted" href="/apoio" className="text-sm">
              Apoie
            </Button>
          </span>
        </div>
      </header>

      <footer className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex items-end justify-between gap-4 p-4 md:p-6">
        <dl
          aria-label="controles"
          className={`${PANEL} hidden gap-x-3 gap-y-2 px-3 py-2.5 font-sans text-xs text-(--rede-ink) [@media(pointer:fine)]:grid [grid-template-columns:auto_auto]`}
        >
          <dt><Key>arrastar</Key></dt>
          <dd className="self-center">mover</dd>
          <dt><Key>rolar</Key></dt>
          <dd className="self-center">zoom</dd>
          <dt><Key>tab</Key></dt>
          <dd className="self-center">estações</dd>
          <dt><Key>esc</Key></dt>
          <dd className="self-center">voltar</dd>
        </dl>
        <p className={`${PANEL} ml-auto px-3 py-2 font-geist-mono text-[11px] text-(--rede-ink)`}>
          <span ref={statusRef}>x 0 · y 0 · zoom 1.00</span>
        </p>
      </footer>
    </>
  );
}
