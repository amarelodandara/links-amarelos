/**
 * PROVISÓRIO — vira `settings.json` depois da exploração visual no Paper
 * (seções 3.1 e 3.2 do plano). Aqui só moram os parâmetros que já estão
 * decididos e que não dependem do design: resoluções e duração.
 *
 * Cores, tokens de espaçamento, regras de empilhamento das logos e tipografia
 * NÃO entram aqui ainda — é justamente o que deve emergir do Paper.
 */

export const FPS = 30;

/** Constante do projeto: 8s (intro + 4 tabs + CTA). Trivial de ajustar. */
export const DURATION_IN_SECONDS = 8;
export const DURATION_IN_FRAMES = DURATION_IN_SECONDS * FPS;

/**
 * Vertical 9:16. Serve Instagram Stories, Twitter/X e BlueSky — os três aceitam
 * 9:16 nativo sem crop nem barra preta, então é uma composition só (seção 4).
 */
export const STORIES = { width: 1080, height: 1920 } as const;

/** Instagram Feed, 4:5 — única proporção que o vertical completo não cobre. */
export const FEED = { width: 1080, height: 1350 } as const;

/** Carrossel do Substack, 14:10 horizontal (seção 5). */
export const CAROUSEL = { width: 1456, height: 1040 } as const;

/** Capa + 4 tabs + CTA = 6 slides estáticos. */
export const CAROUSEL_SLIDE_COUNT = 6;
