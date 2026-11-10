import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { PointerEvent, ReactNode } from "react";
import { ButtonGroup, SelectControl, Slider, TextControl, Toggle } from "dialkit";
import {
  CURSOR_IDS,
  DEFAULT_CRAYON,
  DEFAULT_GLOBE,
  LINE_CAPS,
  LOGO_GRID,
  LOGO_STYLES,
  Logo,
  SUN_RADIUS,
  CURSOR_PIXEL,
  PRESETS,
  angleAt,
  orbitPoint,
} from "@links/brand/logo";
import type { CrayonSun, GlobeLines, LogoConfig, LogoPreset } from "@links/brand/logo";
import { COLOR_NAMES } from "@links/brand";
import { serializePresets } from "./serialize";

/** What the logo frame sits on: test surfaces, never part of the logo. */
const SURFACES = ["white", "sun-lighter", "sun", "code", "brand-black"] as const;
type Surface = (typeof SURFACES)[number];

/** The parameter frames, in reading order. Each one links to the logo frame. */
const FRAMES = ["presets", "sun", "orbit", "cursor", "backdrop", "view"] as const;
type FrameId = (typeof FRAMES)[number] | "logo";

type Link = { x1: number; y1: number; x2: number; y2: number };

/** A free id derived from `base`: base-2, base-3… */
function freshId(presets: readonly LogoPreset[], base: string): string {
  let n = 2;
  while (presets.some((p) => p.id === `${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

const round = (n: number, places = 1): number => Math.round(n * 10 ** places) / 10 ** places;

/** Where the segment from a's center towards b's center leaves rectangle a. */
function exitPoint(a: DOMRect, b: DOMRect, origin: DOMRect): [number, number] {
  const ax = a.left + a.width / 2;
  const ay = a.top + a.height / 2;
  const dx = b.left + b.width / 2 - ax;
  const dy = b.top + b.height / 2 - ay;
  const t = Math.min(
    dx === 0 ? Infinity : a.width / 2 / Math.abs(dx),
    dy === 0 ? Infinity : a.height / 2 / Math.abs(dy),
  );
  return [ax + dx * t - origin.left, ay + dy * t - origin.top];
}

/** Every 100 units of the 1000 grid; the center axes heavier. Playground only. */
const GRID_STEPS = Array.from({ length: 11 }, (_, i) => i * 100);

function GridOverlay() {
  return (
    <g className="grid-overlay">
      {GRID_STEPS.map((v) => (
        <g key={v} data-axis={v === LOGO_GRID / 2 ? "center" : undefined}>
          <line x1={v} y1={0} x2={v} y2={LOGO_GRID} />
          <line x1={0} y1={v} x2={LOGO_GRID} y2={v} />
          {v > 0 && v < LOGO_GRID && (
            <>
              <text x={v + 6} y={22}>{v}</text>
              <text x={6} y={v - 6}>{v}</text>
            </>
          )}
        </g>
      ))}
    </g>
  );
}

export function App() {
  const [presets, setPresets] = useState<LogoPreset[]>(PRESETS);
  const [selectedId, setSelectedId] = useState(PRESETS[0].id);
  const [label, setLabel] = useState(PRESETS[0].label);
  const [config, setConfig] = useState<LogoConfig>(PRESETS[0].config);
  const [guide, setGuide] = useState(true);
  // Globe settings survive a trip to flat and back.
  const [lastGlobe, setLastGlobe] = useState<GlobeLines>(DEFAULT_GLOBE);
  const [lastCrayon, setLastCrayon] = useState<CrayonSun>(DEFAULT_CRAYON);
  const [showGrid, setShowGrid] = useState(true);
  const [surface, setSurface] = useState<Surface>("white");
  const [spin, setSpin] = useState(false);
  const [speed, setSpeed] = useState(45);
  const [status, setStatus] = useState("");
  const [links, setLinks] = useState<Link[]>([]);

  const boardRef = useRef<HTMLDivElement | null>(null);
  const frameRefs = useRef(new Map<FrameId, HTMLElement>());
  const dragRef = useRef<SVGSVGElement | null>(null);
  const dragging = useRef(false);

  const selected = presets.find((p) => p.id === selectedId) ?? presets[0];
  const edited: LogoPreset = { id: selected.id, label, cursors: selected.cursors, config };
  const dirty = JSON.stringify(edited) !== JSON.stringify(selected);
  const tip = orbitPoint(config);

  function setGlobe(patch: Partial<GlobeLines>) {
    setConfig((c) => (c.style.kind === "globe" ? { ...c, style: { ...c.style, ...patch } } : c));
  }

  function setCrayon(patch: Partial<CrayonSun>) {
    setConfig((c) => (c.style.kind === "crayon" ? { ...c, style: { ...c.style, ...patch } } : c));
  }

  function pick(preset: LogoPreset) {
    setSelectedId(preset.id);
    setLabel(preset.label);
    setConfig(preset.config);
    setStatus("");
  }

  async function save() {
    const next = presets.map((p) => (p.id === selected.id ? edited : p));
    setStatus("saving…");
    const res = await fetch("/__logo/presets", { method: "POST", body: serializePresets(next) });
    setPresets(next);
    setStatus(res.ok ? "saved to presets.ts" : `save failed (${res.status})`);
  }

  function duplicate() {
    const copy: LogoPreset = { ...edited, id: freshId(presets, selected.id), label: `${label} 2` };
    setPresets([...presets, copy]);
    pick(copy);
    setStatus("duplicated, save to keep it");
  }

  // Spin: walk the cursor along the orbit every frame.
  useEffect(() => {
    if (!spin) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const step = (speed * (now - last)) / 1000;
      last = now;
      setConfig((c) => ({
        ...c,
        orbit: { ...c.orbit, angle: round((((c.orbit.angle + step) % 360) + 360) % 360) },
      }));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [spin, speed]);

  // The connecting lines: measured from the frames, redrawn on resize.
  useLayoutEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const measure = () => {
      const origin = board.getBoundingClientRect();
      const logo = frameRefs.current.get("logo")?.getBoundingClientRect();
      if (!logo) return;
      const next: Link[] = [];
      for (const id of FRAMES) {
        const rect = frameRefs.current.get(id)?.getBoundingClientRect();
        if (!rect) continue;
        const [x1, y1] = exitPoint(rect, logo, origin);
        const [x2, y2] = exitPoint(logo, rect, origin);
        next.push({ x1, y1, x2, y2 });
      }
      setLinks(next);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(board);
    for (const el of frameRefs.current.values()) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function dragTo(event: PointerEvent<SVGSVGElement>) {
    const matrix = dragRef.current?.getScreenCTM();
    if (!matrix) return;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    setConfig((c) => ({ ...c, orbit: { ...c.orbit, angle: round(angleAt(c, point.x, point.y)) } }));
  }

  const frameRef = (id: FrameId) => (el: HTMLElement | null) => {
    if (el) frameRefs.current.set(id, el);
    else frameRefs.current.delete(id);
  };

  const frame = (id: (typeof FRAMES)[number], title: string, children: ReactNode) => (
    <figure className="node" data-frame={id}>
      <div className="frame dialkit-root" data-theme="light" ref={frameRef(id)}>
        <p className="frame-title">{title}</p>
        {children}
      </div>
      <figcaption>{String(FRAMES.indexOf(id) + 1).padStart(2, "0")}</figcaption>
    </figure>
  );

  return (
    <main className="board" ref={boardRef}>
      <svg className="links" aria-hidden>
        {links.map((l, i) => (
          <g key={FRAMES[i]}>
            <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />
            <circle cx={l.x1} cy={l.y1} r={4} />
            <circle cx={l.x2} cy={l.y2} r={4} />
          </g>
        ))}
      </svg>

      <header className="masthead">
        <p>
          crayola / logo · <a href="./specimens.html">specimens →</a>
        </p>
        <p>
          {label}
          {dirty ? " · unsaved" : ""}
          {status ? ` · ${status}` : ""}
        </p>
      </header>

      <figure className="node" data-frame="logo">
        <div className="frame frame-logo" data-surface={surface} ref={frameRef("logo")}>
          <Logo config={config} showOrbit={guide} title={label} className="stage" />
          <svg
            className="drag-layer"
            viewBox={`0 0 ${LOGO_GRID} ${LOGO_GRID}`}
            ref={dragRef}
            aria-hidden
            onPointerDown={(e) => {
              dragging.current = true;
              e.currentTarget.setPointerCapture(e.pointerId);
              dragTo(e);
            }}
            onPointerMove={(e) => {
              if (dragging.current) dragTo(e);
            }}
            onPointerUp={() => {
              dragging.current = false;
            }}
          >
            {showGrid && <GridOverlay />}
          </svg>
          <span className="crosshair" data-corner="tl" />
          <span className="crosshair" data-corner="tr" />
          <span className="crosshair" data-corner="bl" />
          <span className="crosshair" data-corner="br" />
        </div>
        <figcaption>
          <span>00</span>
          <span>
            θ {config.orbit.angle.toFixed(1)}° · tip {Math.round(tip.x)}, {Math.round(tip.y)} ·{" "}
            {tip.behind ? "behind" : "front"}
          </span>
        </figcaption>
      </figure>

      {frame(
        "presets",
        "presets",
        <>
          <div className="tiles">
            {presets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className="tile"
                aria-pressed={preset.id === selected.id}
                onClick={() => pick(preset)}
              >
                <Logo config={preset.id === selected.id ? config : preset.config} size={56} still />
                <span>{preset.id === selected.id ? label : preset.label}</span>
              </button>
            ))}
          </div>
          <TextControl label="label" value={label} onChange={setLabel} />
          <ButtonGroup
            buttons={[
              { label: "Save to code", onClick: () => void save() },
              { label: "Duplicate", onClick: duplicate },
            ]}
          />
        </>,
      )}

      {frame(
        "sun",
        "sun · r 400 · sun token",
        <>
          <SelectControl
            label="style"
            value={config.style.kind}
            options={[...LOGO_STYLES]}
            onChange={(v) => {
              if (v === config.style.kind) return;
              // Remember the settings being left, so switching back restores them.
              if (config.style.kind === "globe") {
                const { kind: _kind, ...lines } = config.style;
                setLastGlobe(lines);
              }
              if (config.style.kind === "crayon") {
                const { kind: _kind, ...lines } = config.style;
                setLastCrayon(lines);
              }
              if (v === "flat") setConfig((c) => ({ ...c, style: { kind: "flat" } }));
              if (v === "globe") setConfig((c) => ({ ...c, style: { kind: "globe", ...lastGlobe } }));
              if (v === "crayon") setConfig((c) => ({ ...c, style: { kind: "crayon", ...lastCrayon } }));
            }}
          />
          {config.style.kind === "crayon" && (
            <>
              <Slider label="wobble" value={config.style.wobble} min={0} max={60} step={0.5}
                onChange={(v) => setCrayon({ wobble: v })} />
              <Slider label="waves" value={config.style.waves} min={1} max={24} step={1}
                onChange={(v) => setCrayon({ waves: v })} />
              <Slider label="seed" value={config.style.seed} min={1} max={99} step={1}
                onChange={(v) => setCrayon({ seed: v })} />
              <Slider label="grain" value={config.style.grain} min={0} max={1} step={0.01}
                onChange={(v) => setCrayon({ grain: v })} />
              <Slider label="paper" value={config.style.paper} min={0} max={1} step={0.01}
                onChange={(v) => setCrayon({ paper: v })} />
              <Slider label="grain x" value={config.style.grainX} min={0.005} max={2} step={0.005}
                onChange={(v) => setCrayon({ grainX: v })} />
              <Slider label="grain y" value={config.style.grainY} min={0.005} max={2} step={0.005}
                onChange={(v) => setCrayon({ grainY: v })} />
              <Slider label="roughness" value={config.style.roughness} min={0} max={40} step={0.5}
                onChange={(v) => setCrayon({ roughness: v })} />
              <Toggle label="crayon cursor" checked={config.style.cursor}
                onChange={(v) => setCrayon({ cursor: v })} />
            </>
          )}
          {config.style.kind === "globe" && (
            <>
              <Slider label="meridians" value={config.style.meridians} min={1} max={12} step={1}
                onChange={(v) => setGlobe({ meridians: v })} />
              <Slider label="parallels" value={config.style.parallels} min={0} max={11} step={1}
                onChange={(v) => setGlobe({ parallels: v })} />
              <Toggle label="match orbit" checked={config.style.matchOrbit}
                onChange={(v) => setGlobe({ matchOrbit: v })} />
              {!config.style.matchOrbit && (
                <>
                  <Slider label="inclination" value={config.style.inclination} min={0} max={90} step={0.5} unit="°"
                    onChange={(v) => setGlobe({ inclination: v })} />
                  <Slider label="tilt" value={config.style.tilt} min={-90} max={90} step={0.5} unit="°"
                    onChange={(v) => setGlobe({ tilt: v })} />
                </>
              )}
              <Slider label="turn" value={config.style.turn} min={0} max={180} step={0.5} unit="°"
                onChange={(v) => setGlobe({ turn: v })} />
              <Slider label="globe spin" value={config.style.spin} min={-90} max={90} step={1} unit="°/s"
                onChange={(v) => setGlobe({ spin: v })} />
              <Slider label="line" value={config.style.line} min={2} max={40} step={0.5}
                onChange={(v) => setGlobe({ line: v })} />
              <Toggle label="outline" checked={config.style.outline}
                onChange={(v) => setGlobe({ outline: v })} />
              <SelectControl
                label="line cap"
                value={config.style.cap}
                options={[...LINE_CAPS]}
                onChange={(v) => setGlobe({ cap: LINE_CAPS.find((x) => x === v) ?? "round" })}
              />
              <SelectControl
                label="line color"
                value={config.style.color}
                options={[...COLOR_NAMES]}
                onChange={(v) => setGlobe({ color: COLOR_NAMES.find((n) => n === v) ?? "brandBlack" })}
              />
              <Slider label="opacity" value={config.style.opacity} min={0} max={1} step={0.05}
                onChange={(v) => setGlobe({ opacity: v })} />
            </>
          )}
          <Slider label="x" value={config.sun.cx} min={0} max={1000} step={1}
            onChange={(v) => setConfig((c) => ({ ...c, sun: { ...c.sun, cx: v } }))} />
          <Slider label="y" value={config.sun.cy} min={0} max={1000} step={1}
            onChange={(v) => setConfig((c) => ({ ...c, sun: { ...c.sun, cy: v } }))} />
        </>,
      )}

      {frame(
        "orbit",
        "orbit",
        <>
          <Slider label="radius" value={config.orbit.radius} min={SUN_RADIUS} max={700} step={1}
            onChange={(v) => setConfig((c) => ({ ...c, orbit: { ...c.orbit, radius: v } }))} />
          <Slider label="inclination" value={config.orbit.inclination} min={0} max={89} step={0.5} unit="°"
            onChange={(v) => setConfig((c) => ({ ...c, orbit: { ...c.orbit, inclination: v } }))} />
          <Slider label="tilt" value={config.orbit.tilt} min={-90} max={90} step={0.5} unit="°"
            onChange={(v) => setConfig((c) => ({ ...c, orbit: { ...c.orbit, tilt: v } }))} />
          <Slider label="angle" value={config.orbit.angle} min={0} max={360} step={0.1} unit="°"
            onChange={(v) => setConfig((c) => ({ ...c, orbit: { ...c.orbit, angle: v } }))} />
          <Toggle label="move cursor" checked={spin} onChange={setSpin} />
          <Slider label="cursor speed" value={speed} min={-360} max={360} step={1} unit="°/s" onChange={setSpeed} />
          <Toggle label="ring" checked={config.ring.on}
            onChange={(v) => setConfig((c) => ({ ...c, ring: { ...c.ring, on: v } }))} />
          {config.ring.on && (
            <>
              <Slider label="ring line" value={config.ring.line} min={2} max={40} step={0.5}
                onChange={(v) => setConfig((c) => ({ ...c, ring: { ...c.ring, line: v } }))} />
              <Toggle label="dashed" checked={config.ring.dashed}
                onChange={(v) => setConfig((c) => ({ ...c, ring: { ...c.ring, dashed: v } }))} />
              {config.ring.dashed && (
                <>
                  <Slider label="dash" value={config.ring.dash} min={1} max={120} step={0.5}
                    onChange={(v) => setConfig((c) => ({ ...c, ring: { ...c.ring, dash: v } }))} />
                  <Slider label="gap" value={config.ring.gap} min={1} max={120} step={0.5}
                    onChange={(v) => setConfig((c) => ({ ...c, ring: { ...c.ring, gap: v } }))} />
                </>
              )}
              <SelectControl
                label="ring cap"
                value={config.ring.cap}
                options={[...LINE_CAPS]}
                onChange={(v) =>
                  setConfig((c) => ({ ...c, ring: { ...c.ring, cap: LINE_CAPS.find((x) => x === v) ?? c.ring.cap } }))
                }
              />
              <SelectControl
                label="ring color"
                value={config.ring.color}
                options={[...COLOR_NAMES]}
                onChange={(v) =>
                  setConfig((c) => ({
                    ...c,
                    ring: { ...c.ring, color: COLOR_NAMES.find((n) => n === v) ?? c.ring.color },
                  }))
                }
              />
              <Slider label="ring opacity" value={config.ring.opacity} min={0} max={1} step={0.05}
                onChange={(v) => setConfig((c) => ({ ...c, ring: { ...c.ring, opacity: v } }))} />
            </>
          )}
        </>,
      )}

      {frame(
        "cursor",
        `cursor · ${CURSOR_PIXEL} px · 0°`,
        <>
          <SelectControl
            label="cursor"
            value={config.cursor}
            options={[...selected.cursors]}
            onChange={(v) =>
              setConfig((c) => ({ ...c, cursor: CURSOR_IDS.find((id) => id === v) ?? c.cursor }))
            }
          />
        </>,
      )}

      {frame(
        "backdrop",
        "backdrop · brand-white",
        <Toggle label="on" checked={config.backdrop}
          onChange={(v) => setConfig((c) => ({ ...c, backdrop: v }))} />,
      )}

      {frame(
        "view",
        "view",
        <>
          <Toggle label="grid" checked={showGrid} onChange={setShowGrid} />
          <Toggle label="orbit guide" checked={guide} onChange={setGuide} />
          <SelectControl
            label="surface"
            value={surface}
            options={[...SURFACES]}
            onChange={(v) => setSurface(SURFACES.find((b) => b === v) ?? surface)}
          />
        </>,
      )}
    </main>
  );
}
