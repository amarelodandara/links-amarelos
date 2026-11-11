"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { NODES, nodeById, nodeHref, nodeTitle } from "./graph";
import type { RedeNode } from "./graph";
import { FOCUS_ZOOM, clampCamera, easeOut, mix, overview, worldTransform, zoomAt } from "./camera";
import type { Camera, Viewport } from "./camera";
import { drawField } from "./field";
import type { FieldStyle } from "./field";
import Lines from "./Lines";
import Station from "./Station";
import Hud from "./Hud";
import Panel from "./Panel";
import Boot from "./Boot";

/**
 * The home: a network you walk around, three layers deep.
 * - back: the field (dots and pixel glyphs), on a canvas pushed back in z;
 * - middle: metro lines on the plane and stations lifted off it;
 * - front: the HUD and the detail panel, fixed to the screen.
 *
 * The camera lives in refs and is written straight to the DOM every frame,
 * so dragging never re-renders React. Only the selection is state.
 */

const PERSPECTIVE = 1400;
/** Max tilt toward the pointer, in degrees. */
const TILT = 4;
const FLY_MS = 700;
/** A press that moves less than this is a click, not a drag. */
const DRAG_SLOP = 5;
const PAN_STEP = 80;
const BOOT_KEY = "rede-boot";
const THEME_KEY = "theme";
/** Width the side panel takes on wide screens, so a selected station sits beside it. */
const PANEL_ROOM = 404;

type Flight = { from: Camera; to: Camera; start: number };
type Press = { id: number; x: number; y: number };

function readSession(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(storage: "local" | "session", key: string, value: string): void {
  try {
    (storage === "local" ? window.localStorage : window.sessionStorage).setItem(key, value);
  } catch {
    // Private mode or blocked storage: the choice just won't persist.
  }
}

const subscribeNever = () => () => {};

/** First visit this session, and motion allowed. Read once: later writes don't re-show it. */
function wantsBoot(): boolean {
  return readSession(BOOT_KEY) === null && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function Rede() {
  const rootRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const statusRef = useRef<HTMLSpanElement>(null);

  const vp = useRef<Viewport>({ width: 1, height: 1 });
  const cam = useRef<Camera>({ x: 0, y: 0, zoom: 1 });
  const flight = useRef<Flight | null>(null);
  const tilt = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const presses = useRef(new Map<number, Press>());
  const dragged = useRef(false);
  const pinch = useRef(0);
  const reduced = useRef(false);
  const stations = useRef(new Map<string, HTMLAnchorElement>());
  const fieldStyle = useRef<FieldStyle>({ color: "#110a03", font: "monospace" });

  const [selected, setSelected] = useState<string | null>(null);
  const [shown, setShown] = useState<RedeNode | null>(null);
  const [bootDone, setBootDone] = useState(false);
  const selectedRef = useRef<string | null>(null);

  /* ── Camera ─────────────────────────────────────────────────────────── */

  const flyTo = useCallback((to: Camera) => {
    const target = clampCamera(to);
    if (reduced.current) {
      cam.current = target;
      flight.current = null;
      return;
    }
    flight.current = { from: cam.current, to: target, start: performance.now() };
  }, []);

  /** Camera that frames a station, leaving room for the panel when one opens. */
  const frame = useCallback((node: RedeNode, withPanel: boolean): Camera => {
    const zoom = Math.max(cam.current.zoom, FOCUS_ZOOM);
    const wide = vp.current.width > 640;
    if (!withPanel) return { x: node.at.x, y: node.at.y, zoom };
    return wide
      ? { x: node.at.x + PANEL_ROOM / 2 / zoom, y: node.at.y, zoom }
      : { x: node.at.x, y: node.at.y + (vp.current.height * 0.2) / zoom, zoom };
  }, []);

  const select = useCallback(
    (id: string | null) => {
      selectedRef.current = id;
      setSelected(id);
      const node = id === null ? undefined : nodeById(id);
      if (node) {
        setShown(node);
        flyTo(frame(node, true));
      } else {
        flyTo(overview(vp.current));
      }
    },
    [flyTo, frame],
  );

  /* ── Frame loop ─────────────────────────────────────────────────────── */

  useEffect(() => {
    const view = viewRef.current;
    const maybeCanvas = canvasRef.current;
    const root = rootRef.current;
    if (!view || !maybeCanvas || !root) return;
    // Typed binding: the hoisted resize() below doesn't see the narrowing above.
    const canvas: HTMLCanvasElement = maybeCanvas;
    const maybeCtx = canvas.getContext("2d");
    if (!maybeCtx) return;
    const ctx: CanvasRenderingContext2D = maybeCtx;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    reduced.current = motion.matches;
    const onMotion = () => {
      reduced.current = motion.matches;
    };
    motion.addEventListener("change", onMotion);

    function readStyle(el: HTMLElement) {
      const css = getComputedStyle(el);
      fieldStyle.current = {
        color: css.getPropertyValue("--rede-field").trim() || "#110a03",
        font: css.getPropertyValue("--font-geist-pixel-square").trim() || "monospace",
      };
    }
    readStyle(root);
    const themeWatch = new MutationObserver(() => readStyle(root));
    themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const scheme = window.matchMedia("(prefers-color-scheme: dark)");
    const onScheme = () => readStyle(root);
    scheme.addEventListener("change", onScheme);

    function resize(el: HTMLElement) {
      const r = el.getBoundingClientRect();
      vp.current = { width: r.width, height: r.height };
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize(view);
    cam.current = overview(vp.current);
    const observer = new ResizeObserver(() => resize(view));
    observer.observe(view);

    let raf = 0;
    const started = performance.now();
    function tick(now: number) {
      const f = flight.current;
      if (f) {
        const t = Math.min(1, (now - f.start) / FLY_MS);
        cam.current = mix(f.from, f.to, easeOut(t));
        if (t >= 1) flight.current = null;
      }
      const tl = tilt.current;
      tl.x += (tl.tx - tl.x) * 0.08;
      tl.y += (tl.ty - tl.y) * 0.08;

      const c = cam.current;
      const world = worldRef.current;
      if (world) world.style.transform = worldTransform(c, vp.current);
      const tiltEl = tiltRef.current;
      if (tiltEl) tiltEl.style.transform = `rotateX(${tl.y.toFixed(3)}deg) rotateY(${tl.x.toFixed(3)}deg)`;
      drawField(ctx, vp.current, c, reduced.current ? 0 : (now - started) / 1000, fieldStyle.current);

      const status = statusRef.current;
      if (status) {
        const sel = selectedRef.current === null ? undefined : nodeById(selectedRef.current);
        const where = sel ? ` · ${sel.kind === "page" ? nodeHref(sel) : nodeTitle(sel)}` : "";
        status.textContent = `x ${Math.round(c.x)} · y ${Math.round(c.y)} · zoom ${c.zoom.toFixed(2)}${where}`;
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      themeWatch.disconnect();
      scheme.removeEventListener("change", onScheme);
      motion.removeEventListener("change", onMotion);
    };
  }, []);

  /* ── Boot, once per session ─────────────────────────────────────────── */

  // Server and hydration render no boot; the client then decides from storage.
  const shouldBoot = useSyncExternalStore(subscribeNever, wantsBoot, () => false);
  const booting = shouldBoot && !bootDone;

  useEffect(() => {
    // Start zoomed out, so the network arrives as the log clears.
    if (shouldBoot) cam.current = { ...cam.current, zoom: cam.current.zoom * 0.55 };
  }, [shouldBoot]);

  const bootEnded = useRef(false);
  const endBoot = useCallback(() => {
    // Skipping and the timer can both call this; only the first counts.
    if (bootEnded.current) return;
    bootEnded.current = true;
    writeStorage("session", BOOT_KEY, "1");
    flyTo(overview(vp.current));
    setBootDone(true);
  }, [flyTo]);

  /* ── Input: drag, pinch, wheel, keys, tilt ──────────────────────────── */

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const el: HTMLDivElement = view;

    function onWheel(e: WheelEvent) {
      e.preventDefault();
      flight.current = null;
      const r = el.getBoundingClientRect();
      const factor = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015));
      cam.current = zoomAt(cam.current, vp.current, { x: e.clientX - r.left, y: e.clientY - r.top }, factor);
    }

    function onKey(e: KeyboardEvent) {
      const target = e.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
      const c = cam.current;
      const step = PAN_STEP / c.zoom;
      const center = { x: vp.current.width / 2, y: vp.current.height / 2 };
      switch (e.key) {
        case "ArrowLeft":
          flyTo({ ...c, x: c.x - step });
          break;
        case "ArrowRight":
          flyTo({ ...c, x: c.x + step });
          break;
        case "ArrowUp":
          flyTo({ ...c, y: c.y - step });
          break;
        case "ArrowDown":
          flyTo({ ...c, y: c.y + step });
          break;
        case "+":
        case "=":
          flyTo(zoomAt(c, vp.current, center, 1.25));
          break;
        case "-":
          flyTo(zoomAt(c, vp.current, center, 0.8));
          break;
        case "0":
          flyTo(overview(vp.current));
          break;
        case "Escape":
          if (selectedRef.current !== null) select(null);
          return;
        default:
          return;
      }
      e.preventDefault();
    }

    el.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    return () => {
      el.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
    };
  }, [flyTo, select]);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    presses.current.set(e.pointerId, { id: e.pointerId, x: e.clientX, y: e.clientY });
    dragged.current = false;
    pinch.current = 0;
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    if (e.pointerType === "mouse" && !reduced.current) {
      tilt.current.tx = ((e.clientX - r.left) / r.width - 0.5) * 2 * TILT;
      tilt.current.ty = -((e.clientY - r.top) / r.height - 0.5) * 2 * TILT;
    }
    const prev = presses.current.get(e.pointerId);
    if (!prev) return;
    const all = [...presses.current.values()];

    if (all.length >= 2) {
      const other = all.find((p) => p.id !== e.pointerId);
      if (!other) return;
      const dist = Math.hypot(e.clientX - other.x, e.clientY - other.y);
      if (pinch.current > 0) {
        const mid = { x: (e.clientX + other.x) / 2 - r.left, y: (e.clientY + other.y) / 2 - r.top };
        cam.current = zoomAt(cam.current, vp.current, mid, dist / pinch.current);
      }
      pinch.current = dist;
      dragged.current = true;
    } else {
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      if (!dragged.current && Math.hypot(dx, dy) < DRAG_SLOP) return;
      if (!dragged.current) {
        dragged.current = true;
        flight.current = null;
        // Capture only once it's a drag, so a plain click still lands on the station.
        e.currentTarget.setPointerCapture(e.pointerId);
      }
      const c = cam.current;
      cam.current = clampCamera({ ...c, x: c.x - dx / c.zoom, y: c.y - dy / c.zoom });
    }
    presses.current.set(e.pointerId, { id: e.pointerId, x: e.clientX, y: e.clientY });
  }

  function onPointerEnd(e: React.PointerEvent<HTMLDivElement>) {
    presses.current.delete(e.pointerId);
    pinch.current = 0;
  }

  function onPointerLeave() {
    tilt.current.tx = 0;
    tilt.current.ty = 0;
  }

  /* ── Theme ──────────────────────────────────────────────────────────── */

  function toggleTheme() {
    const html = document.documentElement;
    const current =
      html.dataset.theme ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = current === "dark" ? "light" : "dark";
    html.dataset.theme = next;
    writeStorage("local", THEME_KEY, next);
  }

  const register = useCallback((id: string, el: HTMLAnchorElement | null) => {
    if (el) stations.current.set(id, el);
    else stations.current.delete(id);
  }, []);

  const focusFly = useCallback(
    (id: string) => {
      const node = nodeById(id);
      if (node) flyTo(frame(node, selectedRef.current !== null));
    },
    [flyTo, frame],
  );

  return (
    <div ref={rootRef} className="rede relative h-dvh w-full overflow-hidden">
      <div
        ref={viewRef}
        className="absolute inset-0 cursor-grab touch-none select-none active:cursor-grabbing"
        style={{ perspective: PERSPECTIVE }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onPointerLeave={onPointerLeave}
        onClickCapture={(e) => {
          // A drag that ends over a station must not open it.
          if (dragged.current) {
            e.preventDefault();
            e.stopPropagation();
            dragged.current = false;
          }
        }}
      >
        <div ref={tiltRef} className="rede-tilt">
          <canvas ref={canvasRef} aria-hidden="true" className="rede-field" />
          <div ref={worldRef} className="rede-world">
            <Lines />
            <nav aria-label="Rede de páginas, edições e redes">
              {NODES.map((node) => (
                <Station
                  key={node.id}
                  node={node}
                  selected={selected === node.id}
                  onSelect={select}
                  onFocusVisible={focusFly}
                  register={register}
                />
              ))}
            </nav>
          </div>
        </div>
      </div>

      <Hud statusRef={statusRef} onToggleTheme={toggleTheme} />
      <Panel
        node={shown}
        open={selected !== null}
        onClose={() => select(null)}
        returnFocus={() => (shown ? (stations.current.get(shown.id) ?? null) : null)}
        container={rootRef}
      />
      {booting && <Boot onDone={endBoot} />}
    </div>
  );
}
