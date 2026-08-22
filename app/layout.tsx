import type { ReactNode } from "react";
import {
  Inter,
  Manrope,
  Unbounded,
  Space_Mono,
  Redacted,
} from "next/font/google";
import "./globals.css";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import {
  GeistPixelSquare,
  GeistPixelGrid,
  GeistPixelCircle,
  GeistPixelTriangle,
  GeistPixelLine,
} from "geist/font/pixel";
import { Separator } from "@base-ui/react/separator";
import { Tooltip } from "@base-ui/react/tooltip";
import { Toast } from "@base-ui/react/toast";
import { Analytics } from "@vercel/analytics/next";
import AgentationWidget from "./agentation-widget";
import Toaster from "./components/Toaster";
import LogoOdometer from "./components/LogoOdometer";
import NavDrawer from "./components/NavDrawer";
import HideOnRoutes from "./components/HideOnRoutes";
import SiteFooter from "./components/SiteFooter";
import ExternalLinkPill from "./components/ExternalLinkPill";
import Button from "./components/Button";
import Link from "next/link";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const redacted = Redacted({
  variable: "--font-redacted",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata = {
  metadataBase: new URL("https://linksamarelos.com"),
  title: {
    default: "links amarelos",
    template: "%s • links amarelos",
  },
  description: "Curadoria mensal de links que valem seu tempo.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "links amarelos",
    description: "Curadoria mensal de links que valem seu tempo.",
    url: "https://linksamarelos.com",
    siteName: "links amarelos",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "links amarelos",
    description: "Curadoria mensal de links que valem seu tempo.",
  },
};

// Matches the nav's bg-sun-lighter, which is what sits under the browser
// chrome at the top of every page.
export const viewport = {
  themeColor: "#fef3c7",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${GeistSans.variable} ${GeistMono.variable} ${GeistPixelSquare.variable} ${GeistPixelGrid.variable} ${GeistPixelCircle.variable} ${GeistPixelTriangle.variable} ${GeistPixelLine.variable} ${manrope.variable} ${unbounded.variable} ${spaceMono.variable} ${redacted.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Shared delay group: moving between two icon buttons opens the second
            tooltip instantly instead of waiting out the hover delay again. */}
        <Toast.Provider>
          <Tooltip.Provider delay={400} closeDelay={100}>
            <a href="#conteudo" className="skip-link font-geist-mono lowercase">
              Pular para o conteúdo
            </a>

            <nav
              aria-label="Navegação principal"
              className="relative border-b border-(--sun) bg-sun-lighter py-3 px-6 flex justify-between items-center [padding-left:max(1.5rem,env(safe-area-inset-left))] [padding-right:max(1.5rem,env(safe-area-inset-right))]"
            >
              {/* The logotype is a decorative <svg> with no text, so the accessible
              name has to live on the link itself. */}
              <Link
                href="/"
                aria-label="links amarelos — página inicial"
                className="text-sun rounded-sm [touch-action:manipulation] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun-dark focus-visible:ring-offset-2"
              >
                <LogoOdometer interactive />
              </Link>

              <div className="flex gap-2 text-sm items-center">
                <ExternalLinkPill
                  platform="substack"
                  href="https://amarelodandara.substack.com"
                  className="hidden md:flex bg-stone-400/10"
                />
                <ExternalLinkPill
                  platform="spotify"
                  href="https://open.spotify.com/show/043Gs7eyY2KOlotEWSTSxB?si=e7abf2b9730747d7"
                  className="hidden md:flex bg-stone-400/10"
                />
                <Button variant="nav" href="/apoio">
                  Apoie
                </Button>

                <HideOnRoutes routes={["/manifesto"]}>
                  <Separator
                    orientation="vertical"
                    className="hidden md:block w-px h-5 bg-(--sun) mx-1"
                  />
                  <NavDrawer />
                </HideOnRoutes>
              </div>
            </nav>
            {/* Skip-link target. tabIndex=-1 so focus actually lands here rather
            than staying on the link and reading from the top again. */}
            <div
              id="conteudo"
              tabIndex={-1}
              className="flex-1 bg-[url('/bg-texture.svg')] bg-repeat focus:outline-none"
            >
              {children}
            </div>

            <SiteFooter />

            <AgentationWidget />
            <Toaster />
          </Tooltip.Provider>
        </Toast.Provider>
        <Analytics />
      </body>
    </html>
  );
}
