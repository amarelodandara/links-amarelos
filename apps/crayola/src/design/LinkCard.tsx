import { Img } from "remotion";
import { settings } from "../settings";
import { SANS, MONO } from "./fonts";

const c = settings.colors;

/**
 * O card de link, no desenho do artboard "Link" do Paper (256×100): aba com
 * o rótulo e o fechar, e o corpo dividido entre a miniatura do link à
 * esquerda (a og:image dele) e título, descrição e a pílula do que fazer lá,
 * à direita. Sem miniatura, a vaga mostra a página quebrada em pixel, como
 * navegador antigo.
 *
 * Medidas em px do artboard; quem usa escala com `scale`.
 */
export type LinkCardContent = {
  title: string;
  /** Texto sob o título. */
  description: string;
  /** Verbo da pílula, ex. "visitar". */
  action: string;
  /** Rótulo da aba. */
  tag: string;
  /** Miniatura: URL ou caminho já resolvido (`staticFile`). */
  image?: string;
  /** `object-position` da miniatura: a og:image é horizontal e a vaga não,
   *  então escolhe que pedaço aparece. */
  imagePosition?: string;
};

export const LINK_CARD_WIDTH = 256;
export const LINK_CARD_HEIGHT = 100;

/** Sombra dura do card, como a das janelas antigas, deslocada `scale` × 1,5px
 *  pra baixo e pra direita. Vai num `filter` de quem envolve o card. */
export const linkCardShadow = (scale: number) =>
  `drop-shadow(${1.5 * scale}px ${1.5 * scale}px 0 rgba(17, 10, 3, 0.18))`;

const TAB_HEIGHT = 20;
const THUMB_WIDTH = 80;
const CLOSE_WIDTH = 22;

/**
 * As cores do card. `site` é a do Paper: aba amarela, corpo creme. Sobre o
 * quadrado amarelo do post a aba some no fundo, então `onSun` usa um amarelo
 * claro na aba e nos contornos.
 */
export type LinkCardPalette = {
  /** Fundo da aba. */
  accent: string;
  /** Contornos e fios: em volta do card, entre aba e corpo, antes do fechar,
   *  e entre miniatura e texto. */
  line: string;
  /** Contorna também em cima e embaixo, não só nas laterais. */
  outline: boolean;
  /** Corpo. */
  surface: string;
  /** O "x" do fechar. */
  close: string;
};

export const LINK_CARD_PALETTES = {
  site: { accent: c.sun, line: c.sun, outline: false, surface: c.sunLighter, close: c.sunLighter },
  // Aba sun light e fios sun dark, escolhidos comparando opções sobre o
  // fundo. Aba clara: o "x" creme sumiria nela, então vai em preto como o
  // rótulo.
  onSun: { accent: c.sunLight, line: c.sunDark, outline: true, surface: c.sunLighter, close: "#000" },
} satisfies Record<string, LinkCardPalette>;

const THUMB = "#DDDDDD";
const THUMB_ICON = "#888888";

// A página quebrada, célula a célula (14×16, 2px cada): canto dobrado, olhos e
// boca triste.
const BROKEN_PAGE = [
  "##########....",
  "#.......#.#...",
  "#.......#..#..",
  "#.......#...#.",
  "#...#...#....#",
  "#...#...######",
  "#............#",
  "#............#",
  "#............#",
  "#............#",
  "#....####....#",
  "#...#....#...#",
  "#............#",
  "#............#",
  "#............#",
  "##############",
];

const BrokenPage: React.FC = () => (
  <svg width={28} height={32} viewBox="0 0 14 16" style={{ display: "block" }}>
    {BROKEN_PAGE.flatMap((row, y) =>
      [...row].map((cell, x) =>
        cell === "#" ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={THUMB_ICON} /> : null,
      ),
    )}
  </svg>
);

export const LinkCard: React.FC<{
  content: LinkCardContent;
  scale?: number;
  palette?: LinkCardPalette;
}> = ({ content, scale = 1, palette = LINK_CARD_PALETTES.site }) => (
  <div
    style={{
      width: LINK_CARD_WIDTH,
      // Cresce se a descrição passar de duas linhas.
      minHeight: LINK_CARD_HEIGHT,
      display: "flex",
      flexDirection: "column",
      ...(palette.outline ? { outline: `1px solid ${palette.line}` } : undefined),
      transform: `scale(${scale})`,
      transformOrigin: "top left",
    }}
  >
    <div
      style={{
        height: TAB_HEIGHT,
        flexShrink: 0,
        display: "flex",
        backgroundColor: palette.accent,
        // Separa a aba do corpo.
        borderBottom: `1px solid ${palette.line}`,
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          paddingLeft: 7,
          fontFamily: MONO,
          fontSize: 8,
          color: "#000",
          whiteSpace: "nowrap",
        }}
      >
        {content.tag}
      </div>
      <div
        style={{
          width: CLOSE_WIDTH,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderLeft: `1px solid ${palette.line === palette.accent ? palette.surface : palette.line}`,
        }}
      >
        <svg width={5} height={5} viewBox="0 0 6 6" fill="none" style={{ display: "block" }}>
          <path
            d="M0 6L2.38289 2.92075L0.1222 0H1.31976L3.01833 2.26415L4.66802 0H5.89002L3.65377 2.9434L6 6H4.80244L3.01833 3.57736L1.222 6H0Z"
            fill={palette.close}
          />
        </svg>
      </div>
    </div>

    <div
      style={{
        flex: 1,
        display: "flex",
        backgroundColor: palette.surface,
        // Com contorno inteiro, ele já cobre as laterais.
        borderLeft: palette.outline ? undefined : `1px solid ${palette.line}`,
        borderRight: palette.outline ? undefined : `1px solid ${palette.line}`,
      }}
    >
      <div
        style={{
          width: THUMB_WIDTH,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: THUMB,
          borderRight: `1px solid ${palette.line}`,
          overflow: "hidden",
        }}
      >
        {content.image ? (
          <Img src={content.image} style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: content.imagePosition ?? "center",
            }} />
        ) : (
          <BrokenPage />
        )}
      </div>
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          gap: 6,
          padding: "6px 8px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontFamily: SANS, fontSize: 12, lineHeight: "16px", fontWeight: 500, color: c.brandBlack }}>
            {content.title}
          </span>
          <span
            style={{
              fontFamily: MONO,
              fontSize: 8,
              lineHeight: "12px",
              color: `${c.brandBlack}B3`,
            }}
          >
            {content.description}
          </span>
        </div>
        <div
          style={{
            alignSelf: "flex-end",
            height: 20,
            display: "flex",
            alignItems: "center",
            gap: 5,
            borderRadius: 999,
            backgroundColor: "#000",
            padding: "0 7px",
          }}
        >
          <span style={{ fontFamily: MONO, fontSize: 9, color: "#fff" }}>{content.action}</span>
          <svg width={7} height={7} viewBox="0 0 7 7" fill="none" style={{ display: "block" }}>
            <path d="M1 6L6 1M2 1H6V5" stroke="#fff" strokeWidth={0.9} />
          </svg>
        </div>
      </div>
    </div>
  </div>
);
