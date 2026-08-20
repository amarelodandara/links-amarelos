import type { ReactNode } from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import type { EditionEntry } from "../schema/edition";
import { Background } from "../design/Background";
import { themes } from "../design/theme";
import { LAYOUTS, SCENES } from "../settings";
import { CtaScene } from "./scenes/CtaScene";
import { OpeningScene } from "./scenes/OpeningScene";
import { TabsScene } from "./scenes/TabsScene";

/**
 * Os 6 stills do carrossel do Substack, em 14:10 horizontal (seção 5 do plano):
 * capa → 4 tabs → CTA. Renderizado com `--sequence`, um PNG por frame.
 *
 * A composition roda a 1 fps, então `useCurrentFrame()` aqui é o número do
 * slide, não tempo. Cada slide reaproveita a cena correspondente do vídeo,
 * parada num frame em que as entradas já terminaram — é o que permite os stills
 * serem a mesma coisa que o vídeo, e não um segundo desenho que teria que ser
 * mantido em paralelo.
 */

const layout = LAYOUTS.carousel;

/**
 * Mostra uma cena parada num frame específico.
 *
 * `<Freeze>` não serve aqui: ele escreve o frame no contexto da timeline, e o
 * `useCurrentFrame` clampa esse valor em `durationInFrames` — como esta
 * composition tem 6 frames, qualquer alvo acima de 5 virava 5 e as cenas saíam
 * com as entradas ainda no começo (o sol aparecia inteiro só porque a 1 fps o
 * spring já tinha 5 segundos pra assentar). O deslocamento do `Sequence` é
 * subtraído depois do clamp, então chega no valor pedido.
 */
const AtFrame: React.FC<{ slide: number; frame: number; children: ReactNode }> = ({
  slide,
  frame,
  children,
}) => (
  <Sequence from={slide - frame} layout="none">
    {children}
  </Sequence>
);

/** Último frame de cada segmento: springs assentados, crossfade concluído. */
const SETTLED_OPENING = SCENES.opening - 1;
const settledTab = (tabIndex: number) => tabIndex * SCENES.perTab + SCENES.perTab - 1;

export const CarouselSlide: React.FC<{ entry: EditionEntry }> = ({ entry }) => {
  const slide = useCurrentFrame();
  const theme = themes[entry.edition.type];

  return (
    <AbsoluteFill>
      <Background theme={theme} />
      {slide === 0 ? (
        <AtFrame slide={slide} frame={SETTLED_OPENING}>
          <OpeningScene edition={entry.edition} theme={theme} layout={layout} />
        </AtFrame>
      ) : null}
      {slide >= 1 && slide <= 4 ? (
        <AtFrame slide={slide} frame={settledTab(slide - 1)}>
          <TabsScene entry={entry} theme={theme} layout={layout} />
        </AtFrame>
      ) : null}
      {slide === 5 ? (
        <AtFrame slide={slide} frame={layout.ctaStillFrame}>
          <CtaScene edition={entry.edition} theme={theme} layout={layout} />
        </AtFrame>
      ) : null}
    </AbsoluteFill>
  );
};
