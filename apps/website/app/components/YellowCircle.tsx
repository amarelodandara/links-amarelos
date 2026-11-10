"use client";

import { useEffect, useRef } from "react";

// Same sweep tuning as ExperimenteSection's button pixel trail
const TRAIL_PIXEL_SIZE = 5;
const TRAIL_SPEED = 1.8;
const TRAIL_FADE = 0.025;
const TRAIL_PAUSE_MS = 2800;
const TRAIL_COLOR = "255,255,255";
const TRAIL_OPACITY = 0.5;
const TRAIL_CURVE_AMP = 10;
const TRAIL_CURVE_FREQ = 0.5;

type YellowCircleProps = {
  filled?: boolean;
  className?: string;
};

type TrailBlock = { col: number; opacity: number };

export default function YellowCircle({
  filled = false,
  className = "",
}: YellowCircleProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!filled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { width: W, height: H } = canvas.getBoundingClientRect();
    canvas.width = W;
    canvas.height = H;
    // Same shape as PixelTrail: `frame` is a hoisted function declaration, so
    // the null-guard narrowing does not reach it. An explicitly typed const
    // carries the type instead of an assertion.
    const maybeCtx = canvas.getContext("2d");
    if (!maybeCtx) return;
    const ctx: CanvasRenderingContext2D = maybeCtx;
    const r = Math.min(W, H) / 2;

    const totalRows = Math.ceil(H / TRAIL_PIXEL_SIZE);
    let head = -TRAIL_PIXEL_SIZE * 2;
    let trail: TrailBlock[] = [];
    let rafId = 0;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;

    const restart = () => {
      head = -TRAIL_PIXEL_SIZE * 2;
      trail = [];
      rafId = requestAnimationFrame(frame);
    };

    function frame() {
      if (stopped) return;

      ctx.clearRect(0, 0, W, H);

      ctx.save();
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, r, 0, Math.PI * 2);
      ctx.clip();

      ctx.fillStyle = "#ffcc00";
      ctx.fillRect(0, 0, W, H);

      head += TRAIL_SPEED;
      const col = Math.floor(head / TRAIL_PIXEL_SIZE);
      if (!trail.length || trail[trail.length - 1].col !== col) {
        trail.push({ col, opacity: TRAIL_OPACITY });
      }
      trail = trail
        .map((b) => ({ ...b, opacity: b.opacity - TRAIL_FADE }))
        .filter((b) => b.opacity > 0);

      for (const b of trail) {
        ctx.fillStyle = `rgba(${TRAIL_COLOR},${b.opacity})`;
        for (let row = 0; row < totalRows; row++) {
          const t = row / totalRows;
          const curveOffset =
            Math.round(
              (Math.sin(t * Math.PI * 2 * TRAIL_CURVE_FREQ) * TRAIL_CURVE_AMP) /
                TRAIL_PIXEL_SIZE,
            ) * TRAIL_PIXEL_SIZE;
          ctx.fillRect(
            b.col * TRAIL_PIXEL_SIZE + curveOffset,
            row * TRAIL_PIXEL_SIZE,
            TRAIL_PIXEL_SIZE,
            TRAIL_PIXEL_SIZE,
          );
        }
      }
      ctx.restore();

      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, r - 0.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      const tailClear = head - (TRAIL_OPACITY / TRAIL_FADE) * TRAIL_PIXEL_SIZE;
      if (tailClear > W) {
        timeoutId = setTimeout(restart, TRAIL_PAUSE_MS);
        return;
      }

      rafId = requestAnimationFrame(frame);
    }

    rafId = requestAnimationFrame(frame);
    return () => {
      stopped = true;
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
    };
  }, [filled]);

  if (!filled) {
    return (
      <div
        className={`rounded-full border border-dashed border-sun-dark ${className}`}
      />
    );
  }

  return <canvas ref={canvasRef} className={`rounded-full ${className}`} />;
}
