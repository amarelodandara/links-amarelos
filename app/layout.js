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
import { Analytics } from "@vercel/analytics/next";
import AgentationWidget from "./agentation-widget";
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

export default function RootLayout({ children }) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${GeistSans.variable} ${GeistMono.variable} ${GeistPixelSquare.variable} ${GeistPixelGrid.variable} ${GeistPixelCircle.variable} ${GeistPixelTriangle.variable} ${GeistPixelLine.variable} ${manrope.variable} ${unbounded.variable} ${spaceMono.variable} ${redacted.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <nav className="relative border-b border-(--sun) bg-sun-lighter py-3 px-6 flex justify-between items-center">
          <Link href="/" className="text-sun">
            <LogoOdometer />
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
              <div className="hidden md:block w-px h-5 bg-(--sun) mx-1" />
              <NavDrawer />
            </HideOnRoutes>
          </div>
        </nav>
        <div className="flex-1 bg-[url('/bg-texture.svg')] bg-repeat">
          {children}
        </div>

        <SiteFooter />

        <AgentationWidget />
        <Analytics />
      </body>
    </html>
  );
}
