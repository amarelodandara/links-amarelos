import { AbsoluteFill, Easing, Img, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { CalculateMetadataFunction } from "remotion";
import type { CSSProperties } from "react";
import { z } from "zod";
import { SCALES, SCALE_NAMES, toHex } from "@links/brand";
import { Logo, PRESETS } from "@links/brand/logo";
import type { LogoConfig } from "@links/brand/logo";
import { MONO, PIXEL_STYLES, SANS, SERIF } from "../design/fonts";
import { PLATFORM_ORDER, PlatformIcon } from "../design/PlatformIcon";
import { FPS } from "../settings";
import { PlayerScaled } from "./Mp3Loop";

/**
 * Brand reel, for a GIF: quick cuts between pieces we already published and
 * the brand's parts on their own (logo, crayon logo, palette, the four Geist
 * variants, the mp3 player, the platform icons).
 *
 * Pieces are read from apps/crayola/outputs, so render with that as the
 * public dir:
 *   npx remotion render BrandReel outputs/gif/brand-reel.gif --public-dir=outputs --codec=gif --scale=0.5 --every-nth-frame=2
 * In the studio, start it with `--public-dir=outputs` too, or the pieces 404.
 */

/** A slide: a published piece (path under outputs/) or one of the brand's parts. */
type Slide =
  | { kind: "piece"; src: string }
  | { kind: "logo"; preset: "master-logo" | "crayola" }
  | { kind: "palette" }
  | { kind: "type" }
  | { kind: "player" }
  | { kind: "icons" };

const SLIDES: readonly Slide[] = [
  { kind: "logo", preset: "master-logo" },
  { kind: "piece", src: "links+ondas-10/anuncio-feed.png" },
  { kind: "palette" },
  { kind: "piece", src: "links-ondas/009-abracadabra/instagram-feed/01.png" },
  { kind: "type" },
  { kind: "piece", src: "caiunarede/onde-da-pra-conversar-capa.png" },
  { kind: "player" },
  { kind: "piece", src: "links-ondas/017-voces-sabem/instagram-feed/03.png" },
  { kind: "logo", preset: "crayola" },
  { kind: "piece", src: "links-ondas/009-abracadabra/instagram-feed/02.png" },
  { kind: "icons" },
  { kind: "piece", src: "links-ondas/009-abracadabra/instagram-feed/06.png" },
];

export const brandReelSchema = z.object({
  /** Seconds each slide stays up. */
  slideSeconds: z.number().min(0.2).max(3),
  /** Seconds for a slide to settle in after the cut. */
  enterSeconds: z.number().min(0).max(1),
  /** Scale a slide starts from on the cut (1 = no zoom). */
  enterScale: z.number().min(0.5).max(1.5),
  /** Piece size as a share of the frame (pieces are shown whole, as cards). */
  pieceScale: z.number().min(0.4).max(1),
  /** Card corner radius and border, in px at 1080. */
  cardRadius: z.number().min(0).max(80),
  cardBorder: z.number().min(0).max(20),
  /** Logo size as a share of the frame. */
  logoScale: z.number().min(0.2).max(1),
});

export type BrandReelProps = z.infer<typeof brandReelSchema>;

export const brandReelDefaults: BrandReelProps = {
  slideSeconds: 0.7,
  enterSeconds: 0.25,
  enterScale: 0.94,
  pieceScale: 0.82,
  cardRadius: 24,
  cardBorder: 4,
  logoScale: 0.62,
};

export const calculateBrandReelMetadata: CalculateMetadataFunction<BrandReelProps> = ({ props }) => ({
  durationInFrames: Math.max(1, Math.round(SLIDES.length * props.slideSeconds * FPS)),
});

/* ── Colors (semantic names from packages/brand/src/scales.ts) ──────────── */

function hexOf(name: string): string {
  for (const scale of SCALE_NAMES) {
    const step = SCALES[scale].find((s) => s.name === name);
    if (step) return toHex(step);
  }
  return "#000000";
}

const PAINT = hexOf("paint");
const PEN = hexOf("pen");
const SUN = hexOf("sun");
const SUNRAY = hexOf("sunray");

/** Background behind each kind of slide, so the cuts alternate. */
const BACKDROP = {
  piece: SUN,
  logo: PAINT,
  palette: PAINT,
  type: SUNRAY,
  player: SUNRAY,
  icons: PAINT,
} as const satisfies Record<Slide["kind"], string>;

/* ── Composition ────────────────────────────────────────────────────────── */

export const BrandReel: React.FC<BrandReelProps> = (p) => {
  const slideFrames = Math.max(1, Math.round(p.slideSeconds * FPS));
  return (
    <AbsoluteFill style={{ background: PAINT }}>
      {SLIDES.map((slide, i) => (
        <Sequence key={i} from={i * slideFrames} durationInFrames={slideFrames}>
          <SlideFrame slide={slide} props={p} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

type SlideFrameProps = { slide: Slide; props: BrandReelProps };

function SlideFrame({ slide, props }: SlideFrameProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = interpolate(frame / fps, [0, Math.max(0.001, props.enterSeconds)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.23, 1, 0.32, 1),
  });
  const scale = props.enterScale + (1 - props.enterScale) * enter;
  const inner: CSSProperties = {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transform: `scale(${scale})`,
  };
  return (
    <AbsoluteFill style={{ background: BACKDROP[slide.kind] }}>
      <div style={inner}>
        <SlideBody slide={slide} props={props} />
      </div>
    </AbsoluteFill>
  );
}

function SlideBody({ slide, props }: SlideFrameProps) {
  const { width, height } = useVideoConfig();
  const side = Math.min(width, height);
  switch (slide.kind) {
    case "piece":
      return (
        <Img
          src={staticFile(slide.src)}
          style={{
            maxWidth: width * props.pieceScale,
            maxHeight: height * props.pieceScale,
            borderRadius: props.cardRadius,
            border: `${props.cardBorder}px solid ${PEN}`,
            boxSizing: "border-box",
          }}
        />
      );
    case "logo": {
      const preset = PRESETS.find((x) => x.id === slide.preset) ?? PRESETS[0];
      const config: LogoConfig = { ...preset.config, backdrop: false };
      return <Logo config={config} size={side * props.logoScale} still />;
    }
    case "palette":
      return <Palette size={side} />;
    case "type":
      return <TypeGrid size={side} />;
    case "player":
      return <PlayerScaled numero={10} playerHeight={0.85} />;
    case "icons":
      return (
        <div style={{ display: "flex", gap: side * 0.09, alignItems: "center", transform: "scale(2.6)" }}>
          {PLATFORM_ORDER.map((platform) => (
            <PlatformIcon key={platform} platform={platform} />
          ))}
        </div>
      );
  }
}

type SizeProps = { size: number };

/** Every named color as a tall swatch, grouped by scale, with its name. */
function Palette({ size }: SizeProps) {
  const gap = size * 0.012;
  return (
    <div style={{ display: "flex", gap: size * 0.035, height: size * 0.62 }}>
      {SCALE_NAMES.map((scale) => (
        <div key={scale} style={{ display: "flex", gap }}>
          {SCALES[scale].map((step) => (
            <div key={step.step} style={{ display: "flex", flexDirection: "column", gap: size * 0.018 }}>
              <div
                style={{
                  flex: 1,
                  width: size * 0.092,
                  borderRadius: size * 0.014,
                  background: toHex(step),
                  boxShadow: `inset 0 0 0 ${size * 0.003}px ${PEN}`,
                }}
              />
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: size * 0.021,
                  color: PEN,
                  textAlign: "center",
                }}
              >
                {step.name}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/** "Aa" in each Geist variant, labelled with the variant's name. */
const TYPE_CELLS = [
  { family: SANS, label: "sans" },
  { family: MONO, label: "mono" },
  { family: PIXEL_STYLES.square, label: "pixel" },
  { family: SERIF, label: "serif" },
] as const;

function TypeGrid({ size }: SizeProps) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: size * 0.03 }}>
      {TYPE_CELLS.map((cell) => (
        <div
          key={cell.label}
          style={{
            width: size * 0.36,
            height: size * 0.36,
            borderRadius: size * 0.03,
            border: `${size * 0.004}px solid ${PEN}`,
            background: PAINT,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: PEN,
          }}
        >
          <span style={{ fontFamily: cell.family, fontSize: size * 0.16, lineHeight: 1 }}>Aa</span>
          <span style={{ fontFamily: MONO, fontSize: size * 0.024, marginTop: size * 0.03 }}>{cell.label}</span>
        </div>
      ))}
    </div>
  );
}
