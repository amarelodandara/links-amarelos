/**
 * OKLCH math for the palette. Scales are authored in OKLCH (perceptually even
 * lightness, hue that holds while chroma changes) and shipped twice: as an
 * `oklch()` value clamped to the Display P3 gamut, and as an sRGB hex for
 * screens, video and canvas code that cannot show P3.
 *
 * Matrices from Björn Ottosson's OKLab and the CSS Color 4 spec.
 */

export type Oklch = { l: number; c: number; h: number };

/** Where a color can be shown exactly. */
export type Gamut = "srgb" | "p3" | "out";

type Rgb = readonly [number, number, number];

function oklchToLinearSrgb({ l, c, h }: Oklch): Rgb {
  const rad = (h * Math.PI) / 180;
  const a = c * Math.cos(rad);
  const b = c * Math.sin(rad);
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ];
}

function linearSrgbToLinearP3([r, g, b]: Rgb): Rgb {
  return [
    0.8224621209 * r + 0.177537879 * g,
    0.0331941989 * r + 0.9668058011 * g,
    0.0170826307 * r + 0.0723974407 * g + 0.9105199286 * b,
  ];
}

const EPS = 1e-6;
const inUnit = (rgb: Rgb): boolean => rgb.every((v) => v >= -EPS && v <= 1 + EPS);

export function gamutOf(color: Oklch): Gamut {
  const srgb = oklchToLinearSrgb(color);
  if (inUnit(srgb)) return "srgb";
  return inUnit(linearSrgbToLinearP3(srgb)) ? "p3" : "out";
}

/**
 * The same lightness and hue with chroma lowered until it fits `gamut`.
 * Lowering chroma (not clipping channels) keeps hue and lightness exact.
 */
export function clampChroma(color: Oklch, gamut: "srgb" | "p3"): Oklch {
  const fits = (c: Oklch): boolean => {
    const g = gamutOf(c);
    return g === "srgb" || (gamut === "p3" && g === "p3");
  };
  if (fits(color)) return color;
  let lo = 0;
  let hi = color.c;
  for (let i = 0; i < 30; i += 1) {
    const mid = (lo + hi) / 2;
    if (fits({ ...color, c: mid })) lo = mid;
    else hi = mid;
  }
  return { ...color, c: lo };
}

/** The highest chroma that `gamut` can show at this lightness and hue. */
export function maxChroma(l: number, h: number, gamut: "srgb" | "p3"): number {
  return clampChroma({ l, c: 0.5, h }, gamut).c;
}

const encode = (v: number): number =>
  v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;

const decode = (v: number): number => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);

/** sRGB hex, after lowering chroma into sRGB. */
export function toHex(color: Oklch): string {
  const rgb = oklchToLinearSrgb(clampChroma(color, "srgb"));
  return `#${rgb
    .map((v) => Math.round(Math.min(1, Math.max(0, encode(v))) * 255).toString(16).padStart(2, "0"))
    .join("")}`;
}

/** `#rrggbb` → OKLCH. Hue is 0 for greys. */
export function fromHex(hex: string): Oklch {
  const n = Number.parseInt(hex.slice(1), 16);
  const r = decode(((n >> 16) & 255) / 255);
  const g = decode(((n >> 8) & 255) / 255);
  const b = decode((n & 255) / 255);
  const l_ = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m_ = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s_ = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const A = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const B = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;
  const c = Math.hypot(A, B);
  const h = c < 1e-4 ? 0 : ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360;
  return { l: L, c, h };
}

const fixed = (n: number, places: number): string => String(Number(n.toFixed(places)));

/** CSS `oklch()`, after lowering chroma into Display P3. */
export function toCss(color: Oklch): string {
  const { l, c, h } = clampChroma(color, "p3");
  return `oklch(${fixed(l * 100, 2)}% ${fixed(c, 4)} ${fixed(h, 2)})`;
}

/** WCAG 2 relative luminance of the sRGB fallback, for contrast ratios. */
export function luminance(color: Oklch): number {
  const [r, g, b] = oklchToLinearSrgb(clampChroma(color, "srgb")).map((v) =>
    Math.min(1, Math.max(0, v)),
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: Oklch, b: Oklch): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
