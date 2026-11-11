"use client";

import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import { PERSPECTIVE, bend } from "./scene";
import type { Curve } from "./scene";

/**
 * The back layer: a dot grid with a sparse field of pixel glyphs that slowly
 * turn over, drawn on its own canvas and bent onto the scene's curve. It
 * slides with the pointer at a fraction of the windows' parallax.
 *
 * It runs its own frame loop and re-measures and re-reads its colors whenever
 * they go stale, so a hot reload or a theme change can't leave it blank.
 */

/** Dot spacing, in CSS px. */
const STEP = 44;
/** Characters the glyph field cycles through. */
const GLYPHS = "linksamarelos#01";

/** A stable pseudo-random number in [0, 1) for a grid cell. */
function hash(i: number, j: number): number {
  const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

type FieldProps = {
  /** Smoothed pointer, -1..1 on each axis (written by the scene's loop). */
  pointer: RefObject<{ x: number; y: number }>;
  /** How far the field slides at the pointer's extremes, in px. */
  slide: number;
  curve: RefObject<Curve>;
  /** The camera's step back, in px of depth (eased by the scene's loop). */
  dolly: RefObject<{ now: number }>;
};

export default function Field({ pointer, slide, curve, dolly }: FieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const maybeCanvas = canvasRef.current;
    if (!maybeCanvas) return;
    const canvas: HTMLCanvasElement = maybeCanvas;
    const maybeCtx = canvas.getContext("2d");
    if (!maybeCtx) return;
    const ctx: CanvasRenderingContext2D = maybeCtx;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let color = "";
    let font = "";
    let width = 0;
    let height = 0;

    function readStyle() {
      const css = getComputedStyle(canvas);
      color = css.getPropertyValue("--rede-field").trim();
      font = css.getPropertyValue("--font-geist-pixel-square").trim() || "monospace";
    }
    const themeWatch = new MutationObserver(readStyle);
    themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const scheme = window.matchMedia("(prefers-color-scheme: dark)");
    scheme.addEventListener("change", readStyle);

    function fit() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    let raf = 0;
    const started = performance.now();
    function frame(now: number) {
      // Self-heal: size and colors are checked every frame, never trusted from setup.
      if (canvas.clientWidth !== width || canvas.clientHeight !== height) fit();
      if (color === "") readStyle();
      draw(motion.matches ? 0 : (now - started) / 1000);
      raf = requestAnimationFrame(frame);
    }

    function draw(seconds: number) {
      ctx.clearRect(0, 0, width, height);
      if (color === "" || width === 0) return;
      const c = curve.current;
      const back = dolly.current.now;
      const cx = width / 2;
      const cy = height / 2;
      const ox = -pointer.current.x * slide;
      const oy = -pointer.current.y * slide;
      // Cover past the edges: the curve pulls far points back in.
      // Stepping back shrinks the field, so it needs to reach further.
      const reach = Math.max(width, height) * 0.8 * ((PERSPECTIVE + back) / PERSPECTIVE);
      const n = Math.ceil(reach / STEP) + 1;
      ctx.fillStyle = color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (let i = -n; i <= n; i++) {
        for (let j = -n; j <= n; j++) {
          const fx = i * STEP + ox;
          const fy = j * STEP + oy;
          const d = Math.hypot(fx, fy);
          const b = bend(d, c);
          const k = PERSPECTIVE / (PERSPECTIVE - b.z + back);
          const r = d === 0 ? 0 : (b.r * k) / d;
          const x = cx + fx * r;
          const y = cy + fy * r;
          if (x < -STEP || x > width + STEP || y < -STEP || y > height + STEP) continue;
          // Foreshortened as the surface turns away, magnified as it nears.
          const size = k * Math.cos(Math.abs(b.theta));

          ctx.globalAlpha = 0.22;
          const dot = Math.max(0.6, 1.6 * size);
          ctx.fillRect(x - dot / 2, y - dot / 2, dot, dot);

          const h = hash(i, j);
          if (h > 0.14) continue;
          // Each glyph turns over on its own clock, centered in its cell.
          const turn = Math.floor(seconds * (0.4 + h * 3) + h * 97);
          const len = GLYPHS.length;
          const ch = GLYPHS[(((turn + i * 7 + j * 3) % len) + len) % len] ?? "#";
          const gd = Math.hypot(fx + STEP / 2, fy + STEP / 2);
          const gb = bend(gd, c);
          const gk = PERSPECTIVE / (PERSPECTIVE - gb.z + back);
          const gr = gd === 0 ? 0 : (gb.r * gk) / gd;
          ctx.globalAlpha = 0.16;
          ctx.font = `${Math.max(4, Math.round(15 * gk * Math.cos(Math.abs(gb.theta))))}px ${font}`;
          ctx.fillText(ch, cx + (fx + STEP / 2) * gr, cy + (fy + STEP / 2) * gr);
        }
      }
      ctx.globalAlpha = 1;
    }

    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      themeWatch.disconnect();
      scheme.removeEventListener("change", readStyle);
    };
  }, [pointer, slide, curve, dolly]);

  return <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 size-full" />;
}
