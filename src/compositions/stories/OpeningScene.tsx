import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { Edition } from "../../schema/edition";
import { MONO, SANS } from "../../design/fonts";
import { HyperlinksLogotype, LinksLogotype, OndasLogotype, SunCursorMark } from "../../design/marks";
import type { Theme } from "../../design/theme";
import { settings } from "../../settings";

/**
 * Cena de abertura (artboards "links+ondas - opening" / "Hyperlinks — Abertura"):
 * sol + cursor, "essa semana nos", logo do tema, byline. Entradas escalonadas.
 */
export const OpeningScene: React.FC<{ edition: Edition; theme: Theme }> = ({
  edition,
  theme,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = settings.typography;
  const c = settings.colors;

  const sunScale = spring({ frame, fps, config: { damping: 14, mass: 0.8 } });
  const enter = (from: number) => ({
    opacity: interpolate(frame, [from, from + 14], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    transform: `translateY(${interpolate(frame, [from, from + 14], [30, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })}px)`,
  });

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 88,
          top: 564,
          width: 1080 - 2 * 88,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 128,
          color: theme.ink,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
          <div style={{ transform: `scale(${sunScale})` }}>
            <SunCursorMark />
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 40 }}>
            <div
              style={{
                ...enter(6),
                fontFamily: SANS,
                fontWeight: t.openingTitle.weight,
                fontSize: t.openingTitle.sizePx,
                letterSpacing: `${t.openingTitle.trackingEm}em`,
                lineHeight: `${t.openingTitle.lineHeightPx}px`,
                textAlign: "center",
              }}
            >
              essa semana nos
            </div>
            {edition.type === "links-ondas" ? (
              <div
                style={{
                  ...enter(12),
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 24,
                }}
              >
                <LinksLogotype />
                <OndasLogotype />
              </div>
            ) : (
              <div
                style={{
                  ...enter(12),
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <HyperlinksLogotype textColor={c.codeLighter} barColor={c.codeLight} />
                {edition.theme ? (
                  <div
                    style={{
                      fontFamily: MONO,
                      fontWeight: t.hyperlinksTheme.weight,
                      fontStyle: "italic",
                      fontSize: t.hyperlinksTheme.sizePx,
                      letterSpacing: `${t.hyperlinksTheme.trackingEm}em`,
                      lineHeight: 1,
                      color: c.codeLighter,
                      textDecoration: `underline ${t.hyperlinksTheme.underlinePx}px ${c.codeLighter}`,
                      textUnderlinePosition: "from-font",
                      textAlign: "center",
                    }}
                  >
                    {`{${edition.theme}}`}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
        <div
          style={{
            ...enter(24),
            fontFamily: SANS,
            fontWeight: t.openingByline.weight,
            fontSize: t.openingByline.sizePx,
            letterSpacing: `${t.openingByline.trackingEm}em`,
            lineHeight: `${t.openingByline.lineHeightPx}px`,
            textAlign: "center",
          }}
        >
          por amarelo dandara
        </div>
      </div>
    </AbsoluteFill>
  );
};
