import Link from "next/link";
import SubstackIcon from "./icons/SubstackIcon";
import SpotifyIcon from "./icons/SpotifyIcon";

// Brand colors are fixed identity, not swappable — each platform bakes in
// its own icon, label, and color so one brand's color can never end up
// paired with another brand's icon.
const PLATFORMS = {
  substack: {
    Icon: SubstackIcon,
    iconSize: "size-3",
    label: "Leia",
    name: "Substack",
    // orange-600 measured 3.1:1 on both surfaces this pill is used on
    // (nav #fef3c7, footer #fff1b9) — under the 4.5:1 floor for its 16px
    // label. orange-800 clears it at 6.5:1, and hover goes darker still so
    // the interactive state keeps gaining contrast.
    classes:
      "border-orange-400/50 text-orange-800 hover:border-orange-500 hover:bg-orange-500/10 hover:text-orange-900 active:bg-orange-500/20 focus-visible:ring-orange-600",
  },
  spotify: {
    Icon: SpotifyIcon,
    iconSize: "size-4",
    label: "Ouça",
    name: "Spotify",
    classes:
      "border-green-400/50 text-green-800 hover:border-green-500 hover:bg-green-500/10 hover:text-green-900 active:bg-green-500/20 focus-visible:ring-green-600",
  },
};

// `className` carries the background tint (it varies by surface — nav vs.
// page section — see the contrast playground) and any visibility overrides.
//
// Checked against every surface in the contrast playground (/playground):
// OK on: white, sun-lighter, sun-light, the footer texture, the page's default
// pale-yellow body background — the 800-weight brand colors clear 4.5:1 on all
// of them. NOT OK on: black, code, --sun (brand yellow). Don't place this pill
// on those surfaces; pick a different surface for the section instead of
// forcing a color fix.
type ExternalLinkPillProps = {
  platform: keyof typeof PLATFORMS;
  href: string;
  className?: string;
};

export default function ExternalLinkPill({
  platform,
  href,
  className = "",
}: ExternalLinkPillProps) {
  const { Icon, iconSize, label, name, classes } = PLATFORMS[platform];

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      // "Leia" on its own says nothing about where it goes. The visible label
      // stays the first words of the accessible name, so voice control still
      // matches on what is written.
      aria-label={`${label} no ${name} (abre em uma nova aba)`}
      className={`lowercase flex items-center gap-2 rounded-full px-3 py-1 border touch-manipulation [-webkit-tap-highlight-color:transparent] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${classes} ${className}`}
    >
      <div className={`${iconSize} flex shrink-0`} aria-hidden="true">
        <Icon className="size-full" />
      </div>
      <span className="font-space-mono">{label}</span>
    </Link>
  );
}
