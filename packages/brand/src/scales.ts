// Color scales in OKLCH. The crayola palette playground rewrites this file when you press
// "Save to code", so keep it plain data. Then `npm run tokens -w @links/brand` runs for you.
//
// l: lightness 0–1 · c: chroma · h: hue in degrees · name: semantic name, "" if unset.
// Values past Display P3 are lowered into it on output; the sRGB hex fallback is
// lowered further.
// Scales need not share steps. Anchors: sun 500 is the brand sun (#ffcc00), code 900
// is the old codeDark, ink 100 is brandWhite and ink 900 is brandBlack.
import type { Scales } from "./scale-types.ts";

export const SCALES: Scales = {
  sun: [
    { step: 100, l: 0.962, c: 0.062, h: 95.5, name: "sunray" },
    { step: 300, l: 0.915, c: 0.14, h: 94, name: "sunshine" },
    { step: 500, l: 0.8652, c: 0.1768, h: 90.38, name: "sun" },
  ],
  code: [
    { step: 700, l: 0.52, c: 0.215, h: 262, name: "source" },
    { step: 900, l: 0.4244, c: 0.1809, h: 265.64, name: "terminal" },
  ],
  ink: [
    { step: 100, l: 0.9869, c: 0.0213, h: 95.28, name: "paint" },
    { step: 700, l: 0.557, c: 0.019, h: 84.4, name: "pencil" },
    { step: 900, l: 0.1516, c: 0.0216, h: 73.32, name: "pen" },
  ],
};
