import { AbsoluteFill, Easing, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { FieldCanvas } from "../field/FieldCanvas";
import { FIELD_DEFAULTS } from "../field/field";
import { linkOnScreen } from "../field/scene";
import type { FieldColors, ViewTuning } from "../field/scene";
import { VIEW_DEFAULTS } from "../field/scene";
import type { FieldScript } from "../field/timeline";
import { fieldMoments, simulateAt } from "../field/timeline";
import type { LinkCardContent } from "../design/LinkCard";
import { Cursor } from "../design/Cursor";
import { LINK_CARD_PALETTES, LINK_CARD_WIDTH, LinkCard, linkCardShadow } from "../design/LinkCard";
import { settings } from "../settings";
import type { CascadeStack } from "./caiunarede/Cascade";
import { Cascade } from "./caiunarede/Cascade";
import { Marquee } from "./caiunarede/Marquee";

const c = settings.colors;

/**
 * Post "caiu na rede, é link!" (1080×1350, feed do Instagram em 4:5).
 *
 * Layout do artboard "caiunarede" no Paper: lema no topo e nome do link
 * embaixo, os dois em marquee; no meio, um quadrado de 1080 com o campo do
 * "prove os links" da landing. Roteiro:
 *
 * 1. O recorte do campo, ainda plano, gira.
 * 2. Um link cai e afunda o campo até o fundo. Quando a onda passa, campo e
 *    link encolhem e o card do link entra grande no centro.
 * 3. O link abre de novo e de novo, em pilhas de janelas como erro do
 *    Windows, começando em vários pontos e passando da borda do quadrado.
 */
export type CaiuNaRedeProps = {
  lema: string;
  link: {
    title: string;
    description: string;
    /** Verbo da pílula. */
    action: string;
    /** og:image do link, relativa a /content (ver scripts/fetch-og.mjs). */
    image?: string;
    /** Que pedaço da og:image aparece na miniatura (`object-position`). */
    imagePosition?: string;
  };
};

/** A aba do card é a mesma em todo post. */
const CARD_TAG = "recomendação especial";

export const CAIU_NA_REDE = {
  width: 1080,
  height: 1350,
  durationInSeconds: 10.5,
} as const;

const BAND_HEIGHT = 135;
const SIDE_BORDER = 3;
const FIELD_WIDTH = CAIU_NA_REDE.width - SIDE_BORDER * 2;
const FIELD_HEIGHT = 1080;
const BORDER = `3px solid ${c.sunDark}`;

// Fora do componente: o FieldCanvas recria a cena WebGL se a identidade mudar.
// O quadrado é amarelo cheio (#FFCC00), então o campo inverte o da landing:
// fundo amarelo, grade e links brancos.
const FIELD_COLORS = {
  paper: c.sun,
  line: "#FFFFFF",
  ink: c.brandBlack,
} satisfies FieldColors;

const CARD_PALETTE = LINK_CARD_PALETTES.onSun;

const DROP_SECONDS = 0.6;

// Um corpo caindo no espaço-tempo: um link só, pesado, que cai rápido e
// afunda a folha bem fundo. Afunda e fica — sem voltar, sem ondas.
const FIELD_SCRIPT = {
  seed: 9,
  drops: [DROP_SECONDS],
  framingDelaySeconds: 0,
  startFramed: true,
  tune: {
    ...FIELD_DEFAULTS,
    // Funil: estreito e fundo, de ponta fina, sem a folha toda ceder em volta.
    linkMass: 2.3, // compensa o fundo chato, que fica menos fundo que a ponta
    maxLinkDepth: 3, // folga pra tanh não achatar o fundo
    wellSigma: 0.2,
    wellPower: 1.1,
    wellTip: 0.12, // fundo com folga em volta do link (raio 0,06), pra ele caber
    sagPerLink: 0,
    spawnSpreadX: 0,
    spawnSpreadZ: 0,
    gravity: 14,
    dropHeight: 1.6, // logo acima da borda de cima do quadro: entra assim que cai
    // Bate e afunda junto com a folha, sem quicar. Mola com amortecimento
    // crítico (damping = 2√stiffness) e empurrão inicial abaixo de
    // √stiffness × linkMass: assim a folha só desce, desacelerando, e nunca
    // passa do fundo.
    minBounceSpeed: Infinity,
    sinkStiffness: 9,
    sinkDamping: 6,
    impactPush: 0.3,
    rippleAmp: 0,
    orbitSeconds: 16,
  },
} satisfies FieldScript;

// timeline.ts dá ids pelos índices dos drops.
const FIELD_LINK_ID = "link-0";

// As batidas saem da física: o resto do post só começa quando link e folha
// já pararam lá no fundo.
const SUNK = fieldMoments(FIELD_SCRIPT).sunkAt;
const BEATS = {
  /** Campo encolhe e, junto, a câmera desce um pouco pro lado, pra a
   *  profundidade aparecer. */
  shrink: SUNK + 0.2,
  shrinkSeconds: 0.7,
  /** Cursor entra pela direita, a caminho do link. */
  cursor: SUNK + 0.5,
  cursorSeconds: 0.8,
  /** Clica no link: o cursor afunda uns frames. */
  click: SUNK + 1.45,
  /** Solta o clique e a janela do link abre. */
  card: SUNK + 1.6,
  /** Logo depois de a janela abrir, o cursor sai do quadro, mais rápido do
   *  que entrou. */
  cursorOut: SUNK + 1.75,
  cursorOutSeconds: 0.4,
  /** Primeira pilha de janelas. */
  cascade: SUNK + 3.1,
} as const;

const SHRINK_SCALE = 0.45;
const SHRINK_LIFT = 140;
const CURSOR_WIDTH = 36;
// De onde o cursor vem: fora da faixa de baixo, à direita. Sai pra direita.
const CURSOR_FROM = { x: 960, y: 1420 };
const CURSOR_TO = { x: 1140, y: 900 };

const FIELD_VIEW = {
  ...VIEW_DEFAULTS,
  lineWidth: 2.2,
  endDistance: 4.2,
  pivotDepthShare: 0,
} satisfies ViewTuning;

const CARD_SCALE = 3;

// Em px do post (0,0 no canto superior esquerdo). As de escala menor abrem
// primeiro e ficam atrás; as maiores vêm por cima e invadem as faixas.
const STACKS = [
  { x: 60, y: 200, from: 0, count: 12, scale: 1.4, step: 14 },
  { x: 640, y: 760, from: 8, count: 10, scale: 1.4, step: 14 },
  { x: 560, y: 150, from: 22, count: 12, scale: 1.8, step: 18 },
  { x: -120, y: 820, from: 34, count: 11, scale: 2.2, step: 22 },
  { x: 620, y: -60, from: 50, count: 9, scale: 2.6, step: 26 },
  { x: 40, y: 1040, from: 64, count: 9, scale: 2.6, step: 26 },
] satisfies CascadeStack[];

export const CaiuNaRede: React.FC<CaiuNaRedeProps> = ({ lema, link: linkProps }) => {
  const link: LinkCardContent = {
    title: linkProps.title,
    description: linkProps.description,
    action: linkProps.action,
    tag: CARD_TAG,
    image: linkProps.image ? staticFile(linkProps.image) : undefined,
    imagePosition: linkProps.imagePosition,
  };
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const at = (seconds: number) => Math.round(seconds * fps);

  // Um movimento só: o campo encolhe enquanto a câmera desce pro lado.
  const shrink = interpolate(frame, [at(BEATS.shrink), at(BEATS.shrink + BEATS.shrinkSeconds)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const side = shrink;
  const fieldScale = 1 - (1 - SHRINK_SCALE) * shrink;

  // Onde o link está no post: a posição no canvas passa pela mesma escala e
  // subida do campo (origem no centro do canvas).
  const onCanvas = linkOnScreen(
    simulateAt(FIELD_SCRIPT, frame / fps),
    FIELD_LINK_ID,
    { width: FIELD_WIDTH, height: FIELD_HEIGHT },
    FIELD_VIEW,
    side,
  );
  const linkAt = onCanvas && {
    x: SIDE_BORDER + FIELD_WIDTH / 2 + (onCanvas.x - FIELD_WIDTH / 2) * fieldScale,
    y: BAND_HEIGHT + FIELD_HEIGHT / 2 + (onCanvas.y - FIELD_HEIGHT / 2) * fieldScale - SHRINK_LIFT * shrink,
  };
  const travel = interpolate(frame, [at(BEATS.cursor), at(BEATS.cursor + BEATS.cursorSeconds)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const leave = interpolate(frame, [at(BEATS.cursorOut), at(BEATS.cursorOut + BEATS.cursorOutSeconds)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });
  const pressed = frame >= at(BEATS.click) && frame < at(BEATS.card);
  const cardWidth = LINK_CARD_WIDTH * CARD_SCALE;

  return (
    <AbsoluteFill style={{ backgroundColor: c.sunLighter, overflow: "clip" }}>
      <AbsoluteFill
        style={{
          borderLeft: BORDER,
          borderRight: BORDER,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ height: BAND_HEIGHT, display: "flex", flexDirection: "column" }}>
          <Marquee
            text={lema}
            color={c.sunDark}
            background={c.sunLighter}
            border={BORDER}
            direction="left"
            charsPerSecond={3}
          />
        </div>
        <div style={{ flexShrink: 0, height: FIELD_HEIGHT, overflow: "clip", backgroundColor: c.sun }}>
          <div
            style={{
              transform: `translateY(${-SHRINK_LIFT * shrink}px) scale(${fieldScale})`,
              transformOrigin: "50% 50%",
            }}
          >
            <FieldCanvas
              width={FIELD_WIDTH}
              height={FIELD_HEIGHT}
              script={FIELD_SCRIPT}
              colors={FIELD_COLORS}
              view={FIELD_VIEW}
              side={side}
            />
          </div>
        </div>
        <div style={{ height: BAND_HEIGHT, display: "flex", flexDirection: "column" }}>
          <Marquee
            text={link.title}
            color={c.brandBlack}
            background={c.sunLighter}
            border={BORDER}
            direction="right"
            charsPerSecond={3}
          />
        </div>
      </AbsoluteFill>

      <Sequence from={at(BEATS.cascade)} layout="none">
        <Cascade stacks={STACKS} content={link} palette={CARD_PALETTE} />
      </Sequence>

      {/* O card do link fica por cima de tudo: a recomendação é o que tem
          que ler, mesmo com as janelas se empilhando em volta. Abre como
          janela no Windows: de uma vez, inteira, sem crescer nem quicar. */}
      {frame >= at(BEATS.card) && (
        <div
          style={{
            position: "absolute",
            left: (CAIU_NA_REDE.width - cardWidth) / 2,
            width: cardWidth,
            top: BAND_HEIGHT + 560,
            filter: linkCardShadow(CARD_SCALE),
          }}
        >
          <LinkCard content={link} scale={CARD_SCALE} palette={CARD_PALETTE} />
        </div>
      )}

      {/* O cursor que clica no link e abre a janela, por cima de tudo. */}
      {linkAt && frame >= at(BEATS.cursor) && leave < 1 && (
        <div
          style={{
            position: "absolute",
            left: interpolate(leave, [0, 1], [interpolate(travel, [0, 1], [CURSOR_FROM.x, linkAt.x]), CURSOR_TO.x]),
            top: interpolate(leave, [0, 1], [interpolate(travel, [0, 1], [CURSOR_FROM.y, linkAt.y]), CURSOR_TO.y]),
            transform: `scale(${pressed ? 0.85 : 1})`,
            transformOrigin: "0 0",
          }}
        >
          <Cursor width={CURSOR_WIDTH} />
        </div>
      )}
    </AbsoluteFill>
  );
};
