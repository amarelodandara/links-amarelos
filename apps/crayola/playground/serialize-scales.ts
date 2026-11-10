import { SCALE_NAMES } from "@links/brand";
import type { Scales } from "@links/brand";

/** Four decimals: finer than any dial step, and keeps hex roundtrips exact. */
const num = (n: number): string => String(Math.round(n * 10000) / 10000);

/** First line of scales.ts; the dev server refuses any body that lacks it. */
export const SCALES_HEADER =
  '// Color scales in OKLCH. The crayola palette playground rewrites this file when you press';

/** scales.ts source for these scales, in the same shape the file is written by hand. */
export function serializeScales(scales: Scales): string {
  const blocks = SCALE_NAMES.map((name) =>
    [
      `  ${name}: [`,
      ...scales[name].map(
        (s) => `    { step: ${s.step}, l: ${num(s.l)}, c: ${num(s.c)}, h: ${num(s.h)}, name: ${JSON.stringify(s.name)} },`,
      ),
      "  ],",
    ].join("\n"),
  );
  return `${SCALES_HEADER}
// "Save to code", so keep it plain data. Then \`npm run tokens -w @links/brand\` runs for you.
//
// l: lightness 0–1 · c: chroma · h: hue in degrees · name: semantic name, "" if unset.
// Values past Display P3 are lowered into it on output; the sRGB hex fallback is
// lowered further.
// Scales need not share steps. Anchors: sun 500 is the brand sun (#ffcc00), code 900
// is the old codeDark, ink 100 is brandWhite and ink 900 is brandBlack.
import type { Scales } from "./scale-types.ts";

export const SCALES: Scales = {
${blocks.join("\n")}
};
`;
}
