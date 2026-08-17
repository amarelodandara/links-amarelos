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
export const FEED = settings.formats.feed;
export const CAROUSEL = settings.formats.carousel;
export const CAROUSEL_SLIDE_COUNT = settings.formats.carouselSlideCount;

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
