import { AbsoluteFill, Img, useVideoConfig } from "remotion";
import type { CalculateMetadataFunction } from "remotion";
import { z } from "zod";
import { PIXEL } from "../design/fonts";
import playerPng from "../design/assets/mp3-player.png";
import { FPS, settings } from "../settings";
import { Marquee } from "./Destaque";

/**
 * A seamless loop of the destaque's mp3 player: the marquee runs on the
 * screen and the GIF ends where it starts. Same player, screen tint and
 * marquee as the destaque, scaled to `playerHeight`.
 */

const D = settings.formats.destaque;
const c = settings.colors;
const PLAYER = D.falando.player;
const VISOR = D.falando.visor;

export const mp3LoopSchema = z.object({
  /** Episode number, for the "ondas amarelas #N.mp3" marquee. */
  numero: z.number().int().positive(),
  /** Player height as a share of the frame height. */
  playerHeight: z.number().min(0.2).max(1),
});

export type Mp3LoopProps = z.infer<typeof mp3LoopSchema>;

export const mp3LoopDefaults: Mp3LoopProps = { numero: 10, playerHeight: 0.85 };

const marqueeText = (numero: number): string => `ondas amarelas #${numero}.mp3   ✦   `;

/** One loop = the marquee moving by exactly one copy of its text. */
export const calculateMp3LoopMetadata: CalculateMetadataFunction<Mp3LoopProps> = async ({ props }) => {
  // The player is drawn at its destaque size and scaled as a whole, so measure at that size.
  const font = `${VISOR.fontSize}px "${PIXEL}"`;
  await document.fonts.load(font);
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return { durationInFrames: FPS * 4 };
  ctx.font = font;
  const copyWidth = ctx.measureText(marqueeText(props.numero)).width;
  return { durationInFrames: Math.max(1, Math.round((copyWidth / D.marqueePxPerSecond) * FPS)) };
};

export const Mp3Loop: React.FC<Mp3LoopProps> = ({ numero, playerHeight }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: c.sunLighter }}>
      <PlayerScaled numero={numero} playerHeight={playerHeight} />
    </AbsoluteFill>
  );
};

export function PlayerScaled({ numero, playerHeight }: Mp3LoopProps) {
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <ScaledBox playerHeight={playerHeight}>
        <Img src={playerPng} style={{ position: "absolute", left: 0, top: 0, width: PLAYER.width, height: PLAYER.height }} />
        <div
          style={{
            position: "absolute",
            left: VISOR.left - PLAYER.left,
            top: VISOR.top - PLAYER.top,
            width: VISOR.width,
            height: VISOR.height,
            backgroundColor: c.sun,
            mixBlendMode: "color",
          }}
        />
        <Marquee
          text={marqueeText(numero)}
          left={VISOR.left - PLAYER.left}
          top={VISOR.top - PLAYER.top}
          width={VISOR.width}
          height={VISOR.height}
          fontSize={VISOR.fontSize}
          lineHeight={VISOR.lineHeight}
          textLeft={VISOR.textLeft}
        />
      </ScaledBox>
    </AbsoluteFill>
  );
}

type ScaledBoxProps = { playerHeight: number; children: React.ReactNode };

/** The player at its destaque size, scaled as one piece so the marquee keeps its proportions. */
function ScaledBox({ playerHeight, children }: ScaledBoxProps) {
  const { height } = useVideoConfig();
  return (
    <div
      style={{
        position: "relative",
        width: PLAYER.width,
        height: PLAYER.height,
        flexShrink: 0,
        transform: `scale(${(playerHeight * height) / PLAYER.height})`,
      }}
    >
      {children}
    </div>
  );
}
