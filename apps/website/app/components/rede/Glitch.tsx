"use client";

import { useEffect, useRef } from "react";

/** Brand tokens the glitch can paint with, by CSS custom property. */
export const GLITCH_TOKENS = ["pen", "paint", "sun", "sunshine", "sunray", "source", "terminal"] as const;
export type GlitchToken = (typeof GLITCH_TOKENS)[number];

export type GlitchConfig = {
  /** Cell size, in CSS px. */
  pixel: number;
  /** Redraws per second. */
  fps: number;
  /** Share of cells painted each frame, 0–1. */
  density: number;
  tokens: readonly GlitchToken[];
};

export const DEFAULT_GLITCH: GlitchConfig = {
  pixel: 3,
  fps: 14,
  density: 0.6,
  tokens: GLITCH_TOKENS,
};

/**
 * A field of pixels flickering in brand colors, filling its parent while
 * `active`. The parent must be positioned; the canvas sits under its text.
 * Reduced motion draws a single still frame.
 */
export default function Glitch({ active, config }: { active: boolean; config: GlitchConfig }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const maybeCanvas = canvasRef.current;
    if (!active || !maybeCanvas) return;
    const canvas: HTMLCanvasElement = maybeCanvas;
    const maybeCtx = canvas.getContext("2d");
    if (!maybeCtx) return;
    const ctx: CanvasRenderingContext2D = maybeCtx;

    const css = getComputedStyle(document.documentElement);
    const colors = config.tokens.map((t) => css.getPropertyValue(`--${t}`).trim()).filter((c) => c.length > 0);
    if (colors.length === 0) return;

    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(r.width * dpr));
    canvas.height = Math.max(1, Math.round(r.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const size = Math.max(1, config.pixel);
    const cols = Math.ceil(r.width / size);
    const rows = Math.ceil(r.height / size);

    function draw() {
      ctx.clearRect(0, 0, r.width, r.height);
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          if (Math.random() > config.density) continue;
          ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)] ?? colors[0] ?? "";
          ctx.fillRect(i * size, j * size, size, size);
        }
      }
    }

    draw();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const every = 1000 / Math.max(1, config.fps);
    let raf = 0;
    let last = performance.now();
    function tick(now: number) {
      if (now - last >= every) {
        last = now;
        draw();
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, config]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 -z-10 size-full ${active ? "" : "hidden"}`}
    />
  );
}
