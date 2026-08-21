import Link from "next/link";
import { Button as BaseButton } from "@base-ui/react/button";
import PixelTrail from "./PixelTrail";

// Typeface split: the pixel face carries the big CTAs (primary / secondary),
// while small utility controls — the nav pill, inline ghost links, and the
// share/copy buttons in PageActions — stay on mono so they read cleanly at
// text size.
//
// geist ships FIVE pixel faces (square, grid, circle, triangle, line). Swap
// PIXEL_FONT to change every CTA at once; the utilities are already generated
// in globals.css.
const PIXEL_FONT = "font-geist-pixel-square";
const MONO_FONT = "font-geist-mono";

// Hierarchy decided from the /playground inventory review:
// - primary / primary-inverted: main CTAs, can opt into the brand pixel-trail
// - secondary: the brand-white-outline style — the white-outline variant was
//   dropped, every real usage sits on a sun-family surface where brand-white
//   reads far better
// - nav: the standalone brand-solid pill, only ever used in the nav today
// - ghost: low-emphasis inline link — underlined text, not a pill (a pill
//   here reads too much like the badges used atop sections)
//
// Checked against every surface in the contrast playground (/playground).
// NOT OK — don't place these combinations, pick a different surface instead
// of forcing a color fix:
//   primary            on code        (blue button vanishes on blue)
//   primary-inverted    on white           (white button vanishes on white)
//   secondary           on sun-light       (brand-white text on a sun-ish bg)
//   secondary           on the page's default pale-yellow background (same reason)
//   secondary           on white           (sun-lighter text too pale on white)
//   nav                 on --sun           (brand-yellow button vanishes on brand yellow)
const VARIANTS = {
  primary: {
    // hover uses brightness, not a 3rd blue — code/code-dark is the whole
    // ramp now, so a bg-code hover would be indistinguishable from default.
    className:
      "px-6 py-3 bg-code text-white rounded-full hover:brightness-90 active:bg-code-dark",
    font: PIXEL_FONT,
    trailColor: "255,255,255",
  },
  "primary-inverted": {
    // Its real usage (page.js) sits on code — a default/blue/white ring
    // vanishes there, so this variant gets its own sun focus ring. The
    // border-2 border-white is what keeps the button visible on :hover —
    // without it, hover:bg-code + hover:text-white makes the button fill
    // exactly match the surrounding bg-code panel and disappear.
    className:
      "px-6 py-3 bg-white text-code border-2 border-white rounded-full hover:bg-code hover:text-white active:bg-code-dark focus-visible:ring-(--sun)",
    font: PIXEL_FONT,
    trailColor: "59,130,246", // code — default white trail would vanish on this bg
  },
  secondary: {
    // Border and text share one color so they read as one cohesive outline
    // instead of two mismatched yellows.
    className:
      "px-6 py-3 border-2 border-brand-white text-brand-white rounded-full hover:bg-white/10 active:bg-white/20",
    font: PIXEL_FONT,
  },
  nav: {
    className:
      "px-4 py-2 bg-(--sun) text-brand-white font-bold rounded-full tracking-wide hover:brightness-95 active:brightness-90",
    font: MONO_FONT,
  },
  ghost: {
    className:
      "text-brand-black/70 underline underline-offset-2 decoration-brand-black/30 hover:decoration-brand-black active:text-brand-black",
    font: MONO_FONT,
  },
};

// Playground-only: forces a state's look without needing real interaction,
// so every state can be reviewed on a static page. `!`-prefixed to win over
// the variant's own hover:/active: utilities regardless of class order.
const STATE_PREVIEW = {
  primary: {
    hover: "!brightness-90",
    active: "!bg-code-dark",
    focus: "!ring-2 !ring-code !ring-offset-1",
  },
  "primary-inverted": {
    hover: "!bg-code !text-white",
    active: "!bg-code-dark !text-white",
    focus: "!ring-2 !ring-(--sun) !ring-offset-1",
  },
  secondary: {
    hover: "!bg-white/10",
    active: "!bg-white/20",
    focus: "!ring-2 !ring-brand-white !ring-offset-1",
  },
  nav: {
    hover: "!brightness-95",
    active: "!brightness-90",
    focus: "!ring-2 !ring-brand-white !ring-offset-1",
  },
  ghost: {
    hover: "!decoration-brand-black",
    active: "!text-brand-black",
    focus: "!ring-2 !ring-brand-black/30 !ring-offset-1",
  },
};

export default function Button({
  variant = "primary",
  href,
  trail = false,
  disabled = false,
  previewState, // "hover" | "active" | "focus" — playground only
  className = "",
  children,
  ...props
}) {
  const {
    className: variantClassName,
    font,
    trailColor,
  } = VARIANTS[variant];
  const isPill = variant !== "ghost";
  const previewClassName = previewState
    ? STATE_PREVIEW[variant]?.[previewState]
    : "";

  // Base UI drives the disabled semantics: data-disabled for styling, plus a
  // real disabled button rather than the aria-disabled span this used to
  // render. A live button still renders as a Next <Link> via `render`.
  const asLink = Boolean(href) && !disabled;

  const sharedClassName = `relative whitespace-nowrap ${font} lowercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${isPill ? "inline-flex items-center overflow-hidden" : "inline"} ${variantClassName} data-disabled:opacity-40 data-disabled:cursor-not-allowed ${previewClassName} ${className}`;

  return (
    <BaseButton
      {...props}
      disabled={disabled}
      nativeButton={!asLink}
      render={asLink ? <Link href={href} /> : undefined}
      className={sharedClassName}
    >
      {trail && <PixelTrail color={trailColor} paused={disabled} />}
      <span className="relative">{children}</span>
    </BaseButton>
  );
}
