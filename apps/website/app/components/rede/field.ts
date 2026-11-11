import type { Camera, Viewport } from "./camera";

/**
 * The back layer: a dot grid with a sparse field of pixel glyphs that slowly
 * change, drawn on one canvas. It follows the camera at a fraction of its
 * speed, which reads as depth.
 */

/** How far the field travels for each unit the camera moves (1 = glued to the network). */
const PARALLAX = 0.35;
/** Dot spacing at zoom 1, in CSS px. */
const STEP = 44;
/** Characters the glyph field cycles through. */
const GLYPHS = "linksamarelos#01";

export type FieldStyle = { color: string; font: string };

/** A stable pseudo-random number in [0, 1) for a grid cell. */
function hash(i: number, j: number): number {
  const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

export function drawField(
  ctx: CanvasRenderingContext2D,
  vp: Viewport,
  cam: Camera,
  seconds: number,
  style: FieldStyle,
): void {
  ctx.clearRect(0, 0, vp.width, vp.height);
  const zoom = 0.6 + 0.4 * cam.zoom;
  const step = STEP * zoom;
  const ox = vp.width / 2 - cam.x * cam.zoom * PARALLAX;
  const oy = vp.height / 2 - cam.y * cam.zoom * PARALLAX;
  const i0 = Math.floor(-ox / step) - 1;
  const j0 = Math.floor(-oy / step) - 1;
  const i1 = i0 + Math.ceil(vp.width / step) + 2;
  const j1 = j0 + Math.ceil(vp.height / step) + 2;

  ctx.fillStyle = style.color;
  const dot = Math.max(1, 1.6 * zoom);
  ctx.globalAlpha = 0.22;
  for (let i = i0; i <= i1; i++) {
    for (let j = j0; j <= j1; j++) {
      ctx.fillRect(ox + i * step - dot / 2, oy + j * step - dot / 2, dot, dot);
    }
  }

  ctx.globalAlpha = 0.16;
  ctx.font = `${Math.round(15 * zoom)}px ${style.font}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let i = i0; i <= i1; i++) {
    for (let j = j0; j <= j1; j++) {
      const h = hash(i, j);
      if (h > 0.14) continue;
      // Each glyph turns over on its own clock.
      const turn = Math.floor(seconds * (0.4 + h * 3) + h * 97);
      const n = GLYPHS.length;
      const ch = GLYPHS[(((turn + i * 7 + j * 3) % n) + n) % n] ?? "#";
      ctx.fillText(ch, ox + (i + 0.5) * step, oy + (j + 0.5) * step);
    }
  }
  ctx.globalAlpha = 1;
}
