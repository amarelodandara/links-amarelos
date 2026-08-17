import type { ComponentType } from "react";
import type { EditionEntry } from "../src/schema/edition";
import { PreDesignPlaceholder } from "../src/compositions/PreDesignPlaceholder";
import { Stories } from "../src/compositions/stories/Stories";
import { CAROUSEL, CAROUSEL_SLIDE_COUNT, DURATION_IN_FRAMES, FEED, FPS, STORIES } from "../src/settings";

/**
 * As 3 peças de saída, do ponto de vista do preview: qual componente, em que
 * proporção e por quantos frames. Os ids batem com os do servidor (`PIECES` em
 * scripts/server.mjs), que é quem sabe renderizar cada uma.
 *
 * `Feed` e `CarouselSlide` ainda apontam pro placeholder — etapas 6 e 7 do
 * plano. Quando ganharem design, é só trocar o componente aqui.
 */

export type PieceId = "stories" | "feed" | "carousel";

/**
 * O que toda peça recebe no player e no render. `type` e não `interface`: o
 * `inputProps` do Player do Remotion pede algo indexável por string, e só o
 * alias ganha a index signature implícita.
 *
 * O `label` é o nome da peça pro placeholder desenhar; as compositions com
 * design próprio ignoram, mas mandar sempre mantém um contrato só pras três.
 */
export type PieceProps = {
  entry: EditionEntry;
  label: string;
};

export interface Piece {
  id: PieceId;
  label: string;
  format: string;
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  component: ComponentType<PieceProps>;
  props: (entry: EditionEntry) => PieceProps;
  /** Peça estática: o player mostra frame a frame, sem play contínuo. */
  isStills?: boolean;
  /**
   * Frame em que o preview abre. No frame 0 as entradas em spring ainda não
   * começaram e a peça parece vazia — abrir na abertura já montada dá uma
   * primeira impressão honesta do que a peça é.
   */
  posterFrame: number;
}

export const PIECES: Piece[] = [
  {
    id: "stories",
    label: "Stories",
    format: "9:16 · Stories, Twitter/X, BlueSky",
    width: STORIES.width,
    height: STORIES.height,
    fps: FPS,
    durationInFrames: DURATION_IN_FRAMES,
    component: Stories,
    props: (entry) => ({ entry, label: "Stories" }),
    posterFrame: 60,
  },
  {
    id: "feed",
    label: "Feed",
    format: "4:5 · Instagram feed",
    width: FEED.width,
    height: FEED.height,
    fps: FPS,
    durationInFrames: DURATION_IN_FRAMES,
    component: PreDesignPlaceholder,
    props: (entry) => ({ entry, label: "Instagram Feed" }),
    posterFrame: 60,
  },
  {
    id: "carousel",
    label: "Carrossel",
    format: "14:10 · 6 stills do Substack",
    width: CAROUSEL.width,
    height: CAROUSEL.height,
    fps: 1,
    durationInFrames: CAROUSEL_SLIDE_COUNT,
    component: PreDesignPlaceholder,
    props: (entry) => ({ entry, label: "Carrossel Substack" }),
    isStills: true,
    posterFrame: 0,
  },
];
