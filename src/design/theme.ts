import { settings } from "../settings";
import type { EditionType } from "../schema/edition";

const c = settings.colors;

/**
 * Tema visual por tipo de edição, extraído dos artboards aprovados no Paper
 * ("links+ondas - *" e "Hyperlinks — *"). O `type` do edition.json escolhe o
 * tema inteiro — nenhum componente decide cor sozinho.
 */
export interface Theme {
  /** Cor de fundo do artboard. */
  background: string;
  /** Cor dos "+"/círculos do tile de textura do fundo. */
  textureColor: string;
  /** Cor de texto principal sobre o fundo (título, byline, logos). */
  ink: string;
  window: {
    surface: string;
    border: string;
    /** Gradiente do chrome (topo → base). */
    chromeTop: string;
    chromeBottom: string;
    /** Borda 2px do chrome, das abas ativas e da divisória (com alpha). */
    chromeBorder: string;
    inactiveTabSurface: string;
    inactiveTabBorder: string;
    tabText: string;
  };
  cta: {
    pillSurface: string;
    pillText: string;
    dateText: string;
    /** "vem aí + data" usa multiply no tema amarelo; nenhum no azul. */
    dateBlendMode: "multiply" | "normal";
  };
}

export const themes = {
  "links-ondas": {
    background: c.sunLighter,
    textureColor: c.sun,
    ink: c.brandBlack,
    window: {
      surface: c.brandWhite,
      border: c.sun,
      chromeTop: "oklab(98.1% -0.002 0.029)",
      chromeBottom: c.sunLighter,
      chromeBorder: "#F59E0B59",
      inactiveTabSurface: c.sunLight,
      inactiveTabBorder: "#E9B93C",
      tabText: c.brandBlack,
    },
    cta: {
      pillSurface: c.brandWhite,
      pillText: c.sunDark,
      dateText: c.sunDark,
      dateBlendMode: "multiply",
    },
  },
  hyperlinks: {
    background: c.code,
    textureColor: c.code,
    ink: c.codeLighter,
    window: {
      surface: c.brandWhiteCode,
      border: c.code,
      chromeTop: "oklab(97.8% -0.001 -0.010)",
      chromeBottom: c.codeLighter,
      chromeBorder: "#3B82F659",
      inactiveTabSurface: c.codeLight,
      inactiveTabBorder: "#93B4F5",
      tabText: c.brandBlack,
    },
    cta: {
      pillSurface: c.brandWhiteCode,
      pillText: c.codeDark,
      dateText: "#FFFFFF",
      dateBlendMode: "normal",
    },
  },
} satisfies Record<EditionType, Theme>;
