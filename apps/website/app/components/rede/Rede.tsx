"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EDGES, HUB_ID, NODES, nodeById, nodePath } from "./graph";
import { LAYERS, PERSPECTIVE, SHOWN, approach, center, curve, exitPoint, layout, poseTransform, quad } from "./scene";
import type { Curve, Placement, Pose, Pt, Viewport } from "./scene";
import Window from "./Window";
import Hud from "./Hud";
import Floats, { SLOTS } from "./Float";
import { RedeContext } from "./context";
import type { Extra, RedeApi } from "./context";
import Field from "./Field";
import { DialRoot } from "dialkit";
import "dialkit/styles.css";
import { HubLookContext, useHubDials, useHudDials, useSceneDials } from "./hubDials";

/**
 * The home: floating windows, three layers deep. The window in focus sits
 * flat at the center; its neighbors hang around it, turned to face it; the
 * rest float far back, small and out of focus. Opening a window brings it to
 * the center and the others fall into place by how many hops away they are.
 *
 * Poses live in refs and are written straight to the DOM every frame, along
 * with the threads between windows. Only the focus is React state.
 */

/** Time constant of the glide toward a new layout, in ms. */
const GLIDE_MS = 140;
/** How far the scene slides under the pointer, in world px at the focus layer. */
const PARALLAX = 18;
/** The glyph field's share of that slide: it sits behind everything. */
const FIELD_PARALLAX = 0.4;
/** Navbar plus footer height, in px: the rings fit between them. */
const BARS = 88;
/** Thread width in screen px. */
const THREAD = 1.5;
const THEME_KEY = "theme";

function saveTheme(value: string): void {
  try {
    window.localStorage.setItem(THEME_KEY, value);
  } catch {
    // Private mode or blocked storage: the choice just won't persist.
  }
}

/** The part of the viewport the rings may use: between the navbar and the footer. */
const room = (v: Viewport): Viewport => ({ width: v.width, height: Math.max(1, v.height - BARS) });

function place(line: SVGLineElement, cx: number, cy: number, p: Pt, q: Pt, alpha: number): void {
  line.setAttribute("x1", (cx + p.x).toFixed(1));
  line.setAttribute("y1", (cy + p.y).toFixed(1));
  line.setAttribute("x2", (cx + q.x).toFixed(1));
  line.setAttribute("y2", (cy + q.y).toFixed(1));
  line.style.opacity = alpha.toFixed(3);
}

const INITIAL = layout(HUB_ID, { width: 1280, height: 800 });

export default function Rede() {
  const viewRef = useRef<HTMLDivElement>(null);
  const windows = useRef(new Map<string, HTMLElement>());
  const sharp = useRef(new Map<string, SVGLineElement>());
  const soft = useRef(new Map<string, SVGLineElement>());

  const vp = useRef<Viewport>({ width: 1280, height: 800 });
  const targets = useRef<Map<string, Placement>>(INITIAL);
  const poses = useRef(new Map<string, Pose>());
  const pointer = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const reduced = useRef(false);

  const [focus, setFocus] = useState(HUB_ID);
  const [placed, setPlaced] = useState(INITIAL);
  const focusRef = useRef(HUB_ID);
  const [extras, setExtras] = useState<readonly Extra[]>([]);
  const extrasRef = useRef<readonly Extra[]>([]);
  const portal = useRef<HTMLDivElement>(null);

  const setOpenExtras = useCallback((next: readonly Extra[]) => {
    extrasRef.current = next;
    setExtras(next);
  }, []);
  const spawn = useCallback(
    (id: Extra) => {
      if (!extrasRef.current.includes(id)) setOpenExtras([...extrasRef.current, id]);
    },
    [setOpenExtras],
  );
  // Scene windows shown outside the visible layers (the about window, from the +).
  const [revealed, setRevealed] = useState<ReadonlySet<string>>(new Set());
  const revealedRef = useRef<ReadonlySet<string>>(new Set());
  const setOpenRevealed = useCallback((next: ReadonlySet<string>) => {
    revealedRef.current = next;
    setRevealed(next);
  }, []);
  const toggleReveal = useCallback(
    (id: string) => {
      const next = new Set(revealedRef.current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        // Start it a little further back and transparent, so it glides into place.
        const t = targets.current.get(id);
        if (t) poses.current.set(id, { ...t.pose, z: t.pose.z - 400, opacity: 0 });
      }
      setOpenRevealed(next);
    },
    [setOpenRevealed],
  );
  // The camera's step back once the intro is done: eased toward `target` in the loop.
  const dolly = useRef({ now: 0, target: 0 });
  const zoom = useRef({ out: 0, ms: 1400 });
  const finishIntro = useCallback(() => {
    dolly.current.target = zoom.current.out;
  }, []);
  const api = useMemo(
    (): RedeApi => ({ spawn, revealed, toggleReveal, finishIntro, portal }),
    [spawn, revealed, toggleReveal, finishIntro],
  );

  // Extra windows (newsletter, podcast) live in the scene too, placed by slot.
  const extraEls = useRef(new Map<Extra, HTMLElement>());
  const registerExtra = useCallback((id: Extra, el: HTMLElement | null) => {
    if (el) extraEls.current.set(id, el);
    else extraEls.current.delete(id);
  }, []);

  // The main window's look, tuned live from a DialKit panel (development only).
  const [replay, setReplay] = useState(0);
  const hubLook = useHubDials(() => setReplay((n) => n + 1), replay);
  const hudLook = useHudDials();
  const scene = useSceneDials();
  // The frame loops read the curve from refs, so a dial change needs no restart.
  const bent = useRef<Curve>(scene.windows);
  const fieldCurve = useRef<Curve>(scene.field);
  useEffect(() => {
    bent.current = scene.windows;
    fieldCurve.current = scene.field;
    zoom.current = { out: scene.zoomOut, ms: scene.zoomMs };
    // Already zoomed out: follow the dial live.
    if (dolly.current.target > 0) dolly.current.target = scene.zoomOut;
  }, [scene.windows, scene.field, scene.zoomOut, scene.zoomMs]);
  const moved = useRef(false);

  const open = useCallback((id: string) => {
    if (!nodeById(id) || id === focusRef.current) return;
    focusRef.current = id;
    moved.current = true;
    targets.current = layout(id, room(vp.current));
    setPlaced(targets.current);
    setFocus(id);
  }, []);

  // After a move, keyboard focus follows into the new center window.
  useEffect(() => {
    if (!moved.current) return;
    document.getElementById(`janela-${focus}`)?.focus({ preventScroll: true });
  }, [focus]);

  /* ── Frame loop ─────────────────────────────────────────────────────── */

  useEffect(() => {
    const maybeView = viewRef.current;
    if (!maybeView) return;
    // Typed binding: the hoisted functions below don't see the narrowing above.
    const view: HTMLDivElement = maybeView;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    reduced.current = motion.matches;
    const onMotion = () => {
      reduced.current = motion.matches;
    };
    motion.addEventListener("change", onMotion);

    function resize() {
      const r = view.getBoundingClientRect();
      vp.current = { width: r.width, height: r.height };
      targets.current = layout(focusRef.current, room(vp.current));
      setPlaced(targets.current);
    }
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(view);

    // The page opens straight on the map: every window starts where it rests.
    for (const [id, t] of targets.current) poses.current.set(id, t.pose);

    let raf = 0;
    let last = performance.now();
    function tick(now: number) {
      const dt = Math.min(64, now - last);
      last = now;
      const k = reduced.current ? 1 : 1 - Math.exp(-dt / GLIDE_MS);
      const pt = pointer.current;
      pt.x += (pt.tx - pt.x) * (reduced.current ? 1 : 1 - Math.exp(-dt / 220));
      pt.y += (pt.ty - pt.y) * (reduced.current ? 1 : 1 - Math.exp(-dt / 220));
      // The zoom eases out over about `ms` (three time constants).
      const dl = dolly.current;
      const zk = reduced.current || zoom.current.ms <= 0 ? 1 : 1 - Math.exp((-dt * 3) / zoom.current.ms);
      dl.now += (dl.target - dl.now) * zk;

      /** A pose as the camera sees it: slid by the pointer, bent onto the curve, pushed back by the zoom. */
      const seen = (p: Pose): Pose => {
        const bentPose = curve({ ...p, x: p.x - pt.x * PARALLAX, y: p.y - pt.y * PARALLAX }, bent.current);
        return { ...bentPose, z: bentPose.z - dl.now };
      };


      const quads = new Map<string, { q: Pt[]; c: Pt; pose: Pose }>();
      for (const [id, t] of targets.current) {
        const prev = poses.current.get(id) ?? t.pose;
        const next = approach(prev, t.pose, k);
        poses.current.set(id, next);
        const shown = seen(next);
        const el = windows.current.get(id);
        if (!el) continue;
        el.style.transform = poseTransform(shown);
        el.style.opacity = next.opacity.toFixed(3);
        el.style.filter = next.blur > 0.05 ? `blur(${next.blur.toFixed(2)}px)` : "none";
        quads.set(id, { q: quad(shown, el.offsetWidth, el.offsetHeight), c: center(shown), pose: next });
      }

      for (const [id, el] of extraEls.current) {
        const slot = SLOTS[id];
        // Keep it on screen: its center no further out than the viewport allows.
        const maxX = Math.max(0, vp.current.width / 2 - el.offsetWidth / 2 - 16);
        const x = Math.max(-maxX, Math.min(maxX, slot.x));
        const flat: Pose = { x, y: slot.y, z: 0, turn: 0, tilt: 0, scale: 1, blur: 0, opacity: 1 };
        el.style.transform = poseTransform(seen(flat));
      }

      const cx = vp.current.width / 2;
      const cy = vp.current.height / 2;
      for (const [a, b] of EDGES) {
        const key = `${a}~${b}`;
        const A = quads.get(a);
        const B = quads.get(b);
        const lineSharp = sharp.current.get(key);
        const lineSoft = soft.current.get(key);
        if (!lineSharp || !lineSoft) continue;
        // A thread to a hidden layer's window is hidden with it.
        if (!A || !B) {
          lineSharp.style.opacity = "0";
          lineSoft.style.opacity = "0";
          continue;
        }
        const p = exitPoint(A.c, B.c, A.q);
        const q = exitPoint(B.c, A.c, B.q);
        // Crossfade a sharp thread into a soft grey one as either end drifts out of focus.
        const haze = Math.min(1, Math.max(A.pose.blur, B.pose.blur) / LAYERS.far.blur);
        const fade = Math.min(A.pose.opacity, B.pose.opacity) / LAYERS.focus.opacity;
        place(lineSharp, cx, cy, p, q, (1 - haze) * fade);
        place(lineSoft, cx, cy, p, q, haze * Math.min(1, fade * 1.6));
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      motion.removeEventListener("change", onMotion);
    };
  }, []);

  /* ── Input ──────────────────────────────────────────────────────────── */

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      // Revealed windows close first; then Esc brings the hub back.
      if (revealedRef.current.size > 0) setOpenRevealed(new Set());
      else if (focusRef.current !== HUB_ID) open(HUB_ID);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpenRevealed]);

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    pointer.current.tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    pointer.current.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
  }

  function onPointerLeave() {
    pointer.current.tx = 0;
    pointer.current.ty = 0;
  }

  /* ── Theme ──────────────────────────────────────────────────────────── */

  function toggleTheme() {
    const html = document.documentElement;
    const current =
      html.dataset.theme ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = current === "dark" ? "light" : "dark";
    html.dataset.theme = next;
    saveTheme(next);
  }

  const register = useCallback((id: string, el: HTMLElement | null) => {
    if (el) windows.current.set(id, el);
    else windows.current.delete(id);
  }, []);

  const focused = nodeById(focus);

  return (
    <RedeContext value={api}>
      <HubLookContext value={hubLook}>
        <div className="rede relative h-dvh w-full overflow-hidden">
          <div
            ref={viewRef}
            className="absolute inset-0"
            style={{ perspective: PERSPECTIVE }}
            onPointerMove={onPointerMove}
            onPointerLeave={onPointerLeave}
          >
            <Field pointer={pointer} slide={PARALLAX * FIELD_PARALLAX} curve={fieldCurve} dolly={dolly} />
            <svg aria-hidden="true" className="absolute inset-0 size-full">
              <defs>
                <filter id="rede-haze" x="-10%" y="-10%" width="120%" height="120%">
                  <feGaussianBlur stdDeviation="1.2" />
                </filter>
              </defs>
              {EDGES.map(([a, b]) => {
                const key = `${a}~${b}`;
                return (
                  <g key={key}>
                    <line
                      ref={(el) => {
                        if (el) soft.current.set(key, el);
                        else soft.current.delete(key);
                      }}
                      stroke="var(--rede-thread-far)"
                      strokeWidth={THREAD * 1.6}
                      filter="url(#rede-haze)"
                      style={{ opacity: 0 }}
                    />
                    <line
                      ref={(el) => {
                        if (el) sharp.current.set(key, el);
                        else sharp.current.delete(key);
                      }}
                      stroke="var(--rede-thread)"
                      strokeWidth={THREAD}
                      style={{ opacity: 0 }}
                    />
                  </g>
                );
              })}
            </svg>
            <nav aria-label="Janelas: páginas, edições e redes" className="rede-stage">
              {NODES.map((node) => {
                const layer = placed.get(node.id)?.layer ?? "far";
                // The hub always shows: it's what the + and the threads lead back to.
                if (!SHOWN.has(layer) && !revealed.has(node.id) && node.id !== HUB_ID) return null;
                return <Window key={node.id} node={node} layer={layer} onOpen={open} register={register} />;
              })}
            </nav>
            <Floats open={extras} register={registerExtra} />
          </div>


          <div ref={portal} />
          <Hud look={hudLook} status={focused ? nodePath(focused) : ""} atHub={focus === HUB_ID} onHome={() => open(HUB_ID)} onToggleTheme={toggleTheme} />
        </div>
        <DialRoot position="top-right" />
      </HubLookContext>
    </RedeContext>
  );
}
