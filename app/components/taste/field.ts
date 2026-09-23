// The space-time field behind the taste section: a sheet that every landed
// link dents with its mass. Pure simulation — no React, no drawing. Each frame
// TasteSection calls `step`, then scene.ts renders the result in WebGL.
//
// World units: x runs left/right, z is distance from the camera, and the
// sheet rests at height 0. `depthAt` is how far the sheet sinks at (x, z);
// the surface height there is its negative.

// ── Tuning ───────────────────────────────────────────────────────────────────
// The sheet's shape constants are exported because scene.ts evaluates the
// same shape on the GPU (see SHEET_GLSL there). Change one, check both.
export const LINK_RADIUS = 0.075; // world radius of a link sphere
export const LINK_MASS = 0.2; // well depth one link carries
export const WELL_SIGMA = 0.34; // well width
export const SAG_PER_LINK = 0.045; // the whole sheet leans toward the centre
export const SAG_SIGMA = 1.25;
export const CENTER_Z = 2.3; // where the sheet sags to, and where the singularity opens
// Link wells stack, but the sheet stretches only so far before the collapse:
// their summed depth eases toward this ceiling so settled links stay on
// screen however they pile up.
export const MAX_LINK_DEPTH = 0.42;
// The singularity: a well that deepens while it narrows. Kept shallow enough
// that the throat stays inside the view.
export const FUNNEL_DEPTH = 1.05;
export const FUNNEL_SIGMA_START = 0.9;
export const FUNNEL_SIGMA_SHRINK = 0.76;

const GRAVITY = 9;
const BOUNCE = 0.22;
const MIN_BOUNCE_SPEED = 1.4;
const SLOPE_PULL = 7; // how hard a slope drags a sliding link
const SLIDE_DAMPING = 3.2;
const SETTLE_SPEED = 0.03;
const SETTLE_SECONDS = 0.35;
// A link jostled by its neighbours may never go fully calm; after this long
// on the sheet it rests where it is.
const MAX_SLIDE_SECONDS = 2.5;

const RIPPLE_AMP = 0.05;
export const RIPPLE_SPEED = 1.6;
export const RIPPLE_WIDTH = 0.28;
export const RIPPLE_WAVELENGTH = 0.32;
export const RIPPLE_LIFE = 1.4;

const COLLAPSE_SECONDS = 2.6;
const DISSIPATE_SECONDS = 1.3;
// ─────────────────────────────────────────────────────────────────────────────

type Common = {
  id: string;
  x: number;
  z: number;
  y: number;
  vx: number;
  vz: number;
  opacity: number;
};

// A link is in the air, sliding on the sheet, or at rest. Only the first two
// carry motion bookkeeping, so the phases are separate types rather than one
// type with optional fields. `sinking` is the collapse: every link, whatever
// it was doing, is pulled down the funnel.
type Falling = Common & { kind: "falling"; vy: number; bounced: boolean };
type Sliding = Common & { kind: "sliding"; calmFor: number; slidFor: number };
type Resting = Common & { kind: "resting" };
type Sinking = Common & { kind: "sinking" };
export type Body = Falling | Sliding | Resting | Sinking;

type Ripple = { x: number; z: number; amp: number; age: number };

type Stage =
  | { kind: "tasting" }
  | { kind: "collapsing"; t: number }
  | { kind: "dissipating"; t: number }
  | { kind: "gone" };

export type Sim = {
  bodies: Body[];
  ripples: Ripple[];
  stage: Stage;
  reducedMotion: boolean;
  time: number;
};

export type SimEvent =
  | { kind: "settled"; id: string }
  | { kind: "collapsed" }
  | { kind: "dissipated" };

export function createSim(reducedMotion: boolean): Sim {
  return {
    bodies: [],
    ripples: [],
    stage: { kind: "tasting" },
    reducedMotion,
    time: 0,
  };
}

// ── Field shape ──────────────────────────────────────────────────────────────

const gaussian = (d2: number, sigma: number) =>
  Math.exp(-d2 / (2 * sigma * sigma));

/** 0 → 1 progress of the collapse, eased in so the funnel accelerates. */
export function collapseAmount(sim: Sim): number {
  switch (sim.stage.kind) {
    case "tasting":
      return 0;
    case "collapsing":
      return Math.pow(sim.stage.t, 2.2);
    case "dissipating":
    case "gone":
      return 1;
  }
}

/** How far the sheet sinks at (x, z). `skip` leaves one body's own well out,
 *  so a sliding link feels the others' slopes and not its own dent. */
export function depthAt(sim: Sim, x: number, z: number, skip?: Body): number {
  const collapse = collapseAmount(sim);
  const count = sim.bodies.length;

  const dcx = x;
  const dcz = z - CENTER_Z;
  const centerD2 = dcx * dcx + dcz * dcz;
  let wells = SAG_PER_LINK * count * gaussian(centerD2, SAG_SIGMA);

  const sigma = WELL_SIGMA * (1 - 0.5 * collapse);
  for (const body of sim.bodies) {
    if (body === skip || body.kind === "falling") continue;
    const dx = x - body.x;
    const dz = z - body.z;
    wells += LINK_MASS * gaussian(dx * dx + dz * dz, sigma);
  }
  let depth = MAX_LINK_DEPTH * Math.tanh(wells / MAX_LINK_DEPTH);

  if (collapse > 0) {
    // Deepens while it narrows, which reads as the funnel in the black-hole
    // diagram.
    const funnelSigma = FUNNEL_SIGMA_START - FUNNEL_SIGMA_SHRINK * collapse;
    depth += FUNNEL_DEPTH * collapse * gaussian(centerD2, funnelSigma);
  }

  for (const ripple of sim.ripples) {
    const dx = x - ripple.x;
    const dz = z - ripple.z;
    const r = Math.sqrt(dx * dx + dz * dz);
    const front = r - RIPPLE_SPEED * ripple.age;
    const envelope =
      Math.exp(-ripple.age / (RIPPLE_LIFE / 3)) *
      Math.exp(-(front * front) / (RIPPLE_WIDTH * RIPPLE_WIDTH));
    depth +=
      ripple.amp * envelope * Math.cos((front / RIPPLE_WAVELENGTH) * Math.PI * 2);
  }

  return depth;
}

// ── Links ────────────────────────────────────────────────────────────────────

/** Drops a new link from `startHeight(x, z)` — the renderer answers with a
 *  height just above the top of the view, so the link falls across the hold
 *  button. With reduced motion it appears where it would have landed, already
 *  calm, and settles on the next step — so its `settled` event still arrives
 *  after the DOM layer has placed it. */
export function spawnBody(
  sim: Sim,
  id: string,
  startHeight: (x: number, z: number) => number,
): void {
  const x = (Math.random() - 0.5) * 1.1;
  const z = CENTER_Z - 0.35 + Math.random() * 0.7;
  const common = { id, x, z, vx: 0, vz: 0, opacity: 1 };

  if (sim.reducedMotion) {
    sim.bodies.push({
      ...common,
      kind: "sliding",
      y: -depthAt(sim, x, z),
      calmFor: SETTLE_SECONDS,
      slidFor: 0,
    });
    return;
  }

  const y = startHeight(x, z);
  sim.bodies.push({ ...common, kind: "falling", y, vy: 0, bounced: false });
}

export function startCollapse(sim: Sim): void {
  if (sim.stage.kind !== "tasting") return;
  sim.stage = { kind: "collapsing", t: 0 };
  sim.bodies = sim.bodies.map((body) => ({ ...body, kind: "sinking" }));
}

/** Advances the simulation by `dt` seconds. */
export function step(sim: Sim, dt: number): SimEvent[] {
  const events: SimEvent[] = [];
  sim.time += dt;

  sim.ripples = sim.ripples.filter((ripple) => {
    ripple.age += dt;
    return ripple.age < RIPPLE_LIFE;
  });

  const stage = sim.stage;
  if (stage.kind === "collapsing") {
    const duration = sim.reducedMotion ? 0.8 : COLLAPSE_SECONDS;
    stage.t = Math.min(1, stage.t + dt / duration);
    if (stage.t >= 1) {
      sim.stage = { kind: "dissipating", t: 0 };
      events.push({ kind: "collapsed" });
    }
  } else if (stage.kind === "dissipating") {
    const duration = sim.reducedMotion ? 0.4 : DISSIPATE_SECONDS;
    stage.t = Math.min(1, stage.t + dt / duration);
    if (stage.t >= 1) {
      sim.stage = { kind: "gone" };
      events.push({ kind: "dissipated" });
    }
  }

  sim.bodies = sim.bodies.map((body) => {
    const next = advanceBody(sim, body, dt);
    if (body.kind === "sliding" && next.kind === "resting") {
      events.push({ kind: "settled", id: next.id });
    }
    return next;
  });

  return events;
}

function advanceBody(sim: Sim, body: Body, dt: number): Body {
  switch (body.kind) {
    case "falling": {
      const vy = body.vy - GRAVITY * dt;
      const y = body.y + vy * dt;
      const surface = -depthAt(sim, body.x, body.z);
      if (y > surface) return { ...body, y, vy };

      if (!body.bounced) {
        sim.ripples.push({
          x: body.x,
          z: body.z,
          amp: RIPPLE_AMP * Math.min(2, -vy / 3),
          age: 0,
        });
      }
      if (-vy > MIN_BOUNCE_SPEED) {
        return { ...body, y: surface, vy: -vy * BOUNCE, bounced: true };
      }
      return { ...body, kind: "sliding", y: surface, calmFor: 0, slidFor: 0 };
    }

    case "sliding": {
      // Downhill is toward more depth, so the pull follows +∇depth of every
      // well except this link's own.
      const e = 0.01;
      const gx =
        (depthAt(sim, body.x + e, body.z, body) -
          depthAt(sim, body.x - e, body.z, body)) /
        (2 * e);
      const gz =
        (depthAt(sim, body.x, body.z + e, body) -
          depthAt(sim, body.x, body.z - e, body)) /
        (2 * e);
      const damping = Math.exp(-SLIDE_DAMPING * dt);
      let vx = (body.vx + gx * SLOPE_PULL * dt) * damping;
      let vz = (body.vz + gz * SLOPE_PULL * dt) * damping;
      let x = body.x + vx * dt;
      let z = body.z + vz * dt;

      // Links never overlap: push out of any neighbour and lose the speed
      // that was heading into it.
      for (const other of sim.bodies) {
        if (other === body || other.kind === "falling") continue;
        const dx = x - other.x;
        const dz = z - other.z;
        const dist = Math.hypot(dx, dz);
        const min = LINK_RADIUS * 2.8;
        if (dist > 0 && dist < min) {
          const nx = dx / dist;
          const nz = dz / dist;
          x = other.x + nx * min;
          z = other.z + nz * min;
          const into = vx * nx + vz * nz;
          if (into < 0) {
            vx -= into * nx;
            vz -= into * nz;
          }
        }
      }

      const y = -depthAt(sim, x, z);
      const speed = Math.hypot(vx, vz);
      const calmFor = speed < SETTLE_SPEED ? body.calmFor + dt : 0;
      const slidFor = body.slidFor + dt;
      if (calmFor >= SETTLE_SECONDS || slidFor >= MAX_SLIDE_SECONDS) {
        return { ...body, kind: "resting", x, z, y, vx: 0, vz: 0 };
      }
      return { ...body, x, z, y, vx, vz, calmFor, slidFor };
    }

    case "resting":
      return { ...body, y: -depthAt(sim, body.x, body.z) };

    case "sinking": {
      // Spiral into the singularity and fall down the funnel with it.
      const dx = -body.x;
      const dz = CENTER_Z - body.z;
      const pull = 1.2 + 4 * collapseAmount(sim);
      const x = body.x + dx * Math.min(1, pull * dt) + dz * 0.6 * dt;
      const z = body.z + dz * Math.min(1, pull * dt) - dx * 0.6 * dt;
      const y = -depthAt(sim, x, z);
      const opacity =
        sim.stage.kind === "collapsing" ? 1 - Math.pow(sim.stage.t, 3) : 0;
      return { ...body, x, z, y, opacity };
    }
  }
}

// ── For the renderer ─────────────────────────────────────────────────────────

/** How far the sheet has faded (1 → 0) and dropped away while dissipating. */
export type Dissolve = { fade: number; drop: number };

export function dissolve(sim: Sim): Dissolve {
  switch (sim.stage.kind) {
    case "tasting":
    case "collapsing":
      return { fade: 1, drop: 0 };
    case "dissipating":
      return { fade: 1 - sim.stage.t, drop: sim.stage.t * 0.9 };
    case "gone":
      return { fade: 0, drop: 0.9 };
  }
}
