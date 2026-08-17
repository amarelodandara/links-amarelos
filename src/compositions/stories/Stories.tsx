import { AbsoluteFill, Sequence } from "remotion";
import type { EditionEntry } from "../../schema/edition";
import { Background } from "../../design/Background";
import { themes } from "../../design/theme";
import { SCENES } from "../../settings";
import { CtaScene } from "./CtaScene";
import { OpeningScene } from "./OpeningScene";
import { TabsScene } from "./TabsScene";

/**
 * Composition vertical 1080×1920 (Instagram Stories + Twitter/X + BlueSky):
 * abertura → 4 tabs → CTA, com cortes secos entre cenas — o movimento vem das
 * entradas de cada cena e do fundo dithered, que roda contínuo o vídeo todo.
 */
export const Stories: React.FC<{ entry: EditionEntry }> = ({ entry }) => {
  const theme = themes[entry.edition.type];

  return (
    <AbsoluteFill>
      <Background theme={theme} />
      <Sequence durationInFrames={SCENES.opening}>
        <OpeningScene edition={entry.edition} theme={theme} />
      </Sequence>
      <Sequence from={SCENES.opening} durationInFrames={SCENES.perTab * 4}>
        <TabsScene entry={entry} theme={theme} />
      </Sequence>
      <Sequence from={SCENES.opening + SCENES.perTab * 4} durationInFrames={SCENES.cta}>
        <CtaScene edition={entry.edition} theme={theme} />
      </Sequence>
    </AbsoluteFill>
  );
};
