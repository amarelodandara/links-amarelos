import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { loadFont as loadSpaceMono } from "@remotion/google-fonts/SpaceMono";
import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadGeistMono } from "@remotion/google-fonts/GeistMono";

/** Pesos usados nos designs do Paper: Manrope 500/600/700, Space Mono 700 (+ itálico). */
const manrope = loadManrope("normal", { weights: ["500", "600", "700"] });
const spaceMonoRegular = loadSpaceMono("normal", { weights: ["700"] });
loadSpaceMono("italic", { weights: ["700"] });

export const SANS = manrope.fontFamily;
export const MONO = spaceMonoRegular.fontFamily;

/** Geist/Geist Mono: fontes do `LinkCard` da landing (font-sans/font-mono lá). */
const geist = loadGeist("normal", { weights: ["500"] });
const geistMono = loadGeistMono("normal", { weights: ["400"] });

export const GEIST = geist.fontFamily;
export const GEIST_MONO = geistMono.fontFamily;
