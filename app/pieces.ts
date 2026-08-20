import type { ComponentType } from "react";
import type { EditionEntry } from "../src/schema/edition";
import { InstagramFeed } from "../src/compositions/InstagramFeed";
import { SubstackCarrossel } from "../src/compositions/SubstackCarrossel";
import { Square } from "../src/compositions/Square";
import { Stories } from "../src/compositions/Stories";
import { CAROUSEL, CAROUSEL_SLIDE_COUNT, DURATION_IN_FRAMES, FPS, SQUARE, STORIES } from "../src/settings";

/**
 * As 4 peças de saída, do ponto de vista do preview: qual componente, em que
 * proporção e por quantos frames. Os ids batem com os do servidor (`PIECES` em
 * scripts/server.mjs), que é quem sabe renderizar cada uma.
 *
 * As três já têm design próprio; nenhuma aponta mais pro andaime.
 */

export type PieceId =
  | "instagram-stories"
  | "instagram-feed"
  | "x-bluesky"
  | "substack-carrossel";

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
    id: "instagram-stories",
    label: "Story do Instagram",
    format: "9:16 · vídeo",
    width: STORIES.width,
    height: STORIES.height,
    fps: FPS,
    durationInFrames: DURATION_IN_FRAMES,
    component: Stories,
    props: (entry) => ({ entry, label: "Story do Instagram" }),
    posterFrame: 60,
  },
  {
    id: "x-bluesky",
    label: "X / BlueSky",
    format: "1:1 · vídeo",
    width: SQUARE.width,
    height: SQUARE.height,
    fps: FPS,
    durationInFrames: DURATION_IN_FRAMES,
    component: Square,
    props: (entry) => ({ entry, label: "X / BlueSky" }),
    posterFrame: 60,
  },
  {
    /* Still e não vídeo: vídeo no feed do Instagram é convertido em Reels. */
    id: "instagram-feed",
    label: "Feed do Instagram",
    format: "1:1 · 6 stills",
    width: SQUARE.width,
    height: SQUARE.height,
    fps: 1,
    durationInFrames: CAROUSEL_SLIDE_COUNT,
    component: InstagramFeed,
    props: (entry) => ({ entry, label: "Feed do Instagram" }),
    isStills: true,
    posterFrame: 0,
  },
  {
    id: "substack-carrossel",
    label: "Carrossel do Substack",
    format: "14:10 · 6 stills",
    width: CAROUSEL.width,
    height: CAROUSEL.height,
    fps: 1,
    durationInFrames: CAROUSEL_SLIDE_COUNT,
    component: SubstackCarrossel,
    props: (entry) => ({ entry, label: "Carrossel do Substack" }),
    isStills: true,
    posterFrame: 0,
  },
];
