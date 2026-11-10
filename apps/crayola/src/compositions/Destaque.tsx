import { z } from "zod";
import { Dithering } from "@paper-design/shaders-react";
import { useAudioData, visualizeAudio } from "@remotion/media-utils";
import { useMemo } from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  type CalculateMetadataFunction,
} from "remotion";
import { DITHERING, settings } from "../settings";
import { GEIST_PIXEL, SANS } from "../design/fonts";
import { PLATFORM_ORDER, PlatformIcon } from "../design/PlatformIcon";
import playerPng from "../design/assets/mp3-player.png";

const D = settings.formats.destaque;
const c = settings.colors;

const wordSchema = z.object({
  text: z.string(),
  /** Relativos ao começo do trecho. */
  startMs: z.number(),
  endMs: z.number(),
});

export const destaqueSchema = z.object({
  /** Número do lançamento, pro letreiro "ondas amarelas #N.mp3". */
  numero: z.number().int().positive(),
  /** Áudio do trecho, relativo à publicDir. */
  audio: z.string().min(1),
  /** Capa do episódio, relativa à publicDir — aparece no fim. */
  cover: z.string().min(1),
  /** Duração do trecho; o fim (D.endSeconds) vem depois. */
  durationMs: z.number().positive(),
  /** Legenda aprovada pela Dandara: o que foi falado, palavra por palavra. */
  words: z.array(wordSchema).min(1),
  ctas: z.array(z.enum(["substack", "spotify", "youtube"])).min(1),
});

export type DestaqueProps = z.infer<typeof destaqueSchema>;

export const calculateDestaqueMetadata: CalculateMetadataFunction<DestaqueProps> = ({ props }) => ({
  durationInFrames: Math.ceil((props.durationMs / 1000 + D.endSeconds) * settings.fps),
});

/** 0 enquanto ela fala; vai a 1 na passagem pro layout do fim. */
const useEndProgress = (durationMs: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const start = (durationMs / 1000) * fps;
  return interpolate(frame, [start, start + D.transitionSeconds * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
};

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Destaque (Reels 9:16): o mp3 player no meio, as ondas saindo dos dois lados
 * conforme a voz, o letreiro correndo no visor e a legenda embaixo. Quando o
 * trecho acaba, o player encolhe e descem a capa e os ícones de onde ouvir.
 */
export const Destaque: React.FC<DestaqueProps> = ({ numero, audio, cover, durationMs, words, ctas }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = useEndProgress(durationMs);
  const f = D.falando;
  const e = D.fim;
  const box = (k: "left" | "top" | "width" | "height") => mix(f.player[k], e.player[k], t);
  const visor = (k: keyof typeof f.visor) => mix(f.visor[k], e.visor[k], t);

  return (
    <AbsoluteFill style={{ backgroundColor: c.sunLighter }}>
      <Audio src={staticFile(audio)} />
      {/* eslint-disable anti-slop/no-shape-in-symbol-names -- `shape` é o nome da prop na lib, não escolha nossa. */}
      <Dithering
        speed={0}
        frame={(frame / fps) * 1000}
        shape={DITHERING.figure}
        type={DITHERING.pattern}
        size={DITHERING.size}
        scale={DITHERING.scale}
        colorBack="#00000000"
        colorFront={DITHERING.colorFront}
        style={{ position: "absolute", inset: 0, opacity: DITHERING.opacity }}
      />

      <Waves audio={audio} centerY={mix(f.wavesCenterY, e.wavesCenterY, t)} quiet={t} />

      <Img
        src={playerPng}
        style={{ position: "absolute", left: box("left"), top: box("top"), width: box("width"), height: box("height") }}
      />
      {/* O visor: amarelo em modo "color" sobre a tela do player, e o letreiro por cima. */}
      <div
        style={{
          position: "absolute",
          left: visor("left"),
          top: visor("top"),
          width: visor("width"),
          height: visor("height"),
          backgroundColor: c.sun,
          mixBlendMode: "color",
        }}
      />
      <Marquee
        text={`ondas amarelas #${numero}.mp3   ✦   `}
        left={visor("left")}
        top={visor("top")}
        width={visor("width")}
        height={visor("height")}
        fontSize={visor("fontSize")}
        lineHeight={visor("lineHeight")}
        textLeft={visor("textLeft")}
      />

      <Captions words={words} opacity={1 - t} />

      <End cover={cover} ctas={ctas} progress={t} />
    </AbsoluteFill>
  );
};

/**
 * Ondas contínuas espelhadas na linha do centro, em três camadas de azul. A
 * altura de cada ponto é o envelope do Paper (picos dos dois lados do player)
 * vezes a energia da faixa de frequência daquele ponto: graves nos picos,
 * agudos nas pontas e perto do player.
 */
const Waves: React.FC<{ audio: string; centerY: number; quiet: number }> = ({ audio, centerY, quiet }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const audioData = useAudioData(staticFile(audio));
  const W = D.waves;
  const half = W.height / 2;

  const xs = useMemo(() => {
    const out: number[] = [];
    for (let x = 0; x <= width; x += W.pointStepPx) out.push(x);
    return out;
  }, [width, W.pointStepPx]);

  // O corpo da forma é o volume: RMS de uns 0,25 s em volta de
  // agora. A escala vem do próprio trecho — o percentil 90 do RMS vira altura
  // cheia —, então qualquer mixagem enche a forma do mesmo jeito.
  const window = audioData ? Math.floor(audioData.sampleRate * D.waves.rmsWindowSeconds) : 1;
  const rmsAt = (samples: Float32Array, from: number) => {
    let sum = 0;
    const to = Math.min(samples.length, from + window);
    for (let i = Math.max(0, from); i < to; i++) sum += samples[i] ** 2;
    return Math.sqrt(sum / window);
  };
  const fullScale = useMemo(() => {
    if (!audioData) return 1;
    const samples = audioData.channelWaveforms[0];
    const all: number[] = [];
    for (let from = 0; from < samples.length; from += window) all.push(rmsAt(samples, from));
    all.sort((a, b) => a - b);
    return all[Math.floor(all.length * D.waves.fullScalePercentile)] || 1;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rmsAt só depende de window.
  }, [audioData, window]);

  if (!audioData) return null;

  const now = Math.floor((frame / fps) * audioData.sampleRate) - window / 2;
  const level = Math.min(1, rmsAt(audioData.channelWaveforms[0], now) / fullScale);

  // A textura vem do espectro, relativo ao próprio pico: independe do volume
  // da mixagem (a voz dá valores absolutos minúsculos no FFT).
  const bins = visualizeAudio({ fps, frame, audioData, numberOfSamples: 32, smoothing: true });
  const peak = Math.max(...bins, 1e-6);
  const gauss = (x: number, mu: number, s: number) => Math.exp(-(((x - mu) / s) ** 2));
  const amp = xs.map((x, i) => {
    const env = 0.05 + 0.9 * gauss(x, 190, 150) + 0.95 * gauss(x, 890, 160) + 0.25 * gauss(x, 540, 300);
    const texture = 0.65 + 0.35 * Math.sqrt((bins[(i * 7) % bins.length] ?? 0) / peak);
    return env * level * texture * (1 - 0.92 * quiet);
  });

  return (
    <svg
      width={width}
      height={W.height}
      viewBox={`0 0 ${width} ${W.height}`}
      style={{ position: "absolute", left: 0, top: centerY - half, mixBlendMode: "overlay" }}
    >
      {W.layers.map((scale, i) => (
        <path
          key={scale}
          fill={[c.codeLight, c.code, c.codeDark][i]}
          d={mirroredPath(xs, amp.map((a) => Math.max(1, a * half * scale)), half)}
        />
      ))}
      <rect x={0} y={half - 1} width={width} height={2} fill={c.codeDark} />
    </svg>
  );
};

/** Curva suave (Catmull-Rom) por cima e a mesma espelhada por baixo. */
const mirroredPath = (xs: number[], h: number[], cy: number) => {
  const curve = (pts: [number, number][]) =>
    pts.slice(1).reduce((d, p2, i) => {
      const p0 = pts[Math.max(i - 1, 0)];
      const p1 = pts[i];
      const p3 = pts[Math.min(i + 2, pts.length - 1)];
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      return `${d}C${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${p2[0]} ${p2[1]}`;
    }, "");
  const top = xs.map((x, i): [number, number] => [x, cy - h[i]]);
  const bottom = xs.map((x, i): [number, number] => [x, cy + h[i]]).reverse();
  return `M${top[0][0]} ${top[0][1]}${curve(top)}L${bottom[0][0]} ${bottom[0][1]}${curve(bottom)}Z`;
};

/**
 * Letreiro do visor, girado 270° como na tela do player, correndo sem parar.
 * Duas cópias do texto: quando a primeira passa inteira, volta ao zero e a
 * segunda está exatamente onde ela estava — o loop não tem emenda.
 */
const Marquee: React.FC<{
  text: string;
  left: number;
  top: number;
  width: number;
  height: number;
  fontSize: number;
  lineHeight: number;
  textLeft: number;
}> = ({ text, left, top, width, height, fontSize, lineHeight, textLeft }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const font = `${fontSize}px "${GEIST_PIXEL}"`;
  const copyWidth = useMemo(() => {
    const ctx = document.createElement("canvas").getContext("2d");
    if (!ctx) return 1;
    ctx.font = font;
    return ctx.measureText(text).width;
  }, [font, text]);
  const offset = ((frame / fps) * D.marqueePxPerSecond) % copyWidth;

  return (
    <div style={{ position: "absolute", left, top, width, height, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: textLeft,
          top: height,
          rotate: "270deg",
          transformOrigin: "0% 0%",
          transform: `translateX(${-offset}px)`,
          whiteSpace: "pre",
          fontFamily: GEIST_PIXEL,
          fontSize,
          lineHeight: `${lineHeight}px`,
          color: c.sunLight,
          opacity: 0.9,
        }}
      >
        {text + text + text}
      </div>
    </div>
  );
};

/** Páginas de até N palavras, quebrando também no fim de frase. */
const toPages = (words: DestaqueProps["words"]) => {
  const pages: DestaqueProps["words"][] = [];
  let page: DestaqueProps["words"] = [];
  for (const w of words) {
    page.push(w);
    if (page.length >= D.caption.maxWordsPerPage || /[.?!]$/.test(w.text)) {
      pages.push(page);
      page = [];
    }
  }
  if (page.length) pages.push(page);
  return pages;
};

/** Legenda: a página atual, com a palavra falada agora marcada em amarelo. */
const Captions: React.FC<{ words: DestaqueProps["words"]; opacity: number }> = ({ words, opacity }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ms = (frame / fps) * 1000;
  const pages = useMemo(() => toPages(words), [words]);
  const page = [...pages].reverse().find((p) => p[0].startMs <= ms) ?? pages[0];
  const L = D.caption;

  return (
    <div
      style={{
        position: "absolute",
        left: L.left,
        top: L.top,
        width: L.width,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        columnGap: 16,
        rowGap: 6,
        fontFamily: SANS,
        fontWeight: 700,
        fontSize: L.fontSize,
        lineHeight: `${L.lineHeight}px`,
        letterSpacing: "-0.03em",
        color: c.brandBlack,
        opacity,
      }}
    >
      {page.map((w) => {
        const spoken = w.startMs <= ms && ms < w.endMs;
        return (
          <span
            key={`${w.startMs}-${w.text}`}
            style={{ backgroundColor: spoken ? c.sun : "transparent", borderRadius: 8, padding: "0 10px", margin: "0 -10px" }}
          >
            {w.text}
          </span>
        );
      })}
    </div>
  );
};

/** O fim: a capa inclinada e os ícones descem enquanto o player encolhe. */
const End: React.FC<{ cover: string; ctas: DestaqueProps["ctas"]; progress: number }> = ({ cover, ctas, progress }) => {
  const e = D.fim;
  const platforms = PLATFORM_ORDER.filter((p) => ctas.includes(p));
  const drop = (1 - progress) * -60;

  return (
    <>
      <Img
        src={staticFile(cover)}
        style={{
          position: "absolute",
          left: e.cover.left,
          top: e.cover.top + drop,
          width: e.cover.size,
          height: e.cover.size,
          rotate: `${e.cover.rotateDeg}deg`,
          transformOrigin: "0% 0%",
          opacity: progress,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: e.ctas.top + drop,
          display: "flex",
          justifyContent: "center",
          gap: e.ctas.gapPx,
          opacity: progress,
        }}
      >
        {platforms.map((p) => (
          <PlatformIcon key={p} platform={p} />
        ))}
      </div>
    </>
  );
};
