import { useMemo } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Edition } from "../../schema/edition";
import { MONO, SANS } from "../../design/fonts";
import type { Theme } from "../../design/theme";
import type { Layout } from "../../settings";
import { SCENES, settings } from "../../settings";

/**
 * Cena de encerramento (artboards "links + ondas - CTA" / "Hyperlinks — CTA"):
 * "vem aí" + data quicando pela tela no estilo do logo de DVD, e os canais
 * entrando um a um como caixas de diálogo espalhadas, por cima da data.
 */

const WEEKDAYS = [
  "domingo",
  "segunda",
  "terça",
  "quarta",
  "quinta",
  "sexta",
  "sábado",
] as const;

/**
 * `airDate` é uma data civil, não um instante: `new Date("2026-08-22")` é lido
 * como meia-noite UTC e volta um dia atrás em fuso negativo. Daí o parse manual.
 */
const parseAirDate = (airDate: string) => {
  const [year, month, day] = airDate.split("-").map(Number);
  return { year, month, day, weekday: WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()] };
};

/**
 * Um eixo do quique, resolvido direto do frame — sem estado acumulado, porque
 * o Remotion pode renderizar qualquer frame fora de ordem.
 *
 * A trajetória é uma onda triangular: a distância percorrida dobra sobre o
 * intervalo `[0, span]`. `bounces` conta quantas paredes já foram batidas, e é
 * ele que decide a cor.
 */
const axis = (start: number, speed: number, frame: number, span: number) => {
  const travelled = start + speed * frame;
  const period = span * 2;
  const wrapped = ((travelled % period) + period) % period;

  return {
    position: wrapped <= span ? wrapped : period - wrapped,
    bounces: Math.floor(travelled / span),
  };
};

/**
 * Resolve o quique para um formato. Precisa ser por formato e não constante de
 * módulo: o curso do eixo Y no 1:1 é quase metade do 9:16, o que muda em que
 * frame cada parede e cada canto acontecem.
 */
const solveBounce = (layout: Layout, width: number, height: number) => {
  const b = layout.ctaDateBounce;
  const spanX = width - b.boxWidthPx;
  const spanY = height - b.boxHeightPx;

  const boxAt = (frame: number) => ({
    x: axis(b.startXPx, b.speedXPerFrame, frame, spanX),
    y: axis(b.startYPx, b.speedYPerFrame, frame, spanY),
  });

  /**
   * "Canto" com folga: exigir as duas paredes no mesmo frame é raro demais para
   * acontecer dentro da cena. Vale como canto estar a `cornerNearPx` de uma
   * parede vertical e de uma horizontal ao mesmo tempo.
   */
  const isNearCorner = (frame: number): boolean => {
    const { x, y } = boxAt(frame);
    return (
      Math.min(x.position, spanX - x.position) <= b.cornerNearPx &&
      Math.min(y.position, spanY - y.position) <= b.cornerNearPx
    );
  };

  /**
   * Frames em que a caixa *entra* num canto. Só a borda de subida conta — dentro
   * de um canto ela fica perto por vários frames seguidos, e isso é um evento só.
   */
  const cornerFrames = Array.from({ length: SCENES.cta }, (_, frame) => frame).filter(
    (frame) => frame > 0 && isNearCorner(frame) && !isNearCorner(frame - 1),
  );

  return { box: b, boxAt, cornerFrames };
};

/**
 * Caixa de CTA. O bevel (claro em cima/à esquerda, escuro embaixo/à direita)
 * é o que faz ler como diálogo de sistema antigo em vez de card.
 */
const CtaDialog: React.FC<{
  label: string;
  position: { leftPx: number; topPx: number };
  widthPx: number;
  theme: Theme;
}> = ({ label, position, widthPx, theme }) => {
  const t = settings.typography;

  return (
    <div
      style={{
        position: "absolute",
        left: position.leftPx,
        top: position.topPx,
        width: widthPx,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 24,
        paddingTop: 34,
        paddingBottom: 26,
        paddingLeft: 32,
        paddingRight: 32,
        backgroundColor: theme.window.surface,
        border: `2px solid ${theme.cta.pillText}`,
        boxShadow: `#FFFFFFE6 2px 2px 0px inset, ${theme.cta.pillText}33 -2px -2px 0px inset, #110A0338 0px 16px 40px`,
      }}
    >
      <span
        style={{
          fontFamily: MONO,
          fontWeight: t.ctaLink.weight,
          fontSize: t.ctaLink.sizePx,
          lineHeight: `${t.ctaLink.lineHeightPx}px`,
          color: theme.cta.pillText,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
      <span
        style={{
          paddingTop: 8,
          paddingBottom: 8,
          paddingLeft: 34,
          paddingRight: 34,
          fontFamily: MONO,
          fontWeight: t.ctaDialogButton.weight,
          fontSize: t.ctaDialogButton.sizePx,
          letterSpacing: `${t.ctaDialogButton.trackingEm}em`,
          lineHeight: 1,
          color: theme.cta.pillText,
          backgroundColor: theme.window.inactiveTabSurface,
          border: `2px solid ${theme.cta.pillText}`,
          boxShadow: "#FFFFFFE6 2px 2px 0px inset",
        }}
      >
        OK
      </span>
    </div>
  );
};

export const CtaScene: React.FC<{
  edition: Edition;
  theme: Theme;
  layout: Layout;
}> = ({ edition, theme, layout }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = settings.typography;
  const D = settings.ctaDialogs;

  const { box, boxAt, cornerFrames } = useMemo(
    () => solveBounce(layout, width, height),
    [layout, width, height],
  );

  const { x, y } = boxAt(frame);
  const palette = theme.cta.dateColors;
  const color = palette[(x.bounces + y.bounces) % palette.length];

  // Cada canto batido troca data ↔ dia da semana e dá um pulso de escala.
  const cornersHit = cornerFrames.filter((corner) => corner <= frame).length;
  const showsWeekday = cornersHit % 2 === 1;
  const lastCorner = cornerFrames[cornersHit - 1] ?? -Infinity;
  const cornerPop = interpolate(frame - lastCorner, [0, 4, 10], [1.22, 1.06, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const date = parseAirDate(edition.airDate);
  const dateOpacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: x.position,
          top: y.position,
          width: box.boxWidthPx,
          height: box.boxHeightPx,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 7,
          // Cor viva fora da paleta: blend mode aqui só lavaria o efeito.
          color,
          opacity: dateOpacity,
          transform: `scale(${cornerPop})`,
        }}
      >
        <div
          style={{
            fontFamily: SANS,
            fontWeight: t.ctaKicker.weight,
            fontSize: t.ctaKicker.sizePx,
            letterSpacing: `${t.ctaKicker.trackingEm}em`,
            lineHeight: 1,
          }}
        >
          vem aí
        </div>
        <div
          style={{
            fontFamily: SANS,
            fontWeight: showsWeekday ? t.ctaWeekday.weight : t.ctaDate.weight,
            fontSize: showsWeekday ? t.ctaWeekday.sizePx : t.ctaDate.sizePx,
            letterSpacing: `${showsWeekday ? t.ctaWeekday.trackingEm : t.ctaDate.trackingEm}em`,
            lineHeight: 1,
            whiteSpace: "nowrap",
          }}
        >
          {showsWeekday
            ? date.weekday
            : `${String(date.day).padStart(2, "0")}/${String(date.month).padStart(2, "0")}`}
        </div>
      </div>
      {settings.ctaLinks.map((label, index) => {
        /**
         * Snap puro: ou a janela está lá, ou não está. Nada de spring nem fade
         * — caixa de erro de sistema antigo aparece inteira de um frame pro
         * outro, e é isso que vende a referência.
         */
        const appearsAt =
          Math.round(D.startSeconds * fps) + Math.round(index * D.stepSeconds * fps);

        if (frame < appearsAt) {
          return null;
        }

        return (
          <CtaDialog
            key={label}
            label={label}
            position={layout.ctaDialogs.positions[index]}
            widthPx={layout.ctaDialogs.widthPx}
            theme={theme}
          />
        );
      })}
    </AbsoluteFill>
  );
};
