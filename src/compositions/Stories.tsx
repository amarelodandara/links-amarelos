import { AbsoluteFill, Sequence } from "remotion";
import type { EditionEntry } from "../schema/edition";
import { Background } from "../design/Background";
import { themes } from "../design/theme";
import { LAYOUTS, SCENES } from "../settings";
import { CtaScene } from "./scenes/CtaScene";
import { OpeningScene } from "./scenes/OpeningScene";
import { TabsScene } from "./scenes/TabsScene";

/**
 * Composition vertical 1080×1920 — só o Story do Instagram; feed, X e BlueSky
 * saem no `Square`. Abertura → 4 tabs → CTA, com cortes secos entre cenas: o
 * movimento vem das entradas de cada cena e do fundo dithered, que roda
 * contínuo o vídeo todo.
 *
 * O roteiro é o mesmo das duas peças; o que muda entre elas é só o layout.
 */
export const Stories: React.FC<{ entry: EditionEntry }> = ({ entry }) => {
  const theme = themes[entry.edition.type];
  const layout = LAYOUTS.stories;

  return (
    <AbsoluteFill>
      <Background theme={theme} />
      <Sequence durationInFrames={SCENES.opening}>
        <OpeningScene edition={entry.edition} theme={theme} layout={layout} />
      </Sequence>
      <Sequence from={SCENES.opening} durationInFrames={SCENES.perTab * 4}>
        <TabsScene entry={entry} theme={theme} layout={layout} />
      </Sequence>
      <Sequence from={SCENES.opening + SCENES.perTab * 4} durationInFrames={SCENES.cta}>
        <CtaScene edition={entry.edition} theme={theme} layout={layout} />
      </Sequence>
    </AbsoluteFill>
  );
};
