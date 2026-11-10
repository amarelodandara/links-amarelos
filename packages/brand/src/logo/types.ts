import type { ColorName } from "../colors.ts";

// The parameters of the Links Amarelos mark: the sun, and a cursor clicking it
// from somewhere on an orbit around it. Every alternate (sub-brands, cursors,
// orbit positions) is one of these configs; presets.ts names the chosen ones.
//
// Units are the fixed 1000×1000 logo grid (LOGO_GRID in Logo.tsx).

/**
 * Set in stone: the sun's radius never changes, so every alternate shares one
 * scale. Its color is always the `sun` token (see Logo.tsx).
 */
export const SUN_RADIUS = 400;

/** Set in stone: one cursor pixel is 13.5 grid units, and the cursor never rotates. */
export const CURSOR_PIXEL = 13.5;

/** How a stroke ends: SVG stroke-linecap. */
export const LINE_CAPS = ["butt", "round", "square"] as const;
export type LineCap = (typeof LINE_CAPS)[number];

export const LOGO_STYLES = ["flat", "globe", "crayon"] as const;
export type LogoStyle = (typeof LOGO_STYLES)[number];

/**
 * Latitude and longitude lines over the sun, like the old internet icons: the
 * three-dimensional hyperlinks. The sun keeps its color; the lines take any
 * brand token, at any opacity.
 */
export type GlobeLines = {
  /** Great circles through the poles. */
  meridians: number;
  /** Circles of latitude between the poles (an odd count includes the equator). */
  parallels: number;
  /**
   * Same meaning as the orbit's: 0° looks straight down at the pole, 90° sees
   * the equator edge-on. Ignored while `matchOrbit` is on.
   */
  inclination: number;
  /** Same as the orbit's: rotates the globe on the page. Ignored while `matchOrbit` is on. */
  tilt: number;
  /** Take inclination and tilt from the orbit: the ring then lies on the equator. */
  matchOrbit: boolean;
  /** Degrees the globe is turned around its pole: slides the meridians. */
  turn: number;
  /**
   * The animated version: degrees per second the globe turns (negative turns
   * the other way). 0 is still. The ring and the cursor never move.
   */
  spin: number;
  /** Line width, in grid units. */
  line: number;
  /** Also draw the sun's edge. */
  outline: boolean;
  cap: LineCap;
  color: ColorName;
  /** 0 to 1. */
  opacity: number;
};

export const DEFAULT_GLOBE: GlobeLines = {
  meridians: 4,
  parallels: 3,
  inclination: 75,
  tilt: 0,
  matchOrbit: true,
  turn: 20,
  spin: 20,
  line: 14,
  outline: true,
  cap: "round",
  color: "brandBlack",
  opacity: 1,
};

/** The master logo as if drawn with a crayon: crayola. */
export type CrayonSun = {
  /** How far the hand-drawn edge strays from the 400 radius, in grid units. */
  wobble: number;
  /** Roughly how many bumps run around the edge. */
  waves: number;
  /** Picks the hand: same seed, same drawing. */
  seed: number;
  /** How much paper shows through the wax: 0 solid, 1 mostly paper. */
  grain: number;
  /** Grain frequency across; higher is finer. */
  grainX: number;
  /** Grain frequency down; differing from across stretches it into streaks. */
  grainY: number;
  /** How ragged every drawn edge gets, in grid units. */
  roughness: number;
  /** Draw the cursor in crayon too. */
  cursor: boolean;
};

export const DEFAULT_CRAYON: CrayonSun = {
  wobble: 10,
  waves: 5,
  seed: 3,
  grain: 0.35,
  grainX: 0.9,
  grainY: 0.06,
  roughness: 6,
  cursor: true,
};

/** flat: links amarelos. globe: hyperlinks. crayon: crayola. */
export type SunStyle =
  | { kind: "flat" }
  | ({ kind: "globe" } & GlobeLines)
  | ({ kind: "crayon" } & CrayonSun);

export const CURSOR_IDS = ["arrow", "vector-arrow", "text", "hand", "not-allowed", "busy"] as const;
export type CursorId = (typeof CURSOR_IDS)[number];

export type LogoConfig = {
  style: SunStyle;
  /** Where the sun's center sits. Its radius and color are fixed. */
  sun: { cx: number; cy: number };
  /**
   * A ring around the sun, like Saturn's, and where on it the cursor's tip is.
   * - radius: from the sun's center; never less than the sun's (400), so the
   *   ring always goes around it.
   * - inclination: 0° looks straight down on the ring (a circle around the
   *   sun); towards 90° it flattens into a band seen edge-on.
   * - tilt: rotates the ring on the page.
   * - angle: the cursor's place on the ring, 0° at the right, clockwise. On
   *   the far half of an inclined ring the cursor passes behind the sun; on
   *   the near half it crosses in front of it.
   */
  orbit: { radius: number; inclination: number; tilt: number; angle: number };
  cursor: CursorId;
  /**
   * A square behind the whole grid, for surfaces that would swallow the sun
   * or the cursor. Set in stone: always the `brand-white` token.
   */
  backdrop: boolean;
  /** The orbit drawn as part of the logo: a ring around the sun, like Saturn's. */
  ring: RingLine;
};

/**
 * How the ring is drawn. Its far half passes behind the sun, its near half
 * in front; its shape is the orbit's (radius, inclination, tilt).
 */
export type RingLine = {
  on: boolean;
  /** Line width, in grid units. */
  line: number;
  /** Draw the ring dashed, with `dash` and `gap`; off draws it solid. */
  dashed: boolean;
  /** Length of each dash, in grid units. */
  dash: number;
  /** Space between dashes, in grid units. */
  gap: number;
  cap: LineCap;
  color: ColorName;
  /** 0 to 1. */
  opacity: number;
};

export const DEFAULT_RING: RingLine = {
  on: false,
  line: 14,
  dashed: true,
  dash: 21,
  gap: 35,
  cap: "butt",
  color: "brandBlack",
  opacity: 1,
};

export type LogoPreset = {
  /** Kebab-case, stable: becomes the exported file name. */
  id: string;
  label: string;
  /** The cursors this logo may use: the playground only offers these. */
  cursors: readonly CursorId[];
  config: LogoConfig;
};
