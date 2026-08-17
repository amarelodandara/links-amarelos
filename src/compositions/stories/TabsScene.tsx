import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { EditionEntry } from "../../schema/edition";
import { tabAssetPath } from "../../schema/edition";
import { SANS } from "../../design/fonts";
import type { Theme } from "../../design/theme";
import { SCENES, settings } from "../../settings";

/**
 * Cena das 4 tabs (artboards "links+ondas - tabs" / "Hyperlinks — Tab"): uma
 * janela de navegador fixa; a cada segmento trocam o título da aba ativa
 * (nome do autor) e a imagem da página, com um crossfade curto.
 */

const SWAP_FRAMES = 8;

const InactiveTab: React.FC<{ theme: Theme; right: number }> = ({ theme, right }) => (
  <div
    style={{
      position: "absolute",
      right,
      bottom: 0,
      width: 84,
      height: 66,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "16px 16px 0 0",
      backgroundColor: theme.window.inactiveTabSurface,
      border: `2px solid ${theme.window.inactiveTabBorder}`,
      borderBottom: "none",
    }}
  >
    <span
      style={{
        fontFamily: SANS,
        fontWeight: 600,
        fontSize: 28,
        letterSpacing: "0.02em",
        opacity: 0.45,
        color: theme.window.tabText,
      }}
    >
      ...
    </span>
  </div>
);

export const TabsScene: React.FC<{ entry: EditionEntry; theme: Theme }> = ({
  entry,
  theme,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const w = settings.browserWindow;
  const t = settings.typography;

  const tabIndex = Math.min(3, Math.floor(frame / SCENES.perTab));
  const frameInTab = frame - tabIndex * SCENES.perTab;
  const tab = entry.edition.tabs[tabIndex];

  // Janela entra uma vez, no começo da cena; os segmentos seguintes só trocam conteúdo.
  const enter = spring({ frame, fps, config: { damping: 16, mass: 0.9 } });
  const windowY = interpolate(enter, [0, 1], [140, 0]);

  // Crossfade curto na troca de tab (não roda na primeira, que entra com a janela).
  const swap =
    tabIndex === 0
      ? 1
      : interpolate(frameInTab, [0, SWAP_FRAMES], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: w.left,
          top: w.top,
          width: w.width,
          height: w.height,
          display: "flex",
          flexDirection: "column",
          borderRadius: w.radius,
          overflow: "hidden",
          backgroundColor: theme.window.surface,
          border: `${w.borderWidth}px solid ${theme.window.border}`,
          boxShadow: "#FFFFFFE6 0px 2px 0px inset, #110A032E 0px 28px 64px",
          opacity: enter,
          transform: `translateY(${windowY}px)`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            paddingTop: 22,
            paddingRight: 32,
            paddingLeft: 26,
            gap: 20,
            backgroundImage: `linear-gradient(180deg, ${theme.window.chromeTop} 0%, ${theme.window.chromeBottom} 100%)`,
            borderBottom: `2px solid ${theme.window.chromeBorder}`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              width: 88,
              flexShrink: 0,
              paddingBottom: 14,
              gap: 12,
            }}
          >
            <div style={{ width: 20, height: 20, borderRadius: 999, backgroundColor: "#FF5C5F", opacity: 0.85 }} />
            <div style={{ width: 20, height: 20, borderRadius: 999, backgroundColor: "#FAC800", opacity: 0.85 }} />
            <div style={{ width: 20, height: 20, borderRadius: 999, backgroundColor: "#34C759" }} />
          </div>
          <div style={{ position: "relative", flexGrow: 1, minWidth: 0, height: 78 }}>
            <InactiveTab theme={theme} right={128} />
            <InactiveTab theme={theme} right={64} />
            <InactiveTab theme={theme} right={0} />
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 192,
                top: 0,
                bottom: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                paddingLeft: 26,
                paddingRight: 26,
                borderRadius: "18px 18px 0 0",
                backgroundColor: theme.window.surface,
                border: `2px solid ${theme.window.chromeBorder}`,
                borderBottom: "none",
                boxShadow: "#FFFFFFE6 0px -2px 0px inset",
              }}
            >
              <span
                style={{
                  fontFamily: SANS,
                  fontWeight: t.tabTitle.weight,
                  fontSize: t.tabTitle.sizePx,
                  letterSpacing: `${t.tabTitle.trackingEm}em`,
                  lineHeight: `${t.tabTitle.lineHeightPx}px`,
                  color: theme.window.tabText,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  opacity: swap,
                }}
              >
                {tab.author}
              </span>
            </div>
          </div>
        </div>
        <div
          style={{
            flexGrow: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: w.contentPadding,
            backgroundColor: theme.window.surface,
            minHeight: 0,
          }}
        >
          <Img
            src={staticFile(tabAssetPath(entry, tabIndex))}
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
              opacity: swap,
              transform: `scale(${interpolate(swap, [0, 1], [1.02, 1])})`,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
