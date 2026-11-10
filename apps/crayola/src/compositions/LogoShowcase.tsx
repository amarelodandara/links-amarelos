import { AbsoluteFill, Easing, useCurrentFrame, useVideoConfig } from "remotion";
import type { CalculateMetadataFunction } from "remotion";
import { z } from "zod";
import { colors } from "@links/brand";
import { Logo, PRESETS } from "@links/brand/logo";
import type { CursorId, LogoConfig, LogoPreset } from "@links/brand/logo";
import { FPS } from "../settings";

/**
 * Logo showcase: the logo centered on brand-white. Every variant shares one
 * orbit, so the ring and the cursor's path never jump between them.
 *
 * Each beat, the cursor rests where the logo has it (the orbit's angle), then
 * travels one full turn back to that spot with an ease-in-out. On the way it
 * passes behind the sun; the moment it comes out (0°), it becomes the next
 * cursor, and after `cursorsPerVariant` cursors the next variant takes over
 * (master → crayola → hyperlinks).
 */

export const LOGO_SHOWCASE_FORMATS = {
  "1x1": { width: 1080, height: 1080 },
  "2x3": { width: 1080, height: 1620 },
  "9x16": { width: 1080, height: 1920 },
} as const;

export const logoShowcaseSchema = z.object({
  /** Logo size as a share of the frame's shorter side. */
  logoScale: z.number().min(0.2).max(1),
  /** How many of each variant's allowed cursors to show, in their listed order. */
  cursorsPerVariant: z.number().int().min(1).max(6),
  /** Preset whose orbit every variant follows (id from presets.ts). */
  orbitFrom: z.string(),
  /** Seconds the cursor rests in the logo's pose. */
  holdSeconds: z.number().min(0).max(10),
  /** Seconds for one full trip around the sun. */
  travelSeconds: z.number().min(0.3).max(10),
  /** The travel's easing, as cubic-bezier(x1, y1, x2, y2). */
  easeX1: z.number().min(0).max(1),
  easeY1: z.number().min(-1).max(2),
  easeX2: z.number().min(0).max(1),
  easeY2: z.number().min(-1).max(2),
});

export type LogoShowcaseProps = z.infer<typeof logoShowcaseSchema>;

export const logoShowcaseDefaults: LogoShowcaseProps = {
  logoScale: 0.7,
  cursorsPerVariant: 2,
  orbitFrom: "master-logo",
  holdSeconds: 0.9,
  travelSeconds: 1.6,
  // Strong ease-in-out for on-screen movement (Emil Kowalski's curve).
  easeX1: 0.77,
  easeY1: 0,
  easeX2: 0.175,
  easeY2: 1,
};

type Beat = { preset: LogoPreset; cursor: CursorId };

/** Every beat of the video, in order: each variant once per cursor shown. */
const beats = (cursorsPerVariant: number): Beat[] =>
  PRESETS.flatMap((preset) => preset.cursors.slice(0, cursorsPerVariant).map((cursor) => ({ preset, cursor })));

/** Rest, travel, rest, travel … rest: the last beat ends at rest. */
const totalSeconds = (p: LogoShowcaseProps): number => {
  const n = beats(p.cursorsPerVariant).length;
  return n * p.holdSeconds + (n - 1) * p.travelSeconds;
};

export const calculateLogoShowcaseMetadata: CalculateMetadataFunction<LogoShowcaseProps> = ({ props }) => ({
  durationInFrames: Math.max(1, Math.round(totalSeconds(props) * FPS)),
});

export const LogoShowcase: React.FC<LogoShowcaseProps> = (props) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const seconds = frame / fps;
  const all = beats(props.cursorsPerVariant);
  const orbit = (PRESETS.find((p) => p.id === props.orbitFrom) ?? PRESETS[0]).config.orbit;

  // Where we are: which beat, and how far through its travel (0 while resting).
  const cycle = props.holdSeconds + props.travelSeconds;
  const index = Math.min(Math.floor(seconds / cycle), all.length - 1);
  const intoCycle = seconds - index * cycle;
  const travelling = index < all.length - 1 && intoCycle > props.holdSeconds;
  const progress = travelling
    ? Easing.bezier(props.easeX1, props.easeY1, props.easeX2, props.easeY2)(
        Math.min((intoCycle - props.holdSeconds) / props.travelSeconds, 1),
      )
    : 0;

  // The turn starts at the rest angle; it comes out from behind the sun when
  // it passes 360°, and that is where the next beat's cursor takes over.
  const angle = orbit.angle + 360 * progress;
  const beat = angle >= 360 ? all[index + 1] : all[index];
  const base = beat.preset.config;

  // A spinning globe turns with time; computed per frame so renders are exact.
  const style: LogoConfig["style"] =
    base.style.kind === "globe" ? { ...base.style, turn: base.style.turn + base.style.spin * seconds } : base.style;

  const config: LogoConfig = {
    ...base,
    style,
    cursor: beat.cursor,
    orbit: { ...orbit, angle: angle % 360 },
    // The video's own background is brand-white: the logo needs no backdrop.
    backdrop: false,
  };

  return (
    <AbsoluteFill style={{ backgroundColor: colors.brandWhite, alignItems: "center", justifyContent: "center" }}>
      <Logo config={config} size={Math.min(width, height) * props.logoScale} still bleed />
    </AbsoluteFill>
  );
};
