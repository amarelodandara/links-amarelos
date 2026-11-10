import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { CalculateMetadataFunction } from "remotion";
import type { CSSProperties, ReactNode } from "react";
import { z } from "zod";
import { SCALES, SCALE_NAMES, toHex } from "@links/brand";
import { MONO, PIXEL_STYLES, SANS, SERIF_STYLES } from "../design/fonts";
import { FPS } from "../settings";

/**
 * Typography showcase: a phone browser opening the manifesto. Each Geist
 * variant has one job on screen:
 * - sans: the browser's own controls (status bar, tab title);
 * - mono: the URL, typed into the address bar;
 * - pixel: the buttons on the page;
 * - serif: the content, a principle's title and its explanation.
 *
 * Every text default is copied verbatim from the website (manifesto page,
 * its metadata and the nav labels). Change them in the studio props.
 */

/** The semantic color names in packages/brand/src/scales.ts. */
const COLOR_NAMES = ["sunray", "sunshine", "sun", "source", "terminal", "paint", "pencil", "pen"] as const;
const colorName = z.enum(COLOR_NAMES);

export const typeShowcaseSchema = z.object({
  /** Text, all of it Dandara's. */
  url: z.string(),
  tabTitle: z.string(),
  /** Page buttons, comma-separated. */
  buttons: z.string(),
  /** The button shown as the current page. */
  activeButton: z.string(),
  title: z.string(),
  text: z.string(),

  /** Font styles. */
  serifStyle: z.enum(["regular", "square", "triangle", "heart"]),
  pixelStyle: z.enum(["square", "grid", "circle", "triangle", "line"]),
  sansWeight: z.number().int().min(400).max(800).step(100),
  monoWeight: z.number().int().min(400).max(700).step(100),

  /** Sizes, in phone points (the phone is 390 points wide). */
  urlSize: z.number().min(8).max(24),
  tabSize: z.number().min(8).max(24),
  buttonSize: z.number().min(8).max(28),
  titleSize: z.number().min(16).max(72),
  textSize: z.number().min(10).max(32),
  textLeading: z.number().min(1).max(2),

  /** Phone width as a share of the frame width. */
  phoneWidth: z.number().min(0.2).max(1.2),
  /** Space kept above the phone, as a share of the frame height. A phone too tall to fit runs off the bottom. */
  margin: z.number().min(0).max(0.3),
  /** Vertical shift of the phone, as a share of the frame height. */
  offsetY: z.number().min(-0.5).max(0.5),

  /** Colors, by semantic name. */
  background: colorName,
  bezel: colorName,
  page: colorName,
  ink: colorName,
  muted: colorName,
  accent: colorName,
  caret: colorName,

  /** Timing, in seconds. */
  introSeconds: z.number().min(0).max(5),
  typeSeconds: z.number().min(0.02).max(0.5),
  enterHoldSeconds: z.number().min(0).max(3),
  loadSeconds: z.number().min(0.1).max(4),
  buttonStaggerSeconds: z.number().min(0).max(1),
  titleStaggerSeconds: z.number().min(0).max(1),
  textStaggerSeconds: z.number().min(0).max(0.5),
  /** How long one button or word takes to come in. */
  revealSeconds: z.number().min(0.05).max(2),
  /** Pause between the title and the text. */
  textDelaySeconds: z.number().min(0).max(3),
  endHoldSeconds: z.number().min(0).max(10),
  caretBlink: z.number().min(0).max(4),
  /** How far a word rises as it comes in, in em. */
  rise: z.number().min(0).max(2),
  easeX1: z.number().min(0).max(1),
  easeY1: z.number().min(-1).max(2),
  easeX2: z.number().min(0).max(1),
  easeY2: z.number().min(-1).max(2),
});

export type TypeShowcaseProps = z.infer<typeof typeShowcaseSchema>;

export const typeShowcaseDefaults: TypeShowcaseProps = {
  url: "linksamarelos.com/manifesto",
  tabTitle: "manifesto • links amarelos",
  buttons: "Sobre, Manifesto, Apoio, Realizações",
  activeButton: "Manifesto",
  title: "Profundidade e Otimismo",
  text:
    "Enquanto o resto da internet estiver preocupado com resumir, cortar e viralizar, aqui eu vou " +
    "me preocupar com respirar fundo, rolar até o fim da página e priorizar a mensagem. Isso envolve " +
    "contar a mensagem na mídia que ela precisa e não necessariamente na mais rápida. Significa também " +
    "contar com calma e com fontes.",
  serifStyle: "regular",
  pixelStyle: "square",
  sansWeight: 600,
  monoWeight: 400,
  urlSize: 15,
  tabSize: 13,
  buttonSize: 20,
  titleSize: 44,
  textSize: 19,
  textLeading: 1.42,
  phoneWidth: 0.5,
  margin: 0.08,
  offsetY: 0,
  background: "sun",
  bezel: "pen",
  page: "paint",
  ink: "pen",
  muted: "pencil",
  accent: "sun",
  caret: "source",
  introSeconds: 0.5,
  typeSeconds: 0.06,
  enterHoldSeconds: 0.3,
  loadSeconds: 0.8,
  buttonStaggerSeconds: 0.08,
  titleStaggerSeconds: 0.12,
  textStaggerSeconds: 0.03,
  revealSeconds: 0.5,
  textDelaySeconds: 0.2,
  endHoldSeconds: 2.5,
  caretBlink: 1.2,
  rise: 0.35,
  // Emil Kowalski's strong ease-in-out.
  easeX1: 0.77,
  easeY1: 0,
  easeX2: 0.175,
  easeY2: 1,
};

/* ── Timeline ───────────────────────────────────────────────────────────── */

type Timeline = {
  typeStart: number;
  typeEnd: number;
  loadStart: number;
  loadEnd: number;
  buttonsStart: number;
  titleStart: number;
  textStart: number;
  total: number;
};

const splitButtons = (buttons: string): string[] =>
  buttons
    .split(",")
    .map((b) => b.trim())
    .filter((b) => b !== "");

const words = (s: string): string[] => s.split(/\s+/).filter((w) => w !== "");

function timeline(p: TypeShowcaseProps): Timeline {
  const typeStart = p.introSeconds;
  const typeEnd = typeStart + p.url.length * p.typeSeconds;
  const loadStart = typeEnd + p.enterHoldSeconds;
  const loadEnd = loadStart + p.loadSeconds;
  // Buttons start as the bar finishes; the title follows the last button.
  const buttonsStart = loadEnd - p.loadSeconds * 0.25;
  const buttonCount = splitButtons(p.buttons).length;
  const titleStart = buttonsStart + Math.max(0, buttonCount - 1) * p.buttonStaggerSeconds + p.revealSeconds * 0.5;
  const titleEnd = titleStart + Math.max(0, words(p.title).length - 1) * p.titleStaggerSeconds + p.revealSeconds;
  const textStart = titleEnd + p.textDelaySeconds;
  const textEnd = textStart + Math.max(0, words(p.text).length - 1) * p.textStaggerSeconds + p.revealSeconds;
  return {
    typeStart,
    typeEnd,
    loadStart,
    loadEnd,
    buttonsStart,
    titleStart,
    textStart,
    total: textEnd + p.endHoldSeconds,
  };
}

export const calculateTypeShowcaseMetadata: CalculateMetadataFunction<TypeShowcaseProps> = ({ props }) => ({
  durationInFrames: Math.max(1, Math.round(timeline(props).total * FPS)),
});

/* ── Rendering ─────────────────────────────────────────────────────────── */

/** The phone, in points: an iPhone-sized screen. */
const PHONE_W = 390;
const PHONE_H = 844;
const BEZEL = 12;

function hexOf(name: string): string {
  for (const scale of SCALE_NAMES) {
    const step = SCALES[scale].find((s) => s.name === name);
    if (step) return toHex(step);
  }
  return "#000000";
}

/** 0 → 1 over [start, start + seconds], eased. */
function progress(t: number, start: number, seconds: number, ease: (n: number) => number): number {
  return interpolate(t, [start, start + seconds], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
}

type RevealProps = { amount: number; rise: number; children: ReactNode };

/** A word or button coming in: fades and rises into place. */
function Reveal({ amount, rise, children }: RevealProps) {
  const style: CSSProperties = {
    display: "inline-block",
    opacity: amount,
    transform: `translateY(${(1 - amount) * rise}em)`,
  };
  return <span style={style}>{children}</span>;
}

export const TypeShowcase: React.FC<TypeShowcaseProps> = (p) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const t = frame / fps;
  const tl = timeline(p);
  const ease = Easing.bezier(p.easeX1, p.easeY1, p.easeX2, p.easeY2);

  const c = {
    background: hexOf(p.background),
    bezel: hexOf(p.bezel),
    page: hexOf(p.page),
    ink: hexOf(p.ink),
    muted: hexOf(p.muted),
    accent: hexOf(p.accent),
    caret: hexOf(p.caret),
  };
  const serif = SERIF_STYLES[p.serifStyle];
  const pixel = PIXEL_STYLES[p.pixelStyle];

  // Phone placement: centered when it fits, else pinned under the top margin.
  const scale = (p.phoneWidth * width) / PHONE_W;
  const phoneH = PHONE_H * scale;
  const room = height * (1 - 2 * p.margin);
  const top = (phoneH <= room ? (height - phoneH) / 2 : height * p.margin) + p.offsetY * height;
  const left = (width - PHONE_W * scale) / 2;

  // Address bar: the URL types in, the caret blinks while idle and leaves on enter.
  const typed = Math.max(0, Math.min(p.url.length, Math.floor((t - tl.typeStart) / p.typeSeconds)));
  const typing = t >= tl.typeStart && t < tl.typeEnd;
  const blinkOn = p.caretBlink === 0 || Math.floor(t * p.caretBlink * 2) % 2 === 0;
  const caretVisible = t < tl.loadStart && (typing || blinkOn);

  const load = progress(t, tl.loadStart, p.loadSeconds, ease);
  const barOpacity = interpolate(t, [tl.loadEnd, tl.loadEnd + 0.25], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const tabIn = progress(t, tl.loadStart, p.revealSeconds, ease);

  const buttons = splitButtons(p.buttons);
  const titleWords = words(p.title);
  const textWords = words(p.text);

  const phone: CSSProperties = {
    position: "absolute",
    left,
    top,
    width: PHONE_W,
    height: PHONE_H,
    transform: `scale(${scale})`,
    transformOrigin: "top left",
    boxSizing: "border-box",
    border: `${BEZEL}px solid ${c.bezel}`,
    borderRadius: 64,
    background: c.page,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  };

  const sans: CSSProperties = { fontFamily: SANS, fontWeight: p.sansWeight, color: c.ink };

  return (
    <AbsoluteFill style={{ background: c.background }}>
      <div style={phone}>
        {/* Status bar, with the island. */}
        <div style={{ position: "relative", height: 50, flexShrink: 0 }}>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 9,
              width: 116,
              height: 34,
              marginLeft: -58,
              borderRadius: 17,
              background: c.bezel,
            }}
          />
          <span style={{ ...sans, position: "absolute", left: 30, top: 15, fontSize: 16 }}>9:41</span>
          <StatusIcons color={c.ink} />
        </div>

        {/* Tab title. */}
        <div
          style={{
            ...sans,
            height: 22,
            flexShrink: 0,
            textAlign: "center",
            fontSize: p.tabSize,
            color: c.muted,
            opacity: tabIn,
          }}
        >
          {p.tabTitle}
        </div>

        {/* Toolbar: back, forward, the address bar. */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, height: 52, padding: "0 14px", flexShrink: 0 }}>
          <Chevron color={c.muted} flip={false} />
          <Chevron color={c.muted} flip />
          <div
            style={{
              flex: 1,
              height: 38,
              borderRadius: 12,
              border: `1.5px solid ${c.muted}`,
              display: "flex",
              alignItems: "center",
              padding: "0 12px",
              overflow: "hidden",
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ fontFamily: MONO, fontWeight: p.monoWeight, fontSize: p.urlSize, color: c.ink }}>
              {p.url.slice(0, typed)}
            </span>
            <span
              style={{
                width: 2,
                height: p.urlSize * 1.25,
                marginLeft: 1,
                background: c.caret,
                opacity: caretVisible ? 1 : 0,
              }}
            />
          </div>
        </div>

        {/* Load bar on the divider. */}
        <div style={{ position: "relative", height: 3, flexShrink: 0 }}>
          <div style={{ position: "absolute", inset: "1px 0 auto 0", height: 1, background: c.muted, opacity: 0.3 }} />
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              height: 3,
              width: `${load * 100}%`,
              background: c.accent,
              opacity: barOpacity,
            }}
          />
        </div>

        {/* The page. */}
        <div style={{ padding: "22px 24px", color: c.ink }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {buttons.map((label, i) => {
              const active = label === p.activeButton;
              const amount = progress(t, tl.buttonsStart + i * p.buttonStaggerSeconds, p.revealSeconds, ease);
              return (
                <Reveal key={label} amount={amount} rise={p.rise}>
                  <span
                    style={{
                      display: "inline-block",
                      fontFamily: pixel,
                      fontSize: p.buttonSize,
                      lineHeight: 1,
                      padding: "9px 12px",
                      borderRadius: 8,
                      border: `1.5px solid ${c.ink}`,
                      background: active ? c.accent : "transparent",
                    }}
                  >
                    {label}
                  </span>
                </Reveal>
              );
            })}
          </div>

          <h1
            style={{
              margin: "30px 0 0",
              fontFamily: serif,
              fontWeight: 400,
              fontSize: p.titleSize,
              lineHeight: 1.05,
              letterSpacing: "-0.01em",
            }}
          >
            {titleWords.map((w, i) => (
              <span key={i}>
                <Reveal amount={progress(t, tl.titleStart + i * p.titleStaggerSeconds, p.revealSeconds, ease)} rise={p.rise}>
                  {w}
                </Reveal>{" "}
              </span>
            ))}
          </h1>

          <p
            style={{
              margin: "18px 0 0",
              fontFamily: serif,
              fontWeight: 400,
              fontSize: p.textSize,
              lineHeight: p.textLeading,
            }}
          >
            {textWords.map((w, i) => (
              <span key={i}>
                <Reveal amount={progress(t, tl.textStart + i * p.textStaggerSeconds, p.revealSeconds, ease)} rise={p.rise}>
                  {w}
                </Reveal>{" "}
              </span>
            ))}
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
};

type ChevronProps = { color: string; flip: boolean };

function Chevron({ color, flip }: ChevronProps) {
  return (
    <svg width={22} height={22} viewBox="0 0 22 22" style={{ flexShrink: 0, transform: flip ? "scaleX(-1)" : undefined }}>
      <path d="M14 4 L7 11 L14 18" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type StatusIconsProps = { color: string };

/** Signal bars and battery, top right. */
function StatusIcons({ color }: StatusIconsProps) {
  return (
    <svg width={58} height={14} viewBox="0 0 58 14" style={{ position: "absolute", right: 30, top: 18 }}>
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={i * 5} y={10 - i * 3} width={3.2} height={4 + i * 3} rx={0.8} fill={color} />
      ))}
      <rect x={27} y={1} width={25} height={12} rx={3.5} fill="none" stroke={color} strokeWidth={1.2} opacity={0.45} />
      <rect x={29} y={3} width={19} height={8} rx={2} fill={color} />
      <rect x={53.5} y={5} width={1.6} height={4} rx={0.8} fill={color} opacity={0.45} />
    </svg>
  );
}
