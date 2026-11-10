import { StrictMode, useState } from "react";
import type { CSSProperties } from "react";
import { createRoot } from "react-dom/client";
import { ButtonGroup, Slider, Toggle } from "dialkit";
import {
  SCALES,
  SCALE_NAMES,
  colors,
  contrast,
  fromHex,
  gamutOf,
  maxChroma,
  toCss,
  toHex,
  tokenName,
} from "@links/brand";
import type { Oklch, ScaleName, ScaleStep, Scales, Step } from "@links/brand";
import { serializeScales } from "./serialize-scales";
import "dialkit/styles.css";
import "./playground.css";
import "./palette.css";

/**
 * The palette lab: every scale step as a swatch, in one row grouped by scale.
 * Type a semantic name under each swatch; click a swatch to tune its lightness,
 * chroma and hue. "Save to code" rewrites packages/brand/src/scales.ts and
 * regenerates tokens.css.
 */

type Selection = { scale: ScaleName; step: Step };

/** Steps pinned to a brand color: tunable, but flagged so a change is deliberate. */
const ANCHORS: readonly Selection[] = [
  { scale: "sun", step: 500 },
  { scale: "code", step: 900 },
  { scale: "ink", step: 100 },
  { scale: "ink", step: 900 },
];
const isAnchor = (scale: ScaleName, step: Step): boolean =>
  ANCHORS.some((a) => a.scale === scale && a.step === step);

const WHITE = fromHex("#ffffff");
const BLACK = fromHex(colors.brandBlack);

/** A semantic name becomes a CSS custom property, so it must be a plain kebab-case ident. */
const NAME_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

const fmt = (n: number, places: number): string => n.toFixed(places);

/** WCAG 2 badge for a ratio: AA body text, AA large text, or neither. */
const grade = (ratio: number): string => (ratio >= 7 ? "AAA" : ratio >= 4.5 ? "AA" : ratio >= 3 ? "AA·L" : "–");

function find(scales: Scales, { scale, step }: Selection): ScaleStep {
  return scales[scale].find((s) => s.step === step) ?? scales[scale][0];
}

/** Why a name cannot be used, or "" when it can. */
function nameProblem(name: string, all: readonly string[]): string {
  if (name === "") return "";
  if (!NAME_PATTERN.test(name)) return "lowercase, digits, hyphens";
  if (all.filter((n) => n === name).length > 1) return "used twice";
  return "";
}

/** The swatch fill: the P3 value, or the sRGB fallback when previewing that. */
const fill = (color: Oklch, srgbOnly: boolean): string => (srgbOnly ? toHex(color) : toCss(color));

function Palette() {
  const [scales, setScales] = useState<Scales>(SCALES);
  const [saved, setSaved] = useState<Scales>(SCALES);
  const [selected, setSelected] = useState<Selection>({ scale: "sun", step: 500 });
  const [srgbOnly, setSrgbOnly] = useState(false);
  const [status, setStatus] = useState("");

  const current = find(scales, selected);
  const original = find(saved, selected);
  const dirty = JSON.stringify(scales) !== JSON.stringify(saved);
  const name = tokenName(selected.scale, selected.step);
  const maxSrgb = maxChroma(current.l, current.h, "srgb");
  const maxP3 = maxChroma(current.l, current.h, "p3");
  const allNames = SCALE_NAMES.flatMap((n) => scales[n].map((s) => s.name));
  const invalid = allNames.some((n) => nameProblem(n, allNames) !== "");

  function update(target: Selection, patch: Partial<ScaleStep>) {
    setScales((prev) => ({
      ...prev,
      [target.scale]: prev[target.scale].map((s) => (s.step === target.step ? { ...s, ...patch } : s)),
    }));
    setStatus("");
  }

  const set = (patch: Partial<Oklch>) => update(selected, patch);

  async function save() {
    if (invalid) {
      setStatus("fix the names first");
      return;
    }
    setStatus("saving…");
    const res = await fetch("/__palette/scales", { method: "POST", body: serializeScales(scales) });
    if (res.ok) setSaved(scales);
    setStatus(res.ok ? "saved to scales.ts + tokens.css" : `save failed (${res.status})`);
  }

  async function copy() {
    const css = SCALE_NAMES.flatMap((n) =>
      scales[n].map(
        (s) => `--${tokenName(n, s.step)}: ${toCss(s)}; /* ${toHex(s)}${s.name ? ` · ${s.name}` : ""} */`,
      ),
    ).join("\n");
    await navigator.clipboard.writeText(css);
    setStatus("css copied");
  }

  return (
    <main className="palette">
      <header className="masthead">
        <p>
          crayola / palette · <a href="./index.html">logo</a> · <a href="./specimens.html">specimens</a>
        </p>
        <p>
          oklch · p3 with srgb fallback{dirty ? " · unsaved" : ""}
          {status ? ` · ${status}` : ""}
        </p>
      </header>

      <section className="scales">
        {SCALE_NAMES.map((scaleName) => {
          const groupStyle: CSSProperties = { flexGrow: scales[scaleName].length };
          return (
            <div key={scaleName} className="scale" style={groupStyle}>
              <h2>{scaleName}</h2>
              <div className="swatches">
                {scales[scaleName].map((color) => {
                  const step = color.step;
                  const target = { scale: scaleName, step };
                  const gamut = gamutOf(color);
                  const onWhite = contrast(color, WHITE);
                  const onBlack = contrast(color, BLACK);
                  const ink = onBlack >= onWhite ? colors.brandBlack : "#ffffff";
                  const style: CSSProperties = { background: fill(color, srgbOnly), color: ink };
                  const fallback: CSSProperties = { background: toHex(color) };
                  const on = selected.scale === scaleName && selected.step === step;
                  const problem = nameProblem(color.name, allNames);
                  const inputId = `name-${tokenName(scaleName, step)}`;
                  return (
                    <div key={step} className="swatch-cell">
                      <button
                        type="button"
                        className="swatch"
                        aria-pressed={on}
                        style={style}
                        onClick={() => setSelected(target)}
                      >
                        {!srgbOnly && gamut !== "srgb" && (
                          <span className="fallback" style={fallback} title="sRGB fallback" />
                        )}
                        <span className="swatch-step">
                          {step}
                          {isAnchor(scaleName, step) ? " ◆" : ""}
                        </span>
                        <span className="swatch-meta">
                          {toHex(color)}
                          <br />
                          {gamut}
                          <br />
                          w {fmt(onWhite, 1)} · k {fmt(onBlack, 1)}
                        </span>
                      </button>
                      <label className="swatch-name" htmlFor={inputId}>
                        <span>--{tokenName(scaleName, step)}</span>
                        <input
                          id={inputId}
                          type="text"
                          value={color.name}
                          placeholder="semantic name"
                          spellCheck={false}
                          autoComplete="off"
                          aria-invalid={problem !== ""}
                          onFocus={() => setSelected(target)}
                          onChange={(e) => update(target, { name: e.target.value.trim() })}
                        />
                        {problem && <span className="swatch-name-problem">{problem}</span>}
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>

      <aside className="tuner frame dialkit-root" data-theme="light">
        <p className="frame-title">
          --{name}
          {current.name ? ` · ${current.name}` : ""}
          {isAnchor(selected.scale, selected.step) ? " · anchor" : ""}
        </p>
        <div className="compare">
          <span style={{ background: toCss(original) }}>saved</span>
          <span style={{ background: toCss(current) }}>p3</span>
          <span style={{ background: toHex(current) }}>srgb</span>
        </div>
        <Slider label="lightness" value={current.l} min={0} max={1} step={0.001} onChange={(v) => set({ l: v })} />
        <Slider label="chroma" value={current.c} min={0} max={0.37} step={0.001} onChange={(v) => set({ c: v })} />
        <Slider label="hue" value={current.h} min={0} max={360} step={0.1} unit="°" onChange={(v) => set({ h: v })} />
        <dl className="readout">
          <dt>css</dt>
          <dd>{toCss(current)}</dd>
          <dt>hex</dt>
          <dd>{toHex(current)}</dd>
          <dt>gamut</dt>
          <dd>{gamutOf(current)}</dd>
          <dt>max c</dt>
          <dd>
            srgb {fmt(maxSrgb, 3)} · p3 {fmt(maxP3, 3)}
          </dd>
          <dt>on white</dt>
          <dd>
            {fmt(contrast(current, WHITE), 2)} {grade(contrast(current, WHITE))}
          </dd>
          <dt>on black</dt>
          <dd>
            {fmt(contrast(current, BLACK), 2)} {grade(contrast(current, BLACK))}
          </dd>
        </dl>
        <ButtonGroup
          buttons={[
            { label: "C → srgb max", onClick: () => set({ c: Math.floor(maxSrgb * 1000) / 1000 }) },
            { label: "C → p3 max", onClick: () => set({ c: Math.floor(maxP3 * 1000) / 1000 }) },
          ]}
        />
        <ButtonGroup
          buttons={[
            { label: "Reset step", onClick: () => set({ l: original.l, c: original.c, h: original.h }) },
            { label: "Reset all", onClick: () => setScales(saved) },
          ]}
        />
        <Toggle label="preview srgb only" checked={srgbOnly} onChange={setSrgbOnly} />
        <ButtonGroup
          buttons={[
            { label: "Save to code", onClick: () => void save() },
            { label: "Copy CSS", onClick: () => void copy() },
          ]}
        />
      </aside>
    </main>
  );
}

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <Palette />
    </StrictMode>,
  );
}
