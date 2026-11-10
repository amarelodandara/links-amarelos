import type { Oklch } from "./oklch.ts";

/** The steps a scale may have, light to dark. Each scale keeps only the ones it needs. */
export const STEPS = [100, 300, 500, 700, 900] as const;
export type Step = (typeof STEPS)[number];

export const SCALE_NAMES = ["sun", "code", "ink"] as const;
export type ScaleName = (typeof SCALE_NAMES)[number];

/** `name` is the semantic name (e.g. a role like "page"); "" until one is chosen. */
export type ScaleStep = Oklch & { step: Step; name: string };
export type Scale = readonly ScaleStep[];
export type Scales = { readonly [K in ScaleName]: Scale };

/** `sun`, 500 → `sun-500`: the CSS custom property is `--sun-500`. */
export const tokenName = (scale: ScaleName, step: Step): string => `${scale}-${step}`;
