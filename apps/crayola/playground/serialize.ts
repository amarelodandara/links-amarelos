import type { LogoPreset, SunStyle } from "@links/brand/logo";

/** Two decimals is finer than any slider step; keeps presets.ts readable. */
const num = (n: number): string => String(Math.round(n * 100) / 100);

const style = (s: SunStyle): string =>
  s.kind === "flat"
    ? `{ kind: "flat" }`
    : s.kind === "crayon"
      ? `{ kind: "crayon", wobble: ${num(s.wobble)}, waves: ${num(s.waves)}, seed: ${num(s.seed)}, grain: ${num(s.grain)}, grainX: ${num(s.grainX)}, grainY: ${num(s.grainY)}, roughness: ${num(s.roughness)}, cursor: ${s.cursor} }`
      : `{ kind: "globe", meridians: ${num(s.meridians)}, parallels: ${num(s.parallels)}, inclination: ${num(s.inclination)}, tilt: ${num(s.tilt)}, matchOrbit: ${s.matchOrbit}, turn: ${num(s.turn)}, spin: ${num(s.spin)}, line: ${num(s.line)}, outline: ${s.outline}, cap: ${JSON.stringify(s.cap)}, color: ${JSON.stringify(s.color)}, opacity: ${num(s.opacity)} }`;

/** presets.ts source for these presets, in the same shape the file is written by hand. */
export function serializePresets(presets: readonly LogoPreset[]): string {
  const entries = presets.map(({ id, label, cursors, config: c }) =>
    [
      "  {",
      `    id: ${JSON.stringify(id)},`,
      `    label: ${JSON.stringify(label)},`,
      `    cursors: [${cursors.map((id) => JSON.stringify(id)).join(", ")}],`,
      "    config: {",
      `      style: ${style(c.style)},`,
      `      sun: { cx: ${num(c.sun.cx)}, cy: ${num(c.sun.cy)} },`,
      `      orbit: { radius: ${num(c.orbit.radius)}, inclination: ${num(c.orbit.inclination)}, tilt: ${num(c.orbit.tilt)}, angle: ${num(c.orbit.angle)} },`,
      `      cursor: ${JSON.stringify(c.cursor)},`,
      `      backdrop: ${c.backdrop},`,
      `      ring: { on: ${c.ring.on}, line: ${num(c.ring.line)}, dashed: ${c.ring.dashed}, dash: ${num(c.ring.dash)}, gap: ${num(c.ring.gap)}, cap: ${JSON.stringify(c.ring.cap)}, color: ${JSON.stringify(c.ring.color)}, opacity: ${num(c.ring.opacity)} },`,
      "    },",
      "  },",
    ].join("\n"),
  );
  return `// Named logo configs. The crayola playground rewrites this file when you press
// "Save preset to code", so keep it plain data.
import type { LogoPreset } from "./types.ts";

export const PRESETS: LogoPreset[] = [
${entries.join("\n")}
];
`;
}
