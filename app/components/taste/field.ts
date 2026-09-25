// The space-time field behind the taste section: a sheet that every landed
// link dents with its mass. Pure simulation — no React, no drawing. Each frame
// TasteSection calls `step`, then scene.ts renders the result in WebGL.
//
// World units: x runs left/right, z is distance from the camera, and the
// sheet rests at height 0. `depthAt` is how far the sheet sinks at (x, z);
// the surface height there is its negative.

// ── Tuning ───────────────────────────────────────────────────────────────────
// Every knob lives on one object that rides on the sim, so the dev tuning
// panel (TuningPanel.tsx) can swap it live. scene.ts reads the same object to
// feed the GPU copy of the sheet's shape (SHEET_GLSL there).
export const FIELD_DEFAULTS = {
  // Sheet shape
  wellSigma: 0.42, // width of one link's dent
  linkMass: 0.2, // well depth one link carries
  sagPerLink: 0.03, // the whole sheet leans toward the centre
  sagSigma: 0.65,
  centerZ: 2, // where the sheet sags to
  // Link wells stack, but the sheet stretches only so far: their summed
  // depth eases toward this ceiling so settled links stay on screen however
  // they pile up.
  maxLinkDepth: 1.2,

  // Links
  linkRadius: 0.06, // world radius of a link sphere
  spawnSpreadX: 1.4, // width of the drop zone
  spawnSpreadZ: 1, // depth of the drop zone
  spacing: 2.5, // closest two links sit, in radii

  // Motion
  gravity: 9,
  bounce: 0.01,
  minBounceSpeed: 1,
  slopePull: 7, // how hard a slope drags a sliding link
  slideDamping: 3.2,
  settleSpeed: 0.03,
  settleSeconds: 0.35,
  // A link jostled by its neighbours may never go fully calm; after this
  // long on the sheet it rests where it is.
  maxSlideSeconds: 2.5,

  // Ripples
  rippleAmp: 0.01,
  rippleSpeed: 0.7,
  rippleWidth: 0.05,
  rippleWavelength: 0.05,
  rippleLife: 0.2,

  // Ending: the camera moves in on the dents (scene.ts reads how far along
  // it is from `framingAmount`), then the patch turns for good.
  framingSeconds: 1.6,
  orbitSeconds: 48, // one full turn
  orbitHoldEase: 4, // how fast the turn stops for an open card, and resumes
};
export type FieldTuning = typeof FIELD_DEFAULTS;
// ─────────────────────────────────────────────────────────────────────────────

type Common = {
  id: string;
  x: number;
  z: number;
  y: number;
  vx: number;
  vz: number;
};

// A link is in the air, sliding on the sheet, or at rest. Only the first two
// carry motion bookkeeping, so the phases are separate types rather than one
// type with optional fields.
type Falling = Common & { kind: "falling"; vy: number; bounced: boolean };
type Sliding = Common & { kind: "sliding"; calmFor: number; slidFor: number };
type Resting = Common & { kind: "resting" };
export type Body = Falling | Sliding | Resting;

type Ripple = { x: number; z: number; amp: number; age: number };

// After the last link, the view frames the dents and starts turning around
// them, and never stops. `spin` is the turn so far, in radians; `speed` is
// the current share (0 → 1) of full orbit speed, so the turn can ease in and
// ease out around an open card.
type Stage =
  | { kind: "tasting" }
  | { kind: "framing"; t: number; spin: number; speed: number }
  | { kind: "orbiting"; spin: number; speed: number };

export type Sim = {
  bodies: Body[];
  ripples: Ripple[];
  stage: Stage;
  reducedMotion: boolean;
  /** While true the orbit eases to a stop, so an open card stays by its
   *  link. TasteSection sets it. */
  holdOrbit: boolean;
  time: number;
  tune: FieldTuning;
};

export type SimEvent = { kind: "settled"; id: string } | { kind: "framed" };

export function createSim(
  reducedMotion: boolean,
  tune: FieldTuning = FIELD_DEFAULTS,
): Sim {
  return {
    bodies: [],
    ripples: [],
    stage: { kind: "tasting" },
    reducedMotion,
    holdOrbit: false,
    time: 0,
    tune,
  };
}

// ── Field shape ──────────────────────────────────────────────────────────────

const gaussian = (d2: number, sigma: number) =>
  Math.exp(-d2 / (2 * sigma * sigma));

/** How far the sheet sinks at (x, z). `skip` leaves one body's own well out,
 *  so a sliding link feels the others' slopes and not its own dent. */
export function depthAt(sim: Sim, x: number, z: number, skip?: Body): number {
  const tune = sim.tune;
  const count = sim.bodies.length;

  const dcx = x;
  const dcz = z - tune.centerZ;
  const centerD2 = dcx * dcx + dcz * dcz;
  let wells = tune.sagPerLink * count * gaussian(centerD2, tune.sagSigma);

  for (const body of sim.bodies) {
    if (body === skip || body.kind === "falling") continue;
    const dx = x - body.x;
    const dz = z - body.z;
    wells += tune.linkMass * gaussian(dx * dx + dz * dz, tune.wellSigma);
  }
  let depth = tune.maxLinkDepth * Math.tanh(wells / tune.maxLinkDepth);

  for (const ripple of sim.ripples) {
    const dx = x - ripple.x;
    const dz = z - ripple.z;
    const r = Math.sqrt(dx * dx + dz * dz);
    const front = r - tune.rippleSpeed * ripple.age;
    const envelope =
      Math.exp(-ripple.age / (tune.rippleLife / 3)) *
      Math.exp(-(front * front) / (tune.rippleWidth * tune.rippleWidth));
    depth +=
      ripple.amp *
      envelope *
      Math.cos((front / tune.rippleWavelength) * Math.PI * 2);
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
  const tune = sim.tune;
  const x = (Math.random() - 0.5) * tune.spawnSpreadX;
  const z = tune.centerZ + (Math.random() - 0.5) * tune.spawnSpreadZ;
  const common = { id, x, z, vx: 0, vz: 0 };

  if (sim.reducedMotion) {
    sim.bodies.push({
      ...common,
      kind: "sliding",
      y: -depthAt(sim, x, z),
      calmFor: tune.settleSeconds,
      slidFor: 0,
    });
    return;
  }

  const y = startHeight(x, z);
  sim.bodies.push({ ...common, kind: "falling", y, vy: 0, bounced: false });
}

export function startFraming(sim: Sim): void {
  if (sim.stage.kind !== "tasting") return;
  sim.stage = { kind: "framing", t: 0, spin: 0, speed: 0 };
}

/** Advances the simulation by `dt` seconds. */
export function step(sim: Sim, dt: number): SimEvent[] {
  const events: SimEvent[] = [];
  const tune = sim.tune;
  sim.time += dt;

  sim.ripples = sim.ripples.filter((ripple) => {
    ripple.age += dt;
    return ripple.age < tune.rippleLife;
  });

  const stage = sim.stage;
  if (stage.kind === "framing") {
    const duration = sim.reducedMotion ? 0.5 : tune.framingSeconds;
    stage.t = Math.min(1, stage.t + dt / duration);
    // The turn gathers speed across the framing, so it never visibly starts.
    stage.speed = sim.holdOrbit ? 0 : stage.t;
    stage.spin += spinStep(sim, stage.speed, dt);
    if (stage.t >= 1) {
      sim.stage = { kind: "orbiting", spin: stage.spin, speed: stage.speed };
      events.push({ kind: "framed" });
    }
  } else if (stage.kind === "orbiting") {
    const target = sim.holdOrbit ? 0 : 1;
    stage.speed +=
      (target - stage.speed) * (1 - Math.exp(-tune.orbitHoldEase * dt));
    stage.spin += spinStep(sim, stage.speed, dt);
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

/** Radians turned in `dt` at `speed` (0 → 1) of full orbit speed. Reduced
 *  motion frames the dents and holds still. */
function spinStep(sim: Sim, speed: number, dt: number): number {
  if (sim.reducedMotion) return 0;
  return ((Math.PI * 2) / sim.tune.orbitSeconds) * speed * dt;
}

function advanceBody(sim: Sim, body: Body, dt: number): Body {
  const tune = sim.tune;
  switch (body.kind) {
    case "falling": {
      const vy = body.vy - tune.gravity * dt;
      const y = body.y + vy * dt;
      const surface = -depthAt(sim, body.x, body.z);
      if (y > surface) return { ...body, y, vy };

      if (!body.bounced) {
        sim.ripples.push({
          x: body.x,
          z: body.z,
          amp: tune.rippleAmp * Math.min(2, -vy / 3),
          age: 0,
        });
      }
      if (-vy > tune.minBounceSpeed) {
        return { ...body, y: surface, vy: -vy * tune.bounce, bounced: true };
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
      const damping = Math.exp(-tune.slideDamping * dt);
      let vx = (body.vx + gx * tune.slopePull * dt) * damping;
      let vz = (body.vz + gz * tune.slopePull * dt) * damping;
      let x = body.x + vx * dt;
      let z = body.z + vz * dt;

      // Links never overlap: push out of any neighbour and lose the speed
      // that was heading into it.
      for (const other of sim.bodies) {
        if (other === body || other.kind === "falling") continue;
        const dx = x - other.x;
        const dz = z - other.z;
        const dist = Math.hypot(dx, dz);
        const min = tune.linkRadius * tune.spacing;
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
      const calmFor = speed < tune.settleSpeed ? body.calmFor + dt : 0;
      const slidFor = body.slidFor + dt;
      if (calmFor >= tune.settleSeconds || slidFor >= tune.maxSlideSeconds) {
        return { ...body, kind: "resting", x, z, y, vx: 0, vz: 0 };
      }
      return { ...body, x, z, y, vx, vz, calmFor, slidFor };
    }

    case "resting":
      return { ...body, y: -depthAt(sim, body.x, body.z) };
  }
}

// ── For the renderer ─────────────────────────────────────────────────────────

/** 0 → 1 progress of the move into the final shot, eased in and out. */
export function framingAmount(sim: Sim): number {
  switch (sim.stage.kind) {
    case "tasting":
      return 0;
    case "framing": {
      const t = sim.stage.t;
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    case "orbiting":
      return 1;
  }
}

/** How far the view has turned around the dents, in radians. */
export function orbitAngle(sim: Sim): number {
  return sim.stage.kind === "tasting" ? 0 : sim.stage.spin;
}
