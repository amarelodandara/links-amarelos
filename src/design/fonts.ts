import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { loadFont as loadSpaceMono } from "@remotion/google-fonts/SpaceMono";

/** Pesos usados nos designs do Paper: Manrope 500/600/700, Space Mono 700 (+ itálico). */
const manrope = loadManrope("normal", { weights: ["500", "600", "700"] });
const spaceMonoRegular = loadSpaceMono("normal", { weights: ["700"] });
loadSpaceMono("italic", { weights: ["700"] });

export const SANS = manrope.fontFamily;
export const MONO = spaceMonoRegular.fontFamily;
