"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoOdometer from "./LogoOdometer";
import ExternalLinkPill from "./ExternalLinkPill";

// Routes that drop the "Páginas" column, so the page doesn't offer a way out to
// every other route. Columns are spread with justify-between rather than a
// fixed grid, so removing one redistributes the rest instead of leaving a hole.
const NO_PAGE_LINKS = ["/manifesto"];

const PAGES = [
  { href: "/sobre", label: "Sobre" },
  { href: "/manifesto", label: "Manifesto" },
  { href: "/realizacoes", label: "Realizações" },
  { href: "/apoio", label: "Apoio" },
];

const LINK_CLASS =
  "w-fit rounded-sm font-manrope text-sm lowercase [touch-action:manipulation] transition-colors hover:text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun-dark focus-visible:ring-offset-2";

// --sun-dark (#f59e0b) on the footer's #fff1b9 texture measured 1.9:1. These
// 12px labels need 4.5:1, which brand-black/60 clears at 4.9:1 while still
// reading as a muted label rather than body copy.
const LABEL_CLASS =
  "font-space-mono text-xs text-brand-black/60 uppercase tracking-widest";

export default function SiteFooter() {
  const pathname = usePathname();
  const showPages = !NO_PAGE_LINKS.includes(pathname);

  return (
    <footer className="border-t border-sun bg-[url('/bg-texture.svg')] bg-repeat">
      <div className="max-w-4xl mx-auto px-6 py-12 flex flex-col gap-10 md:flex-row md:justify-between">
        {/* Brand */}
        <div className="space-y-3">
          {/* Decoration here, not a link — hidden from assistive tech so it
              doesn't read as a second, nameless "links amarelos". */}
          <div className="text-sun w-fit" aria-hidden="true">
            <LogoOdometer />
          </div>
          <p className="font-manrope text-sm leading-relaxed">
            Curadoria de links que valem o seu tempo, hoje e sempre.
          </p>
        </div>

        {/* Pages */}
        {showPages && (
          <div className="space-y-3">
            <p id="footer-pages-label" className={LABEL_CLASS}>
              Páginas
            </p>
            <nav
              aria-labelledby="footer-pages-label"
              className="flex flex-col gap-2"
            >
              {PAGES.map(({ href, label }) => (
                <Link key={href} href={href} className={LINK_CLASS}>
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        )}

        {/* Socials */}
        <div className="space-y-3">
          <p className={LABEL_CLASS}>Leia e ouça</p>
          <div className="flex flex-col gap-2 items-start">
            <ExternalLinkPill
              platform="substack"
              href="https://amarelodandara.substack.com"
            />
            <ExternalLinkPill
              platform="spotify"
              href="https://open.spotify.com/show/043Gs7eyY2KOlotEWSTSxB?si=e7abf2b9730747d7"
            />
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-(--sun)/30 px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] max-w-4xl mx-auto flex justify-between items-center gap-4">
        {/* /50 measured 3.6:1 on the footer texture; /70 clears 4.5:1. */}
        <p
          className="font-space-mono text-xs text-brand-black/70 lowercase"
          suppressHydrationWarning
        >
          © {new Date().getFullYear()} amarelo dandara
        </p>
        <p className="font-space-mono text-xs text-brand-black/70 lowercase">
          feito por completo
        </p>
      </div>
    </footer>
  );
}
