import { cancelRender, continueRender, delayRender } from "remotion";
import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadGeistMono } from "@remotion/google-fonts/GeistMono";
import { loadFont as loadGeistPixel } from "@remotion/google-fonts/GeistPixel";
import serifRegular from "./fonts/GeistSerif-Regular.woff2";
import serifSquare from "./fonts/GeistSerif-Square.woff2";
import serifTriangle from "./fonts/GeistSerif-Triangle.woff2";
import serifHeart from "./fonts/GeistSerif-Heart.woff2";
import pixelSquare from "./fonts/GeistPixel-Square.woff2";
import pixelGrid from "./fonts/GeistPixel-Grid.woff2";
import pixelCircle from "./fonts/GeistPixel-Circle.woff2";
import pixelTriangle from "./fonts/GeistPixel-Triangle.woff2";
import pixelLine from "./fonts/GeistPixel-Line.woff2";

/**
 * A tipografia da marca é a família Geist, nas quatro variantes: Geist (sans),
 * Geist Mono, Geist Pixel e Geist Serif.
 * Os pesos cobrem o que as peças usam (settings.json → typography, e as compositions).
 */
const geist = loadGeist("normal", { weights: ["400", "500", "600", "700", "800"] });
const geistMono = loadGeistMono("normal", { weights: ["400", "500", "700"] });
loadGeistMono("italic", { weights: ["700"] });

export const SANS = geist.fontFamily;
export const MONO = geistMono.fontFamily;

/** Geist Pixel: o letreiro do visor do mp3 player, no destaque. */
const geistPixel = loadGeistPixel("normal", { weights: ["400"] });

export const PIXEL = geistPixel.fontFamily;

/**
 * Geist Serif and every Geist Pixel style. Google Fonts has neither, so the
 * woff2 files sit in ./fonts, copied from the `geist` npm package 1.9.2
 * (SIL OFL 1.1, see ./fonts/LICENSE.txt). Each style is its own family name.
 */
function loadLocal(family: string, url: string): string {
  const handle = delayRender(`Loading ${family}`);
  const face = new FontFace(family, `url(${url}) format("woff2")`, { weight: "400" });
  face
    .load()
    .then((loaded) => {
      document.fonts.add(loaded);
      continueRender(handle);
    })
    .catch(cancelRender);
  return family;
}

export const SERIF_STYLES = {
  regular: loadLocal("Geist Serif", serifRegular),
  square: loadLocal("Geist Serif Square", serifSquare),
  triangle: loadLocal("Geist Serif Triangle", serifTriangle),
  heart: loadLocal("Geist Serif Heart", serifHeart),
} as const;

export const PIXEL_STYLES = {
  square: loadLocal("Geist Pixel Square", pixelSquare),
  grid: loadLocal("Geist Pixel Grid", pixelGrid),
  circle: loadLocal("Geist Pixel Circle", pixelCircle),
  triangle: loadLocal("Geist Pixel Triangle", pixelTriangle),
  line: loadLocal("Geist Pixel Line", pixelLine),
} as const;

export const SERIF = SERIF_STYLES.regular;
