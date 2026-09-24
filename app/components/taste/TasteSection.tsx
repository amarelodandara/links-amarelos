"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { Link } from "../../data/links";
import { pickTaste } from "../../data/links";
import HoldButton from "./HoldButton";
import LinkDot from "./LinkDot";
import TasteEnding from "./TasteEnding";
import type { Sim } from "./field";
import { createSim, spawnBody, startCollapse, step } from "./field";
import type { TasteScene } from "./scene";
import { createTasteScene } from "./scene";
import type { Tuning } from "./tuning";
import { TUNING_DEFAULTS, readTuning } from "./tuning";

// Enough for the field to visibly strain, few enough to finish.
const TASTE_COUNT = 7;
// A beat between the last link settling and the field giving way, so the
// last card can be seen.
const COLLAPSE_DELAY_MS = 1100;
// LinkDot renders at size-8; the loop scales it to the projected radius.
const DOT_HALF = 16;
const VISITED_KEY = "taste:visited";
// The field's tuning panel ships only in `next dev`, and renders only on
// the client: its values come from storage.
const TUNING = process.env.NODE_ENV === "development";
const TuningPanel = dynamic(() => import("./TuningPanel"), { ssr: false });

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
  const [tuning, setTuning] = useState<Tuning>(() =>
    TUNING ? readTuning() : TUNING_DEFAULTS,
  );

  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const simRef = useRef<Sim | null>(null);
  const sceneRef = useRef<TasteScene | null>(null);
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

  // The loop reads the latest handler and visited set without restarting.
  const onSettledRef = useRef(onSettled);
  const visitedRef = useRef(visited);
  const tuningRef = useRef(tuning);
  useEffect(() => {
    onSettledRef.current = onSettled;
    visitedRef.current = visited;
    tuningRef.current = tuning;
  });

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    simRef.current = createSim(reducedMotion, tuningRef.current.field);
    const taste = createTasteScene(canvas, tuningRef.current.view);
    sceneRef.current = taste;

    const resize = () => {
      const { width, height } = stage.getBoundingClientRect();
      taste.resize(width, height);
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

      for (const event of step(sim, dt)) {
        if (event.kind === "settled") onSettledRef.current(event.id);
        if (event.kind === "dissipated") setPhase("ended");
      }
      const placements = taste.render(sim, visitedRef.current);

      // The spheres are drawn in WebGL; each link's DOM button is an
      // invisible hit target laid over its sphere, for the cards, focus and
      // screen readers.
      for (const body of sim.bodies) {
        const dot = dotsRef.current.get(body.id);
        const place = placements.get(body.id);
        if (!dot || !place) continue;
        dot.style.transform = `translate(${place.sx - DOT_HALF}px, ${place.sy - DOT_HALF}px) scale(${place.sr / DOT_HALF})`;
        dot.style.opacity = String(place.opacity);
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
      taste.dispose();
      sceneRef.current = null;
    };
  }, []);

  // Scroll grow: the stage starts clipped to the page column and opens to
  // full width by the time its top reaches the top of the viewport. The
  // range is measured from where the section actually sits: if it is already
  // on screen when the page opens, growth starts at scroll 0 so it begins
  // flush with the column instead of half-grown.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      stage.style.setProperty("--grow", "1");
      return;
    }

    let start = 0;
    let end = 1;
    const measure = () => {
      const top = stage.getBoundingClientRect().top + window.scrollY;
      start = Math.max(0, top - window.innerHeight);
      end = Math.max(start + 1, top);
    };
    let rafId = 0;
    const update = () => {
      rafId = 0;
      const t = (window.scrollY - start) / (end - start);
      stage.style.setProperty("--grow", String(Math.min(1, Math.max(0, t))));
    };
    const schedule = () => {
      if (!rafId) rafId = requestAnimationFrame(update);
    };
    const remeasure = () => {
      measure();
      schedule();
    };

    remeasure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", remeasure);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", remeasure);
    };
  }, []);

  const onHoldProgress = useCallback((progress: number) => {
    // The inner-edge fade follows the charge on a steep curve: barely there
    // for most of the hold, then rushing in right before the link drops.
    stageRef.current?.style.setProperty("--fade", String(progress ** 3));
  }, []);

  const onHoldComplete = () => {
    const sim = simRef.current;
    const taste = sceneRef.current;
    if (!sim || !taste || phase !== "tasting") return;
    poolRef.current ??= pickTaste(TASTE_COUNT);
    const link = poolRef.current[released.length];
    if (!link) return;
    setReleased((current) => [...current, link]);
    spawnBody(sim, link.id, taste.startHeight);
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
    simRef.current = createSim(sim ? sim.reducedMotion : false, tuning.field);
    poolRef.current = null;
    settledRef.current = new Set();
    dotsRef.current.clear();
    setReleased([]);
    setOpenId(null);
    setPhase("tasting");
  };

  const retune = (tune: Tuning) => {
    if (simRef.current) simRef.current.tune = tune.field;
    sceneRef.current?.setView(tune.view);
    setTuning(tune);
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
        <div aria-hidden className="taste-frame" />

        {/* Copy comes back once the animation is nailed; the heading stays
            for screen readers so the section keeps its name. */}
        <h2 id="taste-title" className="sr-only">
          prove os links amarelos
        </h2>

        {phase !== "ended" && (
          <div className="absolute top-[34%] left-1/2 -translate-x-1/2 -translate-y-1/2">
            <HoldButton
              disabled={phase !== "tasting" || remaining === 0}
              onComplete={onHoldComplete}
              onProgress={onHoldProgress}
            >
              segure para provar
            </HoldButton>
            {/* Links left, pinned to the button's corner. Pops in after the
                first link drops. */}
            <p
              aria-live="polite"
              className={`absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full border border-brand-black bg-(--sun) font-space-mono text-xs font-bold text-brand-black transition-[scale,opacity] duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                released.length > 0
                  ? "scale-100 opacity-100"
                  : "pointer-events-none scale-0 opacity-0"
              }`}
            >
              <span className="sr-only">links restantes: </span>
              {remaining}
            </p>
          </div>
        )}

        <div className="pointer-events-none absolute inset-0">
          {released.map((link) => (
            <LinkDot
              key={link.id}
              link={link}
              open={openId === link.id}
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

      {/* Outside the stage: its clip-path would cut a fixed panel off. */}
      {TUNING && (
        <TuningPanel
          tune={tuning}
          onChange={retune}
          onDrop={onHoldComplete}
          onRestart={again}
        />
      )}
    </section>
  );
}
