import { useLayoutEffect, useRef, useState } from "react";
import { continueRender, delayRender, useCurrentFrame, useVideoConfig } from "remotion";
import { SANS } from "../../design/fonts";

/**
 * Faixa com o texto passando sem fim, e um degradê da cor do fundo em cada
 * lateral pra ele entrar e sair sem corte.
 *
 * Sem medir nada: a fita tem duas cópias iguais lado a lado, e andar 50% da
 * própria largura cai exatamente no começo da segunda — o laço fecha em
 * qualquer texto. O preço é que a velocidade sai em caracteres por segundo,
 * não em px, o que pra texto corrido dá na mesma.
 */
const REPEATS = 4; // por cópia: o bastante pra cópia passar da largura da faixa
const GAP = 80;
const FADE = 120;
const FONT_SIZE = 64;
const FONT_WEIGHT = 600;

/**
 * Quanto subir o texto pra o meio da altura-x (o corpo das minúsculas, a
 * bolinha do "p") cair no meio da faixa, e não o meio da caixa da linha.
 *
 * Medido no navegador que está desenhando, depois da fonte carregar: onde a
 * linha de base cai na caixa muda de navegador pra navegador (cada um lê as
 * métricas da fonte de um jeito), então um número fixo acertava no render e
 * errava no Studio. A linha de base vem de um marcador de altura zero no fim
 * do texto; a altura-x vem do contorno do "x" na própria fonte.
 */
function useXHeightLift(
  band: React.RefObject<HTMLDivElement | null>,
  probe: React.RefObject<HTMLSpanElement | null>,
  text: string,
): number {
  const [lift, setLift] = useState(0);
  const [handle] = useState(() => delayRender("Marquee: centralizando o texto na faixa"));
  const released = useRef(false);

  useLayoutEffect(() => {
    let cancelled = false;
    const release = () => {
      if (released.current) return;
      released.current = true;
      continueRender(handle);
    };
    void document.fonts.load(`${FONT_WEIGHT} ${FONT_SIZE}px ${SANS}`).then(() => {
      if (cancelled) return;
      const bandEl = band.current;
      const probeEl = probe.current;
      const context = document.createElement("canvas").getContext("2d");
      if (!bandEl || !probeEl || !context) return release();

      // O Studio escala o preview; volta tudo pra px do post.
      const bandRect = bandEl.getBoundingClientRect();
      const ratio = bandRect.height / bandEl.offsetHeight || 1;
      const innerTop = bandRect.top + bandEl.clientTop * ratio;
      // Medido com o `lift` atual aplicado; desconta pra ter a posição crua.
      const baseline = (probeEl.getBoundingClientRect().bottom - innerTop) / ratio - lift;

      context.font = `${FONT_WEIGHT} ${FONT_SIZE}px ${SANS}`;
      const xHeight = context.measureText("x").actualBoundingBoxAscent;
      const next = bandEl.clientHeight / 2 - (baseline - xHeight / 2);
      if (Math.abs(next - lift) > 0.25) setLift(next);
      else release();
    });
    return () => {
      cancelled = true;
    };
  }, [band, probe, text, lift, handle]);

  return lift;
}

export const Marquee: React.FC<{
  text: string;
  color: string;
  background: string;
  border: string;
  /** Pra que lado o texto anda. */
  direction: "left" | "right";
  /** Caracteres que passam por segundo. */
  charsPerSecond: number;
}> = ({ text, color, background, border, direction, charsPerSecond }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const loopSeconds = (text.length * REPEATS) / charsPerSecond;
  const progress = (frame / fps / loopSeconds) % 1;
  const shift = direction === "left" ? -progress * 50 : (progress - 1) * 50;
  const bandRef = useRef<HTMLDivElement | null>(null);
  const probeRef = useRef<HTMLSpanElement | null>(null);
  const lift = useXHeightLift(bandRef, probeRef, text);

  const copy = (key: string) => (
    <div key={key} style={{ display: "flex", alignItems: "center", gap: GAP, paddingRight: GAP }}>
      {Array.from({ length: REPEATS }, (_, i) => (
        <span key={i} style={{ whiteSpace: "nowrap" }}>
          {text}
          {/* Marcador da linha de base: sem altura, a borda de baixo dele é
              a linha de base do texto. Um basta. */}
          {key === "a" && i === 0 && (
            <span ref={probeRef} style={{ display: "inline-block", width: 0, height: 0 }} />
          )}
        </span>
      ))}
    </div>
  );

  const fade = (side: "left" | "right") => (
    <div
      style={{
        position: "absolute",
        top: 0,
        bottom: 0,
        [side]: 0,
        width: FADE,
        background: `linear-gradient(to ${side === "left" ? "right" : "left"}, ${background}, transparent)`,
      }}
    />
  );

  return (
    <div
      ref={bandRef}
      style={{
        position: "relative",
        flex: 1,
        display: "flex",
        alignItems: "center",
        borderTop: border,
        borderBottom: border,
        overflow: "clip",
        backgroundColor: background,
      }}
    >
      <div
        style={{
          display: "flex",
          width: "max-content",
          transform: `translate(${shift}%, ${lift}px)`,
          color,
          fontFamily: SANS,
          fontSize: FONT_SIZE,
          fontWeight: FONT_WEIGHT,
          letterSpacing: "-0.04em",
          lineHeight: "78px",
        }}
      >
        {copy("a")}
        {copy("b")}
      </div>
      {fade("left")}
      {fade("right")}
    </div>
  );
};
