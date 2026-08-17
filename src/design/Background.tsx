import { Dithering } from "@paper-design/shaders-react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { settings } from "../settings";
import type { Theme } from "./theme";
import { textureDataUri } from "./texture";

/**
 * Fundo padrão de todas as cenas: cor do tema + tile de textura + gradiente
 * dithered animado (mesmo preset do Paper). O shader recebe o tempo via prop
 * `frame` (milissegundos) derivado do frame do Remotion — determinístico no
 * render, animado no preview.
 */
export const Background: React.FC<{ theme: Theme }> = ({ theme }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = settings.dithering;

  return (
    <AbsoluteFill style={{ backgroundColor: theme.background }}>
      <AbsoluteFill
        style={{
          backgroundImage: `url("${textureDataUri(theme.textureColor)}")`,
          backgroundSize: `${settings.texture.tileSizePx}px ${settings.texture.tileSizePx}px`,
          backgroundPosition: "50% 50%",
          backgroundRepeat: "repeat",
        }}
      />
      <Dithering
        speed={0}
        frame={(frame / fps) * 1000}
        shape="sphere"
        type={d.type as "4x4"}
        size={d.size}
        scale={d.scale}
        colorBack="#00000000"
        colorFront={d.colorFront}
        style={{ position: "absolute", inset: 0, opacity: d.opacity }}
      />
    </AbsoluteFill>
  );
};
