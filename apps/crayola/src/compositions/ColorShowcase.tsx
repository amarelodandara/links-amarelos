import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { CalculateMetadataFunction } from "remotion";
import { z } from "zod";
import { SCALES, contrast, toHex } from "@links/brand";
import type { ScaleName, ScaleStep } from "@links/brand";
import { MONO } from "../design/fonts";
import { FPS } from "../settings";

/**
 * Color showcase: the outline of a numeric keypad with a display on top.
 * Row by row, the scale's name is typed into the display, then that row's
 * keys are pressed one after another and each fills with one of the scale's
 * colors while it is down: sun on 7 8 9, code on 4 5 6, ink on 1 2 3.
 *
 * Colors and scale words come from packages/brand/src/scales.ts.
 */

export const colorShowcaseSchema = z.object({
  /** Keypad size as a share of the frame (it fits inside, whichever side limits). */
  keypadScale: z.number().min(0.2).max(1.2),
  /** Vertical shift of the keypad, as a share of the frame height (0 = centered). */
  offsetY: z.number().min(-0.5).max(0.5),
  /** Space between keys, in key units (1 = one key). */
  keyGap: z.number().min(0).max(0.4),
  cornerRadius: z.number().min(0).max(0.5),
  /** Outline stroke, in key units. */
  strokeWidth: z.number().min(0.005).max(0.1),
  /** How far a key travels when pressed, in key units. */
  keyTravel: z.number().min(0).max(0.3),
  /** Display height, in key units. */
  displayHeight: z.number().min(0.6).max(2.5),
  /** Typed word in the display. */
  wordSize: z.number().min(0.1).max(1.2),
  /** Legends on the keys. */
  legendSize: z.number().min(0.1).max(0.8),
  legendOpacity: z.number().min(0).max(1),
  /** Geist Mono weight for legends and the typed word. */
  fontWeight: z.number().int().min(400).max(700).step(300),
  /** Which keys each scale's colors land on, light to dark. */
  sunKeys: z.string(),
  codeKeys: z.string(),
  inkKeys: z.string(),
  /** Seconds of bare keypad before the first word. */
  introSeconds: z.number().min(0).max(5),
  /** Seconds per typed character. */
  typeSeconds: z.number().min(0.02).max(1),
  /** Seconds per deleted character, when the next word replaces the last. */
  deleteSeconds: z.number().min(0.02).max(1),
  /** Pause between the word being typed and the first key press. */
  wordHoldSeconds: z.number().min(0).max(3),
  /** Seconds between one key press starting and the next. */
  staggerSeconds: z.number().min(0).max(2),
  /** Seconds for a key to go down. */
  pressSeconds: z.number().min(0.03).max(1),
  /** Seconds for the color to come in while the key is down. */
  colorSeconds: z.number().min(0.03).max(1.5),
  /** Seconds for the key to come back up. */
  releaseSeconds: z.number().min(0.03).max(1),
  /** Pause after a row is done, before the next word. */
  rowHoldSeconds: z.number().min(0).max(5),
  /** Seconds holding the finished keypad. */
  endHoldSeconds: z.number().min(0).max(10),
  /** Caret blinks per second while idle. */
  caretBlink: z.number().min(0).max(4),
  /** Easing for presses and color, as cubic-bezier(x1, y1, x2, y2). */
  easeX1: z.number().min(0).max(1),
  easeY1: z.number().min(-1).max(2),
  easeX2: z.number().min(0).max(1),
  easeY2: z.number().min(-1).max(2),
});

export type ColorShowcaseProps = z.infer<typeof colorShowcaseSchema>;

export const colorShowcaseDefaults: ColorShowcaseProps = {
  keypadScale: 0.8,
  offsetY: 0,
  keyGap: 0.14,
  cornerRadius: 0.14,
  strokeWidth: 0.025,
  keyTravel: 0.08,
  displayHeight: 1.2,
  wordSize: 0.5,
  legendSize: 0.28,
  legendOpacity: 0.6,
  fontWeight: 400,
  sunKeys: "789",
  codeKeys: "46",
  inkKeys: "123",
  introSeconds: 0.6,
  typeSeconds: 0.12,
  deleteSeconds: 0.06,
  wordHoldSeconds: 0.3,
  staggerSeconds: 0.32,
  pressSeconds: 0.1,
  colorSeconds: 0.25,
  releaseSeconds: 0.16,
  rowHoldSeconds: 0.5,
  endHoldSeconds: 2,
  caretBlink: 1.2,
  // Strong ease-in-out for on-screen movement (Emil Kowalski's curve).
  easeX1: 0.77,
  easeY1: 0,
  easeX2: 0.175,
  easeY2: 1,
};

/* ── Keypad layout (4 × 5 key units, under the display) ─────────────────── */

type Key = { id: string; legend: string; col: number; row: number; w: number; h: number };

const KEYS: readonly Key[] = [
  { id: "num", legend: "num", col: 0, row: 0, w: 1, h: 1 },
  { id: "/", legend: "/", col: 1, row: 0, w: 1, h: 1 },
  { id: "*", legend: "*", col: 2, row: 0, w: 1, h: 1 },
  { id: "-", legend: "-", col: 3, row: 0, w: 1, h: 1 },
  { id: "7", legend: "7", col: 0, row: 1, w: 1, h: 1 },
  { id: "8", legend: "8", col: 1, row: 1, w: 1, h: 1 },
  { id: "9", legend: "9", col: 2, row: 1, w: 1, h: 1 },
  { id: "+", legend: "+", col: 3, row: 1, w: 1, h: 2 },
  { id: "4", legend: "4", col: 0, row: 2, w: 1, h: 1 },
  { id: "5", legend: "5", col: 1, row: 2, w: 1, h: 1 },
  { id: "6", legend: "6", col: 2, row: 2, w: 1, h: 1 },
  { id: "1", legend: "1", col: 0, row: 3, w: 1, h: 1 },
  { id: "2", legend: "2", col: 1, row: 3, w: 1, h: 1 },
  { id: "3", legend: "3", col: 2, row: 3, w: 1, h: 1 },
  { id: "enter", legend: "enter", col: 3, row: 3, w: 1, h: 2 },
  { id: "0", legend: "0", col: 0, row: 4, w: 2, h: 1 },
  { id: ".", legend: ".", col: 2, row: 4, w: 1, h: 1 },
];

const COLS = 4;
const ROWS = 5;

/** Each scale and the keypad row its colors land on. */
const SCALE_ROWS = [
  { scale: "sun", keys: "789" },
  { scale: "code", keys: "456" },
  { scale: "ink", keys: "123" },
] as const satisfies readonly { scale: ScaleName; keys: string }[];

const PROP_KEYS = {
  sun: "sunKeys",
  code: "codeKeys",
  ink: "inkKeys",
} as const satisfies { [K in ScaleName]: keyof ColorShowcaseProps };

/** The scale's steps paired with the keys they land on; keys outside the row are skipped, extras dropped. */
function assignments(scale: ScaleName, chosen: string, rowKeys: string): { key: string; color: ScaleStep }[] {
  const keys = [...chosen].filter((c, i, all) => rowKeys.includes(c) && all.indexOf(c) === i);
  return SCALES[scale].slice(0, keys.length).map((color, i) => ({ key: keys[i], color }));
}

/* ── Timeline ──────────────────────────────────────────────────────────── */

type Press = { key: string; color: ScaleStep; start: number };
type RowTiming = { word: string; deleteStart: number; deleteCount: number; typeStart: number; typedAt: number; presses: Press[] };
type Timeline = { rows: RowTiming[]; total: number };

function timeline(p: ColorShowcaseProps): Timeline {
  let t = p.introSeconds;
  let previous = "";
  const pressLength = p.pressSeconds + p.colorSeconds + p.releaseSeconds;
  const rows = SCALE_ROWS.map(({ scale, keys }) => {
    const deleteStart = t;
    const deleteCount = previous.length;
    const typeStart = deleteStart + deleteCount * p.deleteSeconds;
    const typedAt = typeStart + scale.length * p.typeSeconds;
    const firstPress = typedAt + p.wordHoldSeconds;
    const presses = assignments(scale, p[PROP_KEYS[scale]], keys).map(({ key, color }, i) => ({
      key,
      color,
      start: firstPress + i * p.staggerSeconds,
    }));
    const last = presses[presses.length - 1];
    t = (last ? last.start + pressLength : firstPress) + p.rowHoldSeconds;
    previous = scale;
    return { word: scale, deleteStart, deleteCount, typeStart, typedAt, presses };
  });
  return { rows, total: t + p.endHoldSeconds };
}

export const calculateColorShowcaseMetadata: CalculateMetadataFunction<ColorShowcaseProps> = ({ props }) => ({
  durationInFrames: Math.max(1, Math.round(timeline(props).total * FPS)),
});

/* ── Rendering ─────────────────────────────────────────────────────────── */

/** 1 key unit in SVG user units, so sizes stay readable numbers. */
const U = 100;

const paint = SCALES.ink[0];
const pen = SCALES.ink[SCALES.ink.length - 1];
const PAINT = toHex(paint);
const PEN = toHex(pen);

/** Whichever end of the ink scale reads better on this fill. */
const inkOn = (color: ScaleStep): string => (contrast(paint, color) > contrast(pen, color) ? PAINT : PEN);

/** A key at this frame: how far down it is (0–1) and how much color it has (0–1). */
type KeyState = { depth: number; fill: number; color: ScaleStep | null };

export const ColorShowcase: React.FC<ColorShowcaseProps> = (p) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const seconds = frame / fps;
  const ease = Easing.bezier(p.easeX1, p.easeY1, p.easeX2, p.easeY2);
  const { rows } = timeline(p);

  const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
  const ramp = (start: number, duration: number): number => ease(interpolate(seconds, [start, start + duration], [0, 1], clamp));

  // Key states: pressed down, colored while down, released.
  const states = new Map<string, KeyState>();
  for (const row of rows) {
    for (const press of row.presses) {
      if (seconds < press.start) continue;
      const down = press.start + p.pressSeconds;
      const up = down + p.colorSeconds;
      const depth = ramp(press.start, p.pressSeconds) * (1 - ramp(up, p.releaseSeconds));
      states.set(press.key, { depth, fill: ramp(down, p.colorSeconds), color: press.color });
    }
  }

  // The display: typed characters, deleted when the next word replaces them.
  let text = "";
  let typing = false;
  for (const row of rows) {
    if (seconds < row.deleteStart) break;
    const previous = text;
    const deleted = Math.min(Math.floor((seconds - row.deleteStart) / p.deleteSeconds), row.deleteCount);
    text = previous.slice(0, previous.length - deleted);
    if (seconds >= row.typeStart) {
      const typed = Math.min(Math.floor((seconds - row.typeStart) / p.typeSeconds) + 1, row.word.length);
      text = row.word.slice(0, typed);
    }
    typing = seconds < row.typedAt;
  }
  const caretOn = typing || p.caretBlink === 0 || Math.floor(seconds * p.caretBlink * 2) % 2 === 0;

  const gap = p.keyGap * U;
  const stroke = p.strokeWidth * U;
  const travel = p.keyTravel * U;
  const radius = p.cornerRadius * U;
  const displayH = p.displayHeight * U;
  const top = displayH + gap; // keys start under the display
  const pad = stroke + travel;
  const viewW = COLS * U + pad * 2;
  const viewH = top + ROWS * U + pad * 2;
  const fit = Math.min((width * p.keypadScale) / viewW, (height * p.keypadScale) / viewH);

  const wordSize = p.wordSize * U;
  const charWidth = wordSize * 0.6; // Geist Mono advance
  const textX = gap / 2 + U * 0.3;
  const textY = displayH / 2;

  return (
    <AbsoluteFill style={{ backgroundColor: PAINT, alignItems: "center", justifyContent: "center" }}>
      <svg
        viewBox={`${-pad} ${-pad} ${viewW} ${viewH}`}
        width={viewW * fit}
        height={viewH * fit}
        style={{ transform: `translateY(${p.offsetY * height}px)` }}
      >
        {/* Display */}
        <rect x={gap / 2} y={0} width={COLS * U - gap} height={displayH - gap / 2} rx={radius} fill="none" stroke={PEN} strokeWidth={stroke} />
        <text
          x={textX}
          y={textY}
          dominantBaseline="central"
          fontFamily={MONO}
          fontWeight={p.fontWeight}
          fontSize={wordSize}
          fill={PEN}
        >
          {text}
        </text>
        {caretOn && (
          <rect
            x={textX + text.length * charWidth + wordSize * 0.06}
            y={textY - wordSize * 0.55}
            width={Math.max(stroke * 1.5, wordSize * 0.07)}
            height={wordSize * 1.1}
            fill={PEN}
          />
        )}

        {/* Keys: a base outline, and the cap that sits `travel` above it until pressed. */}
        {KEYS.map((key) => {
          const x = key.col * U + gap / 2;
          const y = top + key.row * U + gap / 2;
          const w = key.w * U - gap;
          const h = key.h * U - gap;
          const state = states.get(key.id) ?? { depth: 0, fill: 0, color: null };
          const lift = travel * (1 - state.depth);
          const capY = y - lift;
          const legendColor = state.color && state.fill > 0.5 ? inkOn(state.color) : PEN;
          // A long legend ("enter") shrinks to fit its key; Geist Mono advances 0.6 em.
          const legendSize = Math.min(p.legendSize * U, (w - gap * 1.6) / (key.legend.length * 0.6));
          return (
            <g key={key.id}>
              <rect x={x} y={y} width={w} height={h} rx={radius} fill={PEN} stroke={PEN} strokeWidth={stroke} />
              <rect x={x} y={capY} width={w} height={h} rx={radius} fill={PAINT} stroke={PEN} strokeWidth={stroke} />
              {state.color && (
                <rect
                  x={x}
                  y={capY}
                  width={w}
                  height={h}
                  rx={radius}
                  fill={toHex(state.color)}
                  opacity={state.fill}
                  stroke={PEN}
                  strokeWidth={stroke}
                />
              )}
              <text
                x={x + gap * 0.8}
                y={capY + gap * 0.8 + p.legendSize * U * 0.8}
                fontFamily={MONO}
                fontWeight={p.fontWeight}
                fontSize={legendSize}
                fill={legendColor}
                opacity={p.legendOpacity}
              >
                {key.legend}
              </text>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
