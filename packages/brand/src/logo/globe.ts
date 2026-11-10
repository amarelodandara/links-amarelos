import { SUN_RADIUS } from "./types.ts";
import type { GlobeLines } from "./types.ts";

// The hyperlinks sun as a globe: latitude and longitude lines like the old
// internet icons. The lines live on a 3D sphere, projected straight onto the
// page (orthographic); only the half facing the viewer is drawn, so the sun
// reads as a solid ball.
//
// View coordinates: x right, y up, z towards the viewer, unit sphere.

const RAD = Math.PI / 180;
/** Points traced per parallel: smooth at any export size, still a small path. */
const STEPS = 144;

type Vec3 = [number, number, number];

/** A point on the unit sphere, turned around the pole and tipped towards the viewer. */
function toView([x0, y0, z0]: Vec3, globe: GlobeLines, turn: number): Vec3 {
  const t = turn * RAD;
  // Inclination 90° (equator edge-on) leaves the pole upright; less tips the
  // north pole towards the viewer, exactly as the orbit's ring flattens.
  const tip = (90 - globe.inclination) * RAD;
  const x = x0 * Math.cos(t) + z0 * Math.sin(t);
  const z1 = -x0 * Math.sin(t) + z0 * Math.cos(t);
  return [x, y0 * Math.cos(tip) - z1 * Math.sin(tip), y0 * Math.sin(tip) + z1 * Math.cos(tip)];
}

/** View x/y on the unit sphere → page coordinates, with the orbit's on-page tilt. */
function toPage(x: number, y: number, globe: GlobeLines, cx: number, cy: number): [number, number] {
  const spin = globe.tilt * RAD;
  const sx = x * SUN_RADIUS;
  const sy = -y * SUN_RADIUS;
  return [cx + sx * Math.cos(spin) - sy * Math.sin(spin), cy + sx * Math.sin(spin) + sy * Math.cos(spin)];
}

const fmt = (n: number): string => n.toFixed(1);

/**
 * Parallels: circles of latitude, evenly spaced between the poles. Traced as
 * polylines, split wherever they go round the back. Turning the globe does
 * not move them, so they are the same in every animation frame.
 */
export function parallelsPath(globe: GlobeLines, cx: number, cy: number): string {
  const parts: string[] = [];
  for (let k = 1; k <= globe.parallels; k++) {
    const lat = (-90 + (k * 180) / (globe.parallels + 1)) * RAD;
    let run: string[] = [];
    for (let i = 0; i <= STEPS; i++) {
      const t = (i / STEPS) * Math.PI * 2;
      const [x, y, z] = toView([Math.cos(lat) * Math.cos(t), Math.sin(lat), Math.cos(lat) * Math.sin(t)], globe, 0);
      if (z >= 0) {
        const [px, py] = toPage(x, y, globe, cx, cy);
        run.push(`${run.length === 0 ? "M" : "L"}${fmt(px)} ${fmt(py)}`);
      } else if (run.length > 0) {
        parts.push(run.join(""));
        run = [];
      }
    }
    if (run.length > 0) parts.push(run.join(""));
  }
  return parts.join("");
}

/**
 * Meridians at a given turn: great circles through both poles, spread over
 * half a turn (each also draws its opposite side). A great circle's visible
 * half projects to exactly half an ellipse, so each one is a single SVG arc:
 * a few bytes per frame, which keeps the animated file small.
 */
export function meridiansPath(globe: GlobeLines, cx: number, cy: number, turn: number): string {
  const parts: string[] = [];
  const [ox, oy] = toPage(0, 0, globe, cx, cy);
  for (let k = 0; k < globe.meridians; k++) {
    const lon = (k * 180 * RAD) / globe.meridians;
    // Normal of the meridian's plane, in view coordinates.
    const [nx, ny, nz] = toView([Math.cos(lon), 0, -Math.sin(lon)], globe, turn);
    const across = Math.hypot(nx, ny);
    if (across < 1e-6) {
      // Seen exactly face-on, the meridian is the sun's edge.
      parts.push(`M${fmt(ox - SUN_RADIUS)} ${fmt(oy)}a${SUN_RADIUS} ${SUN_RADIUS} 0 1 0 ${SUN_RADIUS * 2} 0a${SUN_RADIUS} ${SUN_RADIUS} 0 1 0 ${-SUN_RADIUS * 2} 0`);
      continue;
    }
    // Ends of the visible half: where the circle crosses the silhouette.
    const ux = ny / across;
    const uy = -nx / across;
    const [ax, ay] = toPage(ux, uy, globe, cx, cy);
    const [bx, by] = toPage(-ux, -uy, globe, cx, cy);
    // The visible half bulges towards the circle's nearest point to the viewer.
    const [px, py] = toPage((-nz * nx) / across, (-nz * ny) / across, globe, cx, cy);
    const sweep = (ax - ox) * (py - oy) - (ay - oy) * (px - ox) > 0 ? 1 : 0;
    const angle = Math.atan2(ay - oy, ax - ox) / RAD;
    const ry = SUN_RADIUS * Math.abs(nz);
    parts.push(`M${fmt(ax)} ${fmt(ay)}A${SUN_RADIUS} ${fmt(ry)} ${fmt(angle)} 0 ${sweep} ${fmt(bx)} ${fmt(by)}`);
  }
  return parts.join("");
}

/**
 * The meridians' frames for one loop of the spin. The pattern repeats every
 * 180°/meridians, so one short loop plays seamlessly forever. Frames are
 * stepped (no tweening), about one per 1.5° of turn.
 */
/** The animation: meridian paths in play order, and how long one loop lasts. */
export type SpinFrames = { frames: string[]; seconds: number };

export function spinFrames(globe: GlobeLines, cx: number, cy: number): SpinFrames {
  const period = 180 / Math.max(globe.meridians, 1);
  const count = Math.max(8, Math.round(period / 1.5));
  const direction = Math.sign(globe.spin) || 1;
  const frames = Array.from({ length: count }, (_, i) =>
    meridiansPath(globe, cx, cy, globe.turn + direction * (i * period) / count),
  );
  return { frames, seconds: period / Math.max(Math.abs(globe.spin), 0.1) };
}
