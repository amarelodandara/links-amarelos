import { useLayoutEffect, useRef } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import type { FieldScene, FieldColors, ViewTuning } from "./scene";
import { VIEW_DEFAULTS, createFieldScene } from "./scene";
import type { FieldScript } from "./timeline";
import { simulateAt } from "./timeline";

/**
 * O campo num `<canvas>` do tamanho pedido. A cena WebGL nasce uma vez; a cada
 * frame a simulação é levada até o tempo do frame e desenhada na hora, dentro
 * do layout effect, antes do Remotion tirar o print.
 */
export const FieldCanvas: React.FC<{
  width: number;
  height: number;
  script: FieldScript;
  colors: FieldColors;
  view?: ViewTuning;
  /** Quanto (0 → 1) da vista de lado já entrou neste frame. */
  side?: number;
}> = ({ width, height, script, colors, view = VIEW_DEFAULTS, side = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<FieldScene | null>(null);

  // Recria a cena quando muda algo que ela fixa na criação.
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const scene = createFieldScene(canvas, { width, height }, colors, view);
    sceneRef.current = scene;
    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
  }, [width, height, colors, view]);

  useLayoutEffect(() => {
    sceneRef.current?.render(simulateAt(script, frame / fps), side);
  });

  return <canvas ref={canvasRef} width={width} height={height} style={{ width, height, display: "block" }} />;
};
