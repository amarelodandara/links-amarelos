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

export default function SiteFooter() {
  const pathname = usePathname();
  const showPages = !NO_PAGE_LINKS.includes(pathname);

  return (
    <footer className="border-t border-sun bg-[url('/bg-texture.svg')] bg-repeat">
      <div className="max-w-4xl mx-auto px-6 py-12 flex flex-col gap-10 md:flex-row md:justify-between">
        {/* Brand */}
        <div className="space-y-3">
          <div className="text-sun w-fit">
            <LogoOdometer />
          </div>
          <p className="font-manrope text-sm leading-relaxed">
            Curadoria de links que valem o seu tempo, hoje e sempre.
          </p>
        </div>

        {/* Pages */}
        {showPages && (
          <div className="space-y-3">
            <p className="font-space-mono text-xs text-(--sun-dark) uppercase tracking-widest">
              Páginas
            </p>
            <nav className="flex flex-col gap-2">
              {PAGES.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="font-manrope text-sm hover:text-(--sun-dark) transition-colors lowercase"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        )}

        {/* Socials */}
        <div className="space-y-3">
          <p className="font-space-mono text-xs text-(--sun-dark) uppercase tracking-widest">
            Leia e ouça
          </p>
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
      <div className="border-t border-(--sun)/30 px-6 py-4 max-w-4xl mx-auto flex justify-between items-center">
        <p className="font-space-mono text-xs text-brand-black/50 lowercase">
          © {new Date().getFullYear()} amarelo dandara
        </p>
        <p className="font-space-mono text-xs text-brand-black/50 lowercase">
          feito por completo
        </p>
      </div>
    </footer>
  );
}
