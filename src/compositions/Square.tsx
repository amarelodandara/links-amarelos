import { AbsoluteFill, Sequence } from "remotion";
import type { EditionEntry } from "../schema/edition";
import { Background } from "../design/Background";
import { themes } from "../design/theme";
import { LAYOUTS, SCENES } from "../settings";
import { CtaScene } from "./scenes/CtaScene";
import { OpeningScene } from "./scenes/OpeningScene";
import { TabsScene } from "./scenes/TabsScene";

/**
 * Composition quadrada 1080×1080 (feed do Instagram + X + BlueSky).
 *
 * Mesmo roteiro e mesmas cenas do `Stories` — só o layout muda, e ele vem
 * inteiro de `settings.layouts.square`. Não é um desenho novo: é o 9:16
 * adaptado a uma tela que tem quase metade da altura.
 */
export const Square: React.FC<{ entry: EditionEntry }> = ({ entry }) => {
  const theme = themes[entry.edition.type];
  const layout = LAYOUTS.square;

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
