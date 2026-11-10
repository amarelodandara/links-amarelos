import { Dithering } from "@paper-design/shaders-react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { DITHERING, settings } from "../settings";
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
      {/* eslint-disable anti-slop/no-shape-in-symbol-names -- `shape` é o nome da prop na lib, não escolha nossa. */}
      <Dithering
        speed={0}
        frame={(frame / fps) * 1000}
        shape={DITHERING.figure}
        type={DITHERING.pattern}
        size={DITHERING.size}
        scale={DITHERING.scale}
        colorBack="#00000000"
        colorFront={DITHERING.colorFront}
        style={{ position: "absolute", inset: 0, opacity: DITHERING.opacity }}
      />
      {/* eslint-enable anti-slop/no-shape-in-symbol-names */}
    </AbsoluteFill>
  );
};
