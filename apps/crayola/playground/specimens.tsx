import { StrictMode } from "react";
import type { CSSProperties, ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { CURSORS, LOGO_GRID, Logo, PRESETS, SUN_RADIUS } from "@links/brand/logo";
import type { LogoConfig, LogoPreset } from "@links/brand/logo";
import photo from "../../../packages/content/assets/links-amarelos-9/01.png";
import texture from "../brand/textures/bg-texture.svg?url";
import textureSoft from "../brand/textures/bg-texture-soft.svg?url";
import "./specimens.css";

/**
 * Logo specimens for writing usage guidelines: every variant, the cursors it
 * allows, at many sizes, still and animated, on many surfaces, plus the rules
 * decided so far. Renders the real <Logo> from presets.ts, so it always shows
 * what is saved.
 */

const SIZES = [16, 24, 32, 48, 64, 96, 128, 256, 512];

type Surface = { id: string; label: string; style: CSSProperties };

const SURFACES: Surface[] = [
  { id: "white", label: "white", style: { background: "#fff" } },
  { id: "brand-white", label: "brand-white", style: { background: "var(--brand-white)" } },
  { id: "sun-lighter", label: "sun-lighter", style: { background: "var(--sun-lighter)" } },
  { id: "sun", label: "sun", style: { background: "var(--sun)" } },
  { id: "code", label: "code", style: { background: "var(--code)" } },
  { id: "brand-black", label: "brand-black", style: { background: "var(--brand-black)" } },
  { id: "texture", label: "texture", style: { background: `url("${texture}") 0 0 / 48px` } },
  {
    id: "texture-soft",
    label: "texture soft",
    style: { background: `var(--brand-white) url("${textureSoft}") 0 0 / 48px` },
  },
  { id: "photo", label: "photo", style: { background: `url("${photo}") center / cover` } },
];

const preset = (id: string): LogoPreset => PRESETS.find((p) => p.id === id) ?? PRESETS[0];
const master = preset("master-logo");
const animated = PRESETS.filter((p) => p.config.style.kind === "globe" && p.config.style.spin !== 0);

const withCursor = (config: LogoConfig, cursor: LogoConfig["cursor"]): LogoConfig => ({ ...config, cursor });
const withBackdrop = (config: LogoConfig, backdrop: boolean): LogoConfig => ({ ...config, backdrop });

function Section({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <section className="section">
      <header className="section-head">
        <span className="section-n">{n}</span>
        <h2>{title}</h2>
      </header>
      {children}
    </section>
  );
}

function Specimen({ children, caption, surface }: { children: ReactNode; caption: string; surface?: CSSProperties }) {
  return (
    <figure className="specimen">
      <div className="specimen-frame" style={surface}>
        {children}
      </div>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

/**
 * A "don't" example: the master logo with a forbidden change. Built by nesting
 * the real logo inside an outer SVG on the same 1000 grid.
 */
function Dont({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <figure className="specimen dont">
      <div className="specimen-frame">
        {children}
        <svg className="cross" viewBox="0 0 100 100" aria-hidden>
          <line x1="8" y1="8" x2="92" y2="92" />
          <line x1="92" y1="8" x2="8" y2="92" />
        </svg>
      </div>
      <figcaption>don&apos;t · {caption}</figcaption>
    </figure>
  );
}

function Specimens() {
  const sun = master.config.sun;
  return (
    <main className="sheet">
      <header className="masthead">
        <p>crayola / logo / specimens</p>
        <a href="./">← playground</a>
      </header>

      <Section n="01" title="variants and their cursors">
        {PRESETS.map((p) => (
          <div key={p.id} className="row">
            <p className="row-label">
              {p.label}
              <span>{p.cursors.length} cursors</span>
            </p>
            <div className="row-items">
              {p.cursors.map((cursor) => (
                <Specimen key={cursor} caption={CURSORS[cursor].label}>
                  <Logo config={withCursor(p.config, cursor)} size={160} still />
                </Specimen>
              ))}
            </div>
          </div>
        ))}
      </Section>

      <Section n="02" title="sizes">
        {PRESETS.map((p) => (
          <div key={p.id} className="row">
            <p className="row-label">{p.label}</p>
            <div className="row-items sizes">
              {SIZES.map((size) => (
                <Specimen key={size} caption={`${size}px`}>
                  <Logo config={p.config} size={size} still />
                </Specimen>
              ))}
            </div>
          </div>
        ))}
      </Section>

      <Section n="03" title="motion: still and animated">
        {animated.map((p) => (
          <div key={p.id} className="row">
            <p className="row-label">{p.label}</p>
            <div className="row-items sizes">
              {[32, 64, 128, 256].map((size) => (
                <div key={size} className="pair">
                  <Specimen caption={`${size}px · still`}>
                    <Logo config={p.config} size={size} still />
                  </Specimen>
                  <Specimen caption={`${size}px · animated`}>
                    <Logo config={p.config} size={size} />
                  </Specimen>
                </div>
              ))}
            </div>
          </div>
        ))}
      </Section>

      <Section n="04" title="surfaces · backdrop off / on">
        {PRESETS.map((p) => (
          <div key={p.id} className="row">
            <p className="row-label">{p.label}</p>
            <div className="row-items">
              {SURFACES.map((s) => (
                <div key={s.id} className="pair">
                  <Specimen caption={`${s.label} · off`} surface={s.style}>
                    <Logo config={withBackdrop(p.config, false)} size={120} />
                  </Specimen>
                  <Specimen caption={`${s.label} · on`} surface={s.style}>
                    <Logo config={withBackdrop(p.config, true)} size={120} />
                  </Specimen>
                </div>
              ))}
            </div>
          </div>
        ))}
      </Section>

      <Section n="05" title="rules so far">
        <div className="row">
          <p className="row-label">allowed</p>
          <div className="row-items">
            <Specimen caption="do · texture on the sun (crayon)">
              <Logo config={preset("crayola").config} size={160} still />
            </Specimen>
            <Specimen caption="do · texture on the sun (globe lines)">
              <Logo config={preset("hyperlinks").config} size={160} still />
            </Specimen>
          </div>
        </div>
        <div className="row">
          <p className="row-label">not allowed</p>
          <div className="row-items">
            <Dont caption="image inside the sun">
              <svg viewBox={`0 0 ${LOGO_GRID} ${LOGO_GRID}`} width={160} height={160}>
                <Logo config={master.config} />
                <clipPath id="dont-image">
                  <circle cx={sun.cx} cy={sun.cy} r={SUN_RADIUS} />
                </clipPath>
                <image
                  href={photo}
                  x={sun.cx - SUN_RADIUS}
                  y={sun.cy - SUN_RADIUS}
                  width={SUN_RADIUS * 2}
                  height={SUN_RADIUS * 2}
                  preserveAspectRatio="xMidYMid slice"
                  clipPath="url(#dont-image)"
                />
              </svg>
            </Dont>
            <Dont caption="the sun as a mask">
              <svg viewBox={`0 0 ${LOGO_GRID} ${LOGO_GRID}`} width={160} height={160}>
                <mask id="dont-mask">
                  <circle cx={sun.cx} cy={sun.cy} r={SUN_RADIUS} fill="#fff" />
                </mask>
                <image
                  href={photo}
                  width={LOGO_GRID}
                  height={LOGO_GRID}
                  preserveAspectRatio="xMidYMid slice"
                  mask="url(#dont-mask)"
                />
              </svg>
            </Dont>
            <Dont caption="changed hue">
              <div style={{ filter: "hue-rotate(160deg)" }}>
                <Logo config={master.config} size={160} still />
              </div>
            </Dont>
            <Dont caption="changed tone · lighter">
              <div style={{ filter: "brightness(1.25) saturate(0.55)" }}>
                <Logo config={master.config} size={160} still />
              </div>
            </Dont>
            <Dont caption="changed tone · darker">
              <div style={{ filter: "brightness(0.72)" }}>
                <Logo config={master.config} size={160} still />
              </div>
            </Dont>
          </div>
        </div>
      </Section>
    </main>
  );
}

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <Specimens />
    </StrictMode>,
  );
}
