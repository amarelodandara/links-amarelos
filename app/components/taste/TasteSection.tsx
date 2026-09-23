"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Link } from "../../data/links";
import { pickTaste } from "../../data/links";
import { PILL_BASE } from "../SectionPill";
import HoldButton from "./HoldButton";
import LinkDot from "./LinkDot";
import TasteEnding from "./TasteEnding";
import type { Sim, View } from "./field";
import {
  createSim,
  drawField,
  makeView,
  spawnBody,
  startCollapse,
  step,
} from "./field";

// Enough for the field to visibly strain, few enough to finish.
const TASTE_COUNT = 7;
// A beat between the last link settling and the field giving way, so the
// last card can be seen.
const COLLAPSE_DELAY_MS = 1100;
// LinkDot renders at size-8; the loop scales it to the projected radius.
const DOT_HALF = 16;
const VISITED_KEY = "taste:visited";

type Phase = "tasting" | "collapsing" | "ended";

// Visited ids persist per browser as a comma-joined string. Storage can be
// missing or throw (private mode, blocked site data, the server); every path
// falls back to "nothing visited".
function readVisited(): Set<string> {
  try {
    const raw = localStorage.getItem(VISITED_KEY);
    return new Set(raw ? raw.split(",") : []);
  } catch {
    return new Set();
  }
}
function writeVisited(ids: Set<string>): void {
  try {
    localStorage.setItem(VISITED_KEY, [...ids].join(","));
  } catch {
    // Remembering visits is a convenience; losing it is fine.
  }
}

/** "Prove os links": hold the button, links fall onto a space-time sheet and
 *  dent it, and after the last one the sheet collapses into a singularity
 *  and hands the stage to the newsletter and podcast. */
export default function TasteSection() {
  const [released, setReleased] = useState<Link[]>([]);
  const [phase, setPhase] = useState<Phase>("tasting");
  const [openId, setOpenId] = useState<string | null>(null);
  const [visited, setVisited] = useState<Set<string>>(readVisited);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const simRef = useRef<Sim | null>(null);
  const viewRef = useRef<View>(makeView(1, 1));
  const dotsRef = useRef(new Map<string, HTMLButtonElement>());
  // The sample is drawn on the first hold, not during render, so the server
  // and client never disagree about it.
  const poolRef = useRef<Link[] | null>(null);
  const settledRef = useRef(new Set<string>());
  const collapseTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  const onSettled = useCallback((id: string) => {
    if (settledRef.current.has(id)) return;
    settledRef.current.add(id);
    // The newest link introduces itself.
    setOpenId(id);
    if (settledRef.current.size < TASTE_COUNT) return;
    collapseTimerRef.current = setTimeout(() => {
      const sim = simRef.current;
      if (!sim) return;
      startCollapse(sim);
      setOpenId(null);
      setPhase("collapsing");
    }, COLLAPSE_DELAY_MS);
  }, []);

  // The loop reads the latest handler without restarting.
  const onSettledRef = useRef(onSettled);
  useEffect(() => {
    onSettledRef.current = onSettled;
  });

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;
    const maybeCtx = canvas.getContext("2d");
    if (!maybeCtx) return;
    // `frame` is a hoisted declaration; see CLAUDE.md on canvas narrowing.
    const ctx: CanvasRenderingContext2D = maybeCtx;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    simRef.current = createSim(reducedMotion);
    const ink =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--brand-black")
        .trim() || "#110a03";

    const resize = () => {
      const { width, height } = stage.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      viewRef.current = makeView(width, height);
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(stage);

    let rafId = 0;
    let last = 0;
    function frame(now: number) {
      const sim = simRef.current;
      if (!sim) return;
      // Clamp so a backgrounded tab does not return with one giant step.
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;

      const view = viewRef.current;
      for (const event of step(sim, view, dt)) {
        if (event.kind === "settled") onSettledRef.current(event.id);
        if (event.kind === "dissipated") setPhase("ended");
      }
      drawField(ctx, sim, view, ink);

      for (const body of sim.bodies) {
        const dot = dotsRef.current.get(body.id);
        if (!dot) continue;
        dot.style.transform = `translate(${body.sx - DOT_HALF}px, ${body.sy - DOT_HALF}px) scale(${body.sr / DOT_HALF})`;
        dot.style.opacity = String(body.opacity);
        // Nearer links overlap farther ones.
        dot.style.zIndex = String(Math.round(100 - body.z * 10));
        // A link in flight passes over the button; it must not swallow the
        // next press. Only a link at rest can be hovered or tapped.
        dot.style.pointerEvents = body.kind === "resting" ? "auto" : "none";
      }

      rafId = requestAnimationFrame(frame);
    }

    // Only run while the section can be seen.
    const visibility = new IntersectionObserver(([entry]) => {
      cancelAnimationFrame(rafId);
      if (entry?.isIntersecting) {
        last = 0;
        rafId = requestAnimationFrame(frame);
      }
    });
    visibility.observe(stage);

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      visibility.disconnect();
      clearTimeout(collapseTimerRef.current);
    };
  }, []);

  const onHoldProgress = useCallback((progress: number) => {
    // The inner-edge fade follows the charge on a steep curve: barely there
    // for most of the hold, then rushing in right before the link drops.
    stageRef.current?.style.setProperty("--fade", String(progress ** 3));
  }, []);

  const onHoldComplete = () => {
    const sim = simRef.current;
    if (!sim || phase !== "tasting") return;
    poolRef.current ??= pickTaste(TASTE_COUNT);
    const link = poolRef.current[released.length];
    if (!link) return;
    setReleased((current) => [...current, link]);
    spawnBody(sim, viewRef.current, link.id);
  };

  const onVisit = (id: string) => {
    setOpenId(null);
    setVisited((current) => {
      const next = new Set(current).add(id);
      writeVisited(next);
      return next;
    });
  };

  const again = () => {
    clearTimeout(collapseTimerRef.current);
    const sim = simRef.current;
    simRef.current = createSim(sim ? sim.reducedMotion : false);
    poolRef.current = null;
    settledRef.current = new Set();
    dotsRef.current.clear();
    setReleased([]);
    setOpenId(null);
    setPhase("tasting");
  };

  const remaining = TASTE_COUNT - released.length;

  return (
    <section aria-labelledby="taste-title" className="taste-bleed">
      <div
        ref={stageRef}
        className="taste-stage relative h-[min(100svh,760px)] min-h-[540px] overflow-hidden bg-sun-lighter"
      >
        {/* Back to front: field, edge fade, button, links + cards. */}
        <canvas
          ref={canvasRef}
          aria-hidden
          className="absolute inset-0 size-full"
        />
        <div
          aria-hidden
          className="taste-vignette pointer-events-none absolute inset-0"
        />

        <div className="relative mx-auto flex h-full max-w-4xl flex-col px-4 pt-6">
          <p className={`${PILL_BASE} bg-black/5 border-brand-black/40 text-brand-black`}>
            prove
          </p>
          <h2
            id="taste-title"
            className="mt-3 max-w-sm font-manrope text-xl font-semibold leading-snug tracking-tight"
          >
            uma provinha da curadoria, direto do forno
          </h2>

          {phase !== "ended" && (
            <div className="absolute top-[34%] left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-3">
              <HoldButton
                disabled={phase !== "tasting" || remaining === 0}
                onComplete={onHoldComplete}
                onProgress={onHoldProgress}
              >
                segure para provar
              </HoldButton>
              <p
                aria-live="polite"
                className={`${PILL_BASE} whitespace-nowrap bg-brand-white border-brand-black/40 text-brand-black transition-[translate,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  released.length > 0
                    ? "translate-x-0 opacity-100"
                    : "pointer-events-none -translate-x-3 opacity-0"
                }`}
              >
                {remaining === 1
                  ? "1 link restante"
                  : `${remaining} links restantes`}
              </p>
            </div>
          )}
        </div>

        <div className="pointer-events-none absolute inset-0">
          {released.map((link) => (
            <LinkDot
              key={link.id}
              link={link}
              open={openId === link.id}
              visited={visited.has(link.id)}
              interactive={phase === "tasting"}
              onOpenChange={(open) =>
                setOpenId((current) =>
                  open ? link.id : current === link.id ? null : current,
                )
              }
              onVisit={() => onVisit(link.id)}
              dotRef={(element) => {
                if (element) dotsRef.current.set(link.id, element);
                else dotsRef.current.delete(link.id);
              }}
            />
          ))}
        </div>

        {phase === "ended" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <TasteEnding onAgain={again} />
          </div>
        )}
      </div>
    </section>
  );
}
