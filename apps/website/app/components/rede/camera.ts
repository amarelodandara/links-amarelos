import type { Point } from "./graph";
import { worldBounds } from "./graph";

/** The world point at the center of the screen, and the zoom (1 = world px are CSS px). */
export type Camera = { x: number; y: number; zoom: number };

export type Viewport = { width: number; height: number };

export const MIN_ZOOM = 0.35;
export const MAX_ZOOM = 2.2;
/** Zoom a selected station flies to. */
export const FOCUS_ZOOM = 1;

export const clampZoom = (zoom: number): number => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));

/** Keeps the camera over the network, with some slack past its edge. */
export function clampCamera(cam: Camera): Camera {
  const b = worldBounds(360);
  return {
    x: Math.min(b.maxX, Math.max(b.minX, cam.x)),
    y: Math.min(b.maxY, Math.max(b.minY, cam.y)),
    zoom: clampZoom(cam.zoom),
  };
}

/** The CSS transform that puts `cam` at the center of `vp`. */
export const worldTransform = (cam: Camera, vp: Viewport): string =>
  `translate3d(${vp.width / 2 - cam.x * cam.zoom}px, ${vp.height / 2 - cam.y * cam.zoom}px, 0) scale(${cam.zoom})`;

export function screenToWorld(cam: Camera, vp: Viewport, p: Point): Point {
  return {
    x: cam.x + (p.x - vp.width / 2) / cam.zoom,
    y: cam.y + (p.y - vp.height / 2) / cam.zoom,
  };
}

/** Zooms by `factor`, keeping the world point under `screen` where it is. */
export function zoomAt(cam: Camera, vp: Viewport, screen: Point, factor: number): Camera {
  const zoom = clampZoom(cam.zoom * factor);
  const before = screenToWorld(cam, vp, screen);
  const k = cam.zoom / zoom;
  return clampCamera({
    x: before.x - (before.x - cam.x) * k,
    y: before.y - (before.y - cam.y) * k,
    zoom,
  });
}

/** The whole network in view, centered, leaving room for the HUD. */
export function overview(vp: Viewport): Camera {
  // On a phone the whole network would be too small to read: start on the hub instead.
  if (vp.width < 640) return { x: 0, y: 120, zoom: 0.6 };
  const b = worldBounds(140);
  const zoom = clampZoom(Math.min(vp.width / (b.maxX - b.minX), (vp.height - 120) / (b.maxY - b.minY)));
  return { x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2, zoom };
}

/** Ease-out (0.23, 1, 0.32, 1), solved by bisection on the bezier's x. */
export function easeOut(t: number): number {
  const x1 = 0.23;
  const y1 = 1;
  const x2 = 0.32;
  const y2 = 1;
  const bez = (a: number, b: number, s: number) => 3 * a * s * (1 - s) ** 2 + 3 * b * s * s * (1 - s) + s ** 3;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (bez(x1, x2, mid) < t) lo = mid;
    else hi = mid;
  }
  return bez(y1, y2, (lo + hi) / 2);
}

export const mix = (a: Camera, b: Camera, t: number): Camera => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
  zoom: a.zoom + (b.zoom - a.zoom) * t,
});
