import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { SANS } from "../../design/fonts";
import type { Edition } from "../../schema/edition";
import type { Theme } from "../../design/theme";
import type { Layout } from "../../settings";
import { SCENES, settings } from "../../settings";

/**
 * Cena que substitui as 4 tabs quando a edição tem `chant`: as frases vão
 * enchendo a tela de cima a baixo, uma linha por vez e alternando entre si, na
 * tipografia do título da abertura.
 *
 * As linhas aceleram: a primeira demora a chegar, as de baixo vêm cada vez mais
 * em cima umas das outras. Assim que a última assenta, o texto todo pisca em
 * vermelho e a cena acaba ali — ela é mais curta que as 4 tabs, e o vídeo
 * encurta junto (ver `middleSceneFrames`).
 */

/** Frames que as linhas levam pra encher a tela. */
const FILL_FRAMES = 168;
/** Quanto a entrada acelera: 1 é ritmo constante, mais alto acelera mais. */
const ACCELERATION = 2.4;
const ENTER_FRAMES = 6;
/** Duração do vermelho, logo depois da última linha assentar. */
const FLASH_FRAMES = 8;
const FLASH_COLOR = "#D10000";
const FLASH_START = FILL_FRAMES + ENTER_FRAMES;

/** Duração da cena do meio: as 4 tabs, ou o chant até o fim do vermelho. */
export const middleSceneFrames = (edition: Edition): number =>
  edition.chant?.length ? FLASH_START + FLASH_FRAMES : SCENES.perTab * 4;

/** Duração do vídeo inteiro, que encolhe quando a cena do meio é o chant. */
export const videoDurationInFrames = (edition: Edition): number =>
  SCENES.opening + middleSceneFrames(edition) + SCENES.cta;

export const ChantScene: React.FC<{ lines: string[]; theme: Theme; layout: Layout }> = ({
  lines,
  theme,
  layout,
}) => {
  const frame = useCurrentFrame();
  const { height } = useVideoConfig();
  const t = settings.typography.openingTitle;

  // Mesma escala e mesma margem da abertura em cada formato.
  const scale = layout.opening.scale;
  const fontSize = t.sizePx * scale;
  const lineHeight = t.lineHeightPx * scale;
  const pad = layout.opening.insetXPx;
  const rows = Math.max(1, Math.floor((height - pad * 2) / lineHeight));

  // Instante de entrada de cada linha numa curva que desacelera no tempo: os
  // intervalos encolhem a cada linha, e a tela enche cada vez mais rápido.
  const starts = Array.from({ length: rows }, (_, row) => {
    const progress = rows > 1 ? row / (rows - 1) : 1;
    return Math.round((1 - (1 - progress) ** ACCELERATION) * FILL_FRAMES);
  });

  return (
    <AbsoluteFill
      style={{
        padding: pad,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        color: frame >= FLASH_START && frame < FLASH_START + FLASH_FRAMES ? FLASH_COLOR : theme.ink,
        fontFamily: SANS,
        fontWeight: t.weight,
        fontSize,
        letterSpacing: `${t.trackingEm}em`,
        lineHeight: `${lineHeight}px`,
      }}
    >
      {starts.map((start, row) => {
        const enter = interpolate(frame, [start, start + ENTER_FRAMES], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <div
            key={row}
            style={{
              opacity: enter,
              transform: `translateY(${interpolate(enter, [0, 1], [lineHeight * 0.35, 0])}px)`,
              whiteSpace: "nowrap",
            }}
          >
            {lines[row % lines.length]}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
