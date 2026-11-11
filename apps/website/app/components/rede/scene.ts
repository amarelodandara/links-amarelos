import { NODES, hops } from "./graph";

/**
 * Where every window floats, given the one in focus. Three layers:
 * - focus: center, flat, sharp, full size;
 * - near (1 hop): a ring around it, turned to face the center;
 * - far (2+ hops): a wider ring pushed far back, small and out of focus.
 *
 * Positions are planned in screen px (offsets from the viewport center), then
 * divided by the layer's perspective scale so they land there once projected.
 */

/** CSS perspective of the scene, in px. */
export const PERSPECTIVE = 1200;

export type Layer = "focus" | "near" | "far";

/**
 * Layers on screen. Styling them one at a time: add "near", then "far", as
 * each is ready. Hidden layers keep their place in the layout, they just
 * don't render, and their threads go with them.
 */
export const SHOWN: ReadonlySet<Layer> = new Set<Layer>(["focus"]);

type LayerStyle = {
  /** Distance along z (negative is away from the viewer). */
  z: number;
  /** Max turn toward the center, in degrees, reached at the ring's side. */
  turn: number;
  scale: number;
  blur: number;
  opacity: number;
};

export const LAYERS = {
  focus: { z: 0, turn: 0, scale: 1, blur: 0, opacity: 1 },
  near: { z: -160, turn: 26, scale: 0.8, blur: 0, opacity: 1 },
  far: { z: -1100, turn: 0, scale: 0.72, blur: 4, opacity: 0.55 },
} as const satisfies Record<Layer, LayerStyle>;

/** Ring radii as a share of the viewport, per layer, capped in px. */
const RING = {
  near: { x: 0.33, y: 0.3, maxX: 560 },
  far: { x: 0.46, y: 0.4, maxX: 820 },
} as const;

/**
 * Near-ring angles (degrees, 0 = right, y down), indexed by neighbor count,
 * as in the sketch: one left, one lower right. Counts past the list spread evenly.
 */
const NEAR_ANGLES: readonly (readonly number[])[] = [[], [12], [186, 18], [186, 24, -58], [186, 24, -58, 118]];

export type Pose = {
  x: number;
  y: number;
  z: number;
  /** rotateY, degrees. */
  turn: number;
  /** rotateX, degrees: only the curvature sets it. */
  tilt: number;
  scale: number;
  blur: number;
  opacity: number;
};

export type Placement = { layer: Layer; pose: Pose };

export type Viewport = { width: number; height: number };

const rad = (deg: number) => (deg * Math.PI) / 180;

/** How much a point at depth z shrinks once projected. */
export const depthScale = (z: number): number => PERSPECTIVE / (PERSPECTIVE - z);

function poseAt(layer: Layer, screenX: number, screenY: number, ringX: number): Pose {
  const s = LAYERS[layer];
  const k = depthScale(s.z);
  // Left of center turns its right edge away, right of center its left edge: both face in.
  const side = ringX > 0 ? Math.max(-1, Math.min(1, screenX / ringX)) : 0;
  return {
    x: screenX / k,
    y: screenY / k,
    z: s.z,
    turn: -side * s.turn,
    tilt: 0,
    scale: s.scale,
    blur: s.blur,
    opacity: s.opacity,
  };
}

/** Circular mean of angles, radians. */
function meanAngle(angles: number[]): number {
  const sx = angles.reduce((acc, a) => acc + Math.cos(a), 0);
  const sy = angles.reduce((acc, a) => acc + Math.sin(a), 0);
  return Math.atan2(sy, sx);
}

export function layout(focus: string, vp: Viewport): Map<string, Placement> {
  const tree = hops(focus);
  const out = new Map<string, Placement>();
  out.set(focus, { layer: "focus", pose: poseAt("focus", 0, 0, 0) });

  const nx = Math.min(vp.width * RING.near.x, RING.near.maxX);
  const ny = vp.height * RING.near.y;
  const fx = Math.min(vp.width * RING.far.x, RING.far.maxX);
  const fy = vp.height * RING.far.y;

  const near = NODES.filter((n) => tree.get(n.id)?.hop === 1).map((n) => n.id);
  const preset = NEAR_ANGLES[near.length];
  const angle = new Map<string, number>();
  near.forEach((id, i) => {
    const a = rad(preset?.[i] ?? (360 / near.length) * i + 186);
    angle.set(id, a);
    out.set(id, { layer: "near", pose: poseAt("near", Math.cos(a) * nx, Math.sin(a) * ny, nx) });
  });

  // Far windows go round the ring in tree order (a depth-first walk from each
  // near window, in ring order), so a thread mostly joins next-door windows
  // instead of crossing the scene. Spread evenly, then turned so each branch
  // sits behind the near window it hangs from.
  const children = (id: string) => NODES.filter((n) => tree.get(n.id)?.via === id).map((n) => n.id);
  const far: { id: string; want: number }[] = [];
  const walk = (id: string, want: number) => {
    for (const child of children(id)) {
      far.push({ id: child, want });
      walk(child, want);
    }
  };
  [...near].sort((a, b) => (angle.get(a) ?? 0) - (angle.get(b) ?? 0)).forEach((id) => walk(id, angle.get(id) ?? 0));
  const step = far.length > 0 ? (Math.PI * 2) / far.length : 0;
  const offset = meanAngle(far.map((f, i) => f.want - i * step));
  far.forEach((f, i) => {
    const a = offset + i * step;
    out.set(f.id, { layer: "far", pose: poseAt("far", Math.cos(a) * fx, Math.sin(a) * fy, fx) });
  });

  return out;
}

export type Pt = { x: number; y: number };

/**
 * The four screen corners of a window (relative to the viewport center),
 * given its pose and unscaled size. Mirrors the CSS transform
 * `translate3d(x, y, z) rotateY(turn) rotateX(tilt) scale(s)` around the window's center.
 */
export function quad(p: Pose, w: number, h: number): Pt[] {
  const cos = Math.cos(rad(p.turn));
  const sin = Math.sin(rad(p.turn));
  const cosT = Math.cos(rad(p.tilt));
  const sinT = Math.sin(rad(p.tilt));
  const corners: Pt[] = [
    { x: -w / 2, y: -h / 2 },
    { x: w / 2, y: -h / 2 },
    { x: w / 2, y: h / 2 },
    { x: -w / 2, y: h / 2 },
  ];
  return corners.map((c) => {
    const lx = c.x * p.scale;
    const ly = c.y * p.scale;
    // rotateX first (the rightmost transform), then rotateY.
    const ty = ly * cosT;
    const tz = ly * sinT;
    const X = p.x + lx * cos + tz * sin;
    const Y = p.y + ty;
    const Z = p.z - lx * sin + tz * cos;
    const k = depthScale(Z);
    return { x: X * k, y: Y * k };
  });
}

/** The projected center of a window. */
export const center = (p: Pose): Pt => ({ x: p.x * depthScale(p.z), y: p.y * depthScale(p.z) });

/**
 * Where the segment from `a` (inside `poly`) toward `b` leaves `poly`:
 * the thread starts at the window's edge, not under it.
 */
export function exitPoint(a: Pt, b: Pt, poly: Pt[]): Pt {
  let best = 0;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    if (!p || !q) continue;
    const ex = q.x - p.x;
    const ey = q.y - p.y;
    const den = dx * ey - dy * ex;
    if (Math.abs(den) < 1e-9) continue;
    const t = ((p.x - a.x) * ey - (p.y - a.y) * ex) / den;
    const u = ((p.x - a.x) * dy - (p.y - a.y) * dx) / den;
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) best = Math.max(best, t);
  }
  return { x: a.x + dx * best, y: a.y + dy * best };
}

/** Eases `from` toward `to` by `t` (0..1). */
export function approach(from: Pose, to: Pose, t: number): Pose {
  const m = (a: number, b: number) => a + (b - a) * t;
  return {
    x: m(from.x, to.x),
    y: m(from.y, to.y),
    z: m(from.z, to.z),
    turn: m(from.turn, to.turn),
    tilt: m(from.tilt, to.tilt),
    scale: m(from.scale, to.scale),
    blur: m(from.blur, to.blur),
    opacity: m(from.opacity, to.opacity),
  };
}


export function poseTransform(p: Pose): string {
  return `translate3d(${p.x.toFixed(2)}px, ${p.y.toFixed(2)}px, ${p.z.toFixed(2)}px) rotateY(${p.turn.toFixed(3)}deg) rotateX(${p.tilt.toFixed(3)}deg) scale(${p.scale.toFixed(4)}) translate(-50%, -50%)`;
}

/**
 * The curvature the scene sits on: a sphere of `radius` px around the
 * viewport center. `amount` 1 is concave (edges curve toward the viewer, like
 * a curved screen, matching the near ring that faces the center), -1 convex
 * (edges fall away), 0 flat.
 */
export type Curve = { amount: number; radius: number };

/** Where a point lands on the curve: its new distance from the center, its depth, and the surface's angle there (radians, signed by the curve). */
export type Bend = { r: number; z: number; theta: number };

/** How a point `d` px from the center lands on the curve. */
export function bend(d: number, c: Curve): Bend {
  if (c.amount === 0 || c.radius <= 0 || d === 0) return { r: d, z: 0, theta: 0 };
  const theta = Math.min(d / c.radius, Math.PI / 2);
  // Blend flat and spherical by |amount|, so the dial moves smoothly through 0.
  const k = Math.abs(c.amount);
  const r = d + (c.radius * Math.sin(theta) - d) * k;
  const z = Math.sign(c.amount) * k * c.radius * (1 - Math.cos(theta));
  // Never let a point reach the viewer.
  return { r, z: Math.min(z, PERSPECTIVE * 0.6), theta: theta * c.amount };
}

/** A window pose placed on the curve: moved along it and turned to lie on its surface. */
export function curve(p: Pose, c: Curve): Pose {
  const d = Math.hypot(p.x, p.y);
  if (d === 0) return p;
  const b = bend(d, c);
  const deg = (b.theta * 180) / Math.PI;
  return {
    ...p,
    x: (p.x / d) * b.r,
    y: (p.y / d) * b.r,
    z: p.z + b.z,
    // Concave: right of center turns its right edge toward the viewer, above center its top edge.
    turn: p.turn - deg * (p.x / d),
    tilt: p.tilt + deg * (p.y / d),
  };
}
