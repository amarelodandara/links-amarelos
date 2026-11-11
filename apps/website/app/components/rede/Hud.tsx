"use client";

import type { MouseEvent, ReactNode } from "react";
import Link from "next/link";
import LogoOdometer from "../LogoOdometer";
import { PAGES } from "../../lib/pages";
import type { HudLook } from "./hubDials";

type HudProps = {
  /** Colors from the "navbar & footer" dials. */
  look: HudLook;
  /** Where the window in focus leads. */
  status: string;
  atHub: boolean;
  /** Brings the hub back to the center. */
  onHome: () => void;
  onToggleTheme: () => void;
};

/** A keycap, Fez / Watch Dogs style. */
function Key({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-grid min-w-6 place-items-center rounded-sm border border-current px-1 py-0.5 font-geist-mono text-[10px] leading-none">
      {children}
    </kbd>
  );
}

/** One line of cells, split by vertical rules, edge to edge. Colors come from the dials. */
const BAR = "fixed inset-x-0 z-20 flex h-11 items-stretch divide-x font-geist-mono text-xs whitespace-nowrap";
const CELL = "flex items-center gap-2 px-4";
const FOCUS = "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-current";

/**
 * Fixed chrome above and below every window: it never moves with the scene.
 * The navbar holds the logo, the pages, theme and support; the footer holds
 * the controls and where the window in focus leads.
 */
export default function Hud({ look, status, atHub, onHome, onToggleTheme }: HudProps) {
  const LINK = `${CELL} ${look.hover} ${FOCUS}`;
  function onLogo(e: MouseEvent<HTMLAnchorElement>) {
    // Already home: the logo brings the hub window back to the center instead.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    if (!atHub) onHome();
  }

  return (
    <>
      <header className={`${BAR} ${look.bar} top-0 border-b`}>
        <Link href="/" onClick={onLogo} aria-label="links amarelos — página inicial" className={`${LINK} flex-1 md:flex-none`}>
          <LogoOdometer interactive />
        </Link>
        <nav aria-label="Páginas" className={`hidden flex-1 items-stretch divide-x ${look.rules} md:flex`}>
          {PAGES.map((page) => (
            <Link key={page.href} href={page.href} className={LINK}>
              {page.label}
            </Link>
          ))}
          <span aria-hidden="true" className="flex-1" />
        </nav>
        {/* Without the page links (phones), the logo cell stretches to fill the line. */}
        <button type="button" onClick={onToggleTheme} className={`${LINK} cursor-pointer`}>
          <span className="rede-light-only">
            <span className="sr-only">tema escuro</span>
            <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
              <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" fill="currentColor" />
            </svg>
          </span>
          <span className="rede-dark-only">
            <span className="sr-only">tema claro</span>
            <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
              <circle cx="12" cy="12" r="5" fill="currentColor" />
              <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
              </g>
            </svg>
          </span>
        </button>
        <Link
          href="/apoio"
          className={`${CELL} ${look.support} font-semibold uppercase tracking-widest hover:brightness-110 ${FOCUS}`}
        >
          Apoie
        </Link>
      </header>

      <footer className={`${BAR} ${look.bar} bottom-0 border-t`}>
        <dl aria-label="controles" className={`hidden items-stretch divide-x ${look.rules} [@media(pointer:fine)]:flex`}>
          <div className={CELL}>
            <dt><Key>clicar</Key></dt>
            <dd>abrir janela</dd>
          </div>
          <div className={CELL}>
            <dt><Key>tab</Key></dt>
            <dd>janelas</dd>
          </div>
          <div className={CELL}>
            <dt><Key>esc</Key></dt>
            <dd>início</dd>
          </div>
        </dl>
        <p className={`${CELL} min-w-0 flex-1 justify-end`}>
          <span aria-live="polite" className="truncate">
            {status}
          </span>
        </p>
        <p className={`${CELL} shrink-0`}>© {new Date().getFullYear()} amarelo dandara</p>
      </footer>
    </>
  );
}
