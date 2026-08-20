import { z } from "zod";
import type { DitheringProps } from "@paper-design/shaders-react";
import settings from "../settings.json";

/**
 * Acesso tipado ao `settings.json` (seção 3.1 do plano). Substitui o antigo
 * `settings.provisional.ts` — agora que o design saiu do Paper, as constantes
 * visuais moram todas no JSON e este módulo só deriva o que é conveniência.
 */

export { settings };

export const FPS = settings.fps;
export const DURATION_IN_FRAMES = settings.durationInSeconds * settings.fps;

export const STORIES = settings.formats.stories;
export const SQUARE = settings.formats.square;
export const CAROUSEL = settings.formats.carousel;
export const CAROUSEL_SLIDE_COUNT = settings.formats.carouselSlideCount;

/**
 * O `settings.json` chega como `string` solto — os enums do shader precisam ser
 * validados aqui, na entrada, e não no ponto de uso. O `satisfies` mantém as
 * duas listas presas às uniões da lib: um valor que ela deixar de aceitar quebra
 * o typecheck em vez de virar erro de shader em runtime.
 */
const DITHERING_PATTERNS = [
  "random",
  "2x2",
  "4x4",
  "8x8",
] as const satisfies readonly NonNullable<DitheringProps["type"]>[];

const DITHERING_FIGURES = [
  "simplex",
  "warp",
  "dots",
  "wave",
  "ripple",
  "swirl",
  "sphere",
] as const satisfies readonly NonNullable<DitheringProps["shape"]>[];

export const DITHERING = {
  pattern: z.enum(DITHERING_PATTERNS).parse(settings.dithering.type),
  figure: z.enum(DITHERING_FIGURES).parse(settings.dithering.figure),
  size: settings.dithering.size,
  scale: settings.dithering.scale,
  opacity: settings.dithering.opacity,
  colorFront: settings.dithering.colorFront,
} as const;

/**
 * Geometria por proporção. As cenas não leem medida do `settings` direto: cada
 * composition escolhe um layout e passa adiante, e é isso que permite a mesma
 * cena servir o 9:16 e o 1:1 sem `if` de formato espalhado pelo componente.
 */
export type Layout = (typeof settings.layouts)[keyof typeof settings.layouts];

/** Layouts que rendem baralho de stills — só esses têm frame de congelamento. */
export type StillLayout = Extract<Layout, { ctaStillFrame: number }>;

export const LAYOUTS = settings.layouts;

/** Tela do form da composition `Editor` — ferramenta, não formato de saída. */
export const EDITOR = settings.formats.editor;

/** Duração de cada cena do vídeo, em frames. Soma = DURATION_IN_FRAMES. */
export const SCENES = {
  opening: Math.round(settings.timing.openingSeconds * FPS),
  perTab: Math.round(settings.timing.secondsPerTab * FPS),
  cta: Math.round(settings.timing.ctaSeconds * FPS),
} as const;

if (SCENES.opening + SCENES.perTab * 4 + SCENES.cta !== DURATION_IN_FRAMES) {
  throw new Error(
    "settings.json: timing não fecha — openingSeconds + 4*secondsPerTab + ctaSeconds deve somar durationInSeconds",
  );
}
