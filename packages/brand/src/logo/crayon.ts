import { SUN_RADIUS } from "./types.ts";
import type { CrayonSun } from "./types.ts";

// The crayola sun: the master logo as if drawn with a crayon. Two layers of
// hand: the outline wanders around the 400 radius (wobble), and an SVG filter
// lets paper show through the wax (grain) and roughs up every edge
// (roughness). Everything is seeded, so a config always draws the same.

/** Small deterministic PRNG (mulberry32): same seed, same "hand". */
function random(seed: number): () => number {
  let a = Math.floor(seed * 9973) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Points traced around the edge. */
const STEPS = 240;

/**
 * The sun's outline drawn by hand: the radius drifts by up to `wobble` grid
 * units, as a mix of a few slow waves (about `waves` bumps per turn) with
 * seeded phases, so it never looks like a regular gear.
 */
export function crayonOutline(crayon: CrayonSun, cx: number, cy: number): string {
  const next = random(crayon.seed);
  const harmonics = [1, 1.7, 2.9].map((mult) => ({
    freq: Math.max(1, Math.round(crayon.waves * mult)),
    phase: next() * Math.PI * 2,
    weight: 0.5 + next() * 0.5,
  }));
  const total = harmonics.reduce((sum, h) => sum + h.weight, 0);
  const points: string[] = [];
  for (let i = 0; i < STEPS; i++) {
    const t = (i / STEPS) * Math.PI * 2;
    const drift = harmonics.reduce((sum, h) => sum + h.weight * Math.sin(h.freq * t + h.phase), 0) / total;
    const r = SUN_RADIUS + crayon.wobble * drift;
    points.push(`${i === 0 ? "M" : "L"}${(cx + r * Math.cos(t)).toFixed(1)} ${(cy + r * Math.sin(t)).toFixed(1)}`);
  }
  return `${points.join("")}Z`;
}

/**
 * Alpha row of the filter's color matrix: wax where the noise is low, paper
 * where it is high. A steep slope gives the hard-edged speckle of crayon on
 * paper; `grain` moves the threshold (0 solid, 1 mostly paper).
 */
export function grainMatrix(crayon: CrayonSun): string {
  const threshold = 0.8 - 0.45 * crayon.grain;
  const slope = 24;
  return `0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -${slope} 0 0 0 ${(slope * threshold).toFixed(3)}`;
}
