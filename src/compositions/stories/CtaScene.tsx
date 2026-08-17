import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { Edition } from "../../schema/edition";
import { MONO, SANS } from "../../design/fonts";
import type { Theme } from "../../design/theme";
import { settings } from "../../settings";

/**
 * Cena de encerramento (artboards "links + ondas - CTA" / "Hyperlinks — CTA"):
 * "vem aí" + data no canto superior direito, pill com o @ centralizada.
 */

/** "2026-08-15" → "15/08" (o design mostra só dia/mês). */
const formatAirDate = (airDate: string): string => {
  const [, month, day] = airDate.split("-");
  return `${day}/${month}`;
};

export const CtaScene: React.FC<{ edition: Edition; theme: Theme }> = ({
  edition,
  theme,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = settings.typography;

  const dateIn = {
    opacity: interpolate(frame, [0, 12], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    transform: `translateY(${interpolate(frame, [0, 12], [-24, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })}px)`,
  };
  const pillPop = spring({ frame: frame - 6, fps, config: { damping: 13, mass: 0.7 } });

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 789,
          top: 74,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 7,
          color: theme.cta.dateText,
          mixBlendMode: theme.cta.dateBlendMode,
          ...dateIn,
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
            fontWeight: t.ctaDate.weight,
            fontSize: t.ctaDate.sizePx,
            letterSpacing: `${t.ctaDate.trackingEm}em`,
            lineHeight: 1,
          }}
        >
          {formatAirDate(edition.airDate)}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          translate: "-50% -50%",
          padding: 64,
          borderRadius: 20,
          backgroundColor: theme.cta.pillSurface,
          opacity: Math.min(1, pillPop * 1.4),
          transform: `scale(${interpolate(pillPop, [0, 1], [0.85, 1])})`,
        }}
      >
        <div
          style={{
            fontFamily: MONO,
            fontWeight: t.ctaHandle.weight,
            fontSize: t.ctaHandle.sizePx,
            lineHeight: "34px",
            opacity: 0.7,
            color: theme.cta.pillText,
            whiteSpace: "nowrap",
          }}
        >
          {settings.handle}
        </div>
      </div>
    </AbsoluteFill>
  );
};
