// Named logo configs. The crayola playground rewrites this file when you press
// "Save preset to code", so keep it plain data.
import type { LogoPreset } from "./types.ts";

export const PRESETS: LogoPreset[] = [
  {
    id: "master-logo",
    label: "master",
    cursors: ["arrow", "vector-arrow", "text"],
    config: {
      style: { kind: "flat" },
      sun: { cx: 500, cy: 500 },
      orbit: { radius: 481, inclination: 77.5, tilt: 8, angle: 58.2 },
      cursor: "arrow",
      backdrop: true,
      ring: { on: false, line: 14, dashed: true, dash: 21, gap: 35, cap: "butt", color: "brandBlack", opacity: 1 },
    },
  },
  {
    id: "crayola",
    label: "crayola",
    cursors: ["arrow", "vector-arrow", "text"],
    config: {
      style: { kind: "crayon", wobble: 6, waves: 3, seed: 33, grain: 0.26, grainX: 1.05, grainY: 0.29, roughness: 16.5, cursor: false },
      sun: { cx: 500, cy: 500 },
      orbit: { radius: 481, inclination: 77.5, tilt: 8, angle: 58.2 },
      cursor: "arrow",
      backdrop: true,
      ring: { on: false, line: 14, dashed: true, dash: 21, gap: 35, cap: "butt", color: "brandBlack", opacity: 1 },
    },
  },
  {
    id: "hyperlinks",
    label: "hyperlinks",
    cursors: ["arrow", "vector-arrow", "text", "hand", "busy"],
    config: {
      style: { kind: "globe", meridians: 6, parallels: 6, inclination: 75, tilt: 0, matchOrbit: true, turn: 104.5, spin: 20, line: 8, outline: true, cap: "round", color: "brandBlack", opacity: 1 },
      sun: { cx: 500, cy: 500 },
      orbit: { radius: 470, inclination: 76, tilt: -18, angle: 62.1 },
      cursor: "arrow",
      backdrop: true,
      ring: { on: true, line: 7, dashed: true, dash: 19.5, gap: 22.5, cap: "square", color: "brandBlack", opacity: 0.8 },
    },
  },
];
