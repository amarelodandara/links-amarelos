import { AbsoluteFill, Sequence, staticFile } from "remotion";
import type { CascadeStack } from "../caiunarede/Cascade";
import { Cascade, cascadeEnd } from "../caiunarede/Cascade";
import type { CaiuNaRedeProps } from "../CaiuNaRede";
import { CARD_PALETTE, CARD_TAG, FIELD_COLORS } from "../CaiuNaRede";

/**
 * Pro portfólio: só a cascata de janelas do "caiu na rede", em 9:16, sobre o
 * amarelo do quadrado e sem mais nada. As pilhas se espalham pela tela toda e
 * vão crescendo até cobrir o fundo.
 */
export const CASCADE_STORIES = {
  width: 1080,
  height: 1920,
  /** Fundo vazio antes da primeira janela. */
  leadFrames: 9,
  /** Tela cheia parada no fim, antes de recomeçar. */
  holdFrames: 45,
} as const;

// Em px da tela, como as do post: as menores abrem primeiro e ficam atrás.
// Ritmo em frases, com respiro entre elas: cada pilha começa espaçada e
// dispara (`gaps`), e cada frase tem mais pilhas, maiores e mais rápidas.
const STACKS = [
  // 1. Uma pilha sozinha: bate devagar e dispara.
  { x: 40, y: 120, from: 0, count: 10, scale: 1.4, step: 14, gaps: [7, 1] },
  // 2. Pergunta e resposta.
  { x: 600, y: 520, from: 48, count: 10, scale: 1.4, step: 14, gaps: [5, 1] },
  { x: -80, y: 760, from: 54, count: 10, scale: 1.6, step: 16, gaps: [5, 1] },
  // 3. Três, uma atrás da outra.
  { x: 520, y: 1200, from: 92, count: 9, scale: 1.6, step: 16, gaps: [4, 1] },
  { x: 80, y: 1480, from: 96, count: 9, scale: 1.8, step: 18, gaps: [4, 1] },
  { x: 560, y: -40, from: 100, count: 9, scale: 2, step: 20, gaps: [4, 1] },
  // 4. Enxurrada: as grandes, quase de uma vez, até tapar o fundo.
  { x: -160, y: 1050, from: 128, count: 8, scale: 2.2, step: 22, gaps: [2, 1] },
  { x: 480, y: 1560, from: 132, count: 8, scale: 2.4, step: 24, gaps: [2, 1] },
  { x: -60, y: 300, from: 136, count: 8, scale: 2.6, step: 26, gaps: [2, 1] },
  { x: 520, y: 820, from: 140, count: 8, scale: 2.6, step: 26, gaps: [2, 1] },
  { x: -220, y: -80, from: 144, count: 8, scale: 2.8, step: 28, gaps: [2, 1] },
  { x: 440, y: 1300, from: 148, count: 8, scale: 2.8, step: 28, gaps: [2, 1] },
  { x: -240, y: 1560, from: 152, count: 8, scale: 3, step: 30, gaps: [2, 1] },
  { x: 380, y: 300, from: 156, count: 8, scale: 3, step: 30, gaps: [2, 1] },
] satisfies CascadeStack[];

export const cascadeStoriesFrames =
  CASCADE_STORIES.leadFrames + cascadeEnd(STACKS) + CASCADE_STORIES.holdFrames;

export const CascadeStories: React.FC<Pick<CaiuNaRedeProps, "link">> = ({ link }) => (
  <AbsoluteFill style={{ backgroundColor: FIELD_COLORS.paper, overflow: "clip" }}>
    <Sequence from={CASCADE_STORIES.leadFrames} layout="none">
      <Cascade
        stacks={STACKS}
        content={{
          ...link,
          tag: CARD_TAG,
          image: link.image ? staticFile(link.image) : undefined,
        }}
        palette={CARD_PALETTE}
      />
    </Sequence>
  </AbsoluteFill>
);
