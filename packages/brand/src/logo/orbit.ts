import { SUN_RADIUS } from "./types.ts";
import type { LogoConfig } from "./types.ts";

const RAD = Math.PI / 180;

export type OrbitPoint = {
  x: number;
  y: number;
  /** On the far half of a flattened orbit: drawn behind the sun. */
  behind: boolean;
};

/** The ring as drawn: its two semi-axes, after inclination. */
export type OrbitAxes = { rx: number; ry: number; inclined: boolean };

export function orbitAxes(config: LogoConfig): OrbitAxes {
  const rx = Math.max(config.orbit.radius, SUN_RADIUS);
  return {
    rx,
    ry: rx * Math.cos(config.orbit.inclination * RAD),
    inclined: config.orbit.inclination > 0.5,
  };
}

/** Where the cursor tip sits for this config's orbit angle. */
export function orbitPoint(config: LogoConfig): OrbitPoint {
  const { sun, orbit } = config;
  const { rx, ry, inclined } = orbitAxes(config);
  const a = orbit.angle * RAD;
  const t = orbit.tilt * RAD;
  const lx = rx * Math.cos(a);
  const ly = ry * Math.sin(a);
  return {
    x: sun.cx + lx * Math.cos(t) - ly * Math.sin(t),
    y: sun.cy + lx * Math.sin(t) + ly * Math.cos(t),
    // Seen straight down (inclination 0) the ring has no far side.
    behind: inclined && Math.sin(a) < 0,
  };
}

/**
 * The orbit angle (degrees, 0–360) closest to a point: the inverse of
 * orbitPoint, for dragging the cursor around the ring.
 */
export function angleAt(config: LogoConfig, x: number, y: number): number {
  const { sun, orbit } = config;
  const { rx, ry } = orbitAxes(config);
  const t = -orbit.tilt * RAD;
  const dx = x - sun.cx;
  const dy = y - sun.cy;
  const lx = dx * Math.cos(t) - dy * Math.sin(t);
  const ly = dx * Math.sin(t) + dy * Math.cos(t);
  const degrees = Math.atan2(ly / Math.max(ry, 1), lx / Math.max(rx, 1)) / RAD;
  return (degrees + 360) % 360;
}
