// Final token set — named via agentation comments on the old comparison
// grids, matched by exact swatch background color. Every other yellow that
// used to exist in the codebase (amber-50..900, --amarelo, --amarelo-dark,
// the oklch body bg, a couple one-off hexes) got folded into whichever of
// these 6 is closest in OKLab space. Registered as real Tailwind tokens in

// globals.css (--color-brand-white etc.) — these are now bg-sun, text-sun-light...
const TOKENS = [
  {
    name: "brand-white",
    swatch: "bg-brand-white",
    value: "#fffbeb",
    replaces: "amber-50",
  },
  {
    name: "sun-lighter",
    swatch: "bg-sun-lighter",
    value: "#fef3c7",
    replaces: "amber-100",
  },
  {
    name: "sun-light",
    swatch: "bg-sun-light",
    value: "#fde68a",
    replaces: "amber-200, body bg, #fee685, #ffe270",
  },
  {
    name: "sun",
    swatch: "bg-sun",
    value: "#ffcc00",
    replaces: "--amarelo, amber-300, amber-400",
  },
  {
    name: "sun-dark",
    swatch: "bg-sun-dark",
    value: "#f59e0b",
    replaces:
      "amber-500, --amarelo-dark, amber-600, amber-700, amber-800, amber-900",
  },
];

// Final token set — 3 shades picked and named via agentation, everything
// else (blue-200/600/700, the other azure-radiance candidates) folded in or
// dropped in favor of these.
const BLUES = [
  {
    name: "code-light",
    swatch: "bg-code-light",
    value: "#dbeafe",
    replaces: "azure-radiance-100 (new — no prior usage)",
  },
  {
    name: "code",
    swatch: "bg-code",
    value: "#3b82f6",
    replaces: "blue-200, blue-500, blue-600",
  },
  {
    name: "code-dark",
    swatch: "bg-code-dark",
    value: "#1e40af",
    replaces: "blue-700, blue-800",
  },
];

// Chosen via the color-picker experiment — real black, replaces the old
// #442304 (--foreground, formerly amber-950-ish) site-wide.
const BLACKS = [
  {
    name: "brand-black",
    swatch: "bg-brand-black",
    value: "#110a03",
    replaces: "--foreground (#442304)",
  },
];

// OG image canvas — standard Open Graph size, 1.91:1. Safe margin is a rough
// guide: platforms crop previews differently (Slack/iMessage tighter than
// Facebook/LinkedIn), so keep logo/headline text inside the dashed inset.
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const OG_SAFE_MARGIN = 64;

// Podcast waveform for the "salamaleiko" corner — a spiky silhouette
// mirrored around a center line (top row = amplitude up, bottom row = same
// amplitude down), not a bottom-aligned EQ bar chart. Two loud clusters with
// a quiet dip between them, per the reference.
const WAVEFORM_AMPLITUDES = [
  3, 4, 7, 6, 10, 14, 11, 9, 6, 7, 11, 15, 19, 17, 13, 15, 21, 18, 14, 11, 15,
  21, 26, 24, 18, 22, 27, 25, 19, 23, 27, 22, 17, 13, 15, 11, 7, 8, 6, 4,
];
const WAVE_W = 280;
const WAVE_H = 64;

function waveformPath(
  amplitudes: readonly number[],
  width: number,
  height: number,
) {
  const cy = height / 2;
  const step = width / (amplitudes.length - 1);
  const top = amplitudes.map(
    (a, i) =>
      `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${(cy - a).toFixed(1)}`,
  );
  const bottom = amplitudes
    .slice()
    .reverse()
    .map((a, i) => `L${(width - i * step).toFixed(1)},${(cy + a).toFixed(1)}`);
  return `${top.join(" ")} ${bottom.join(" ")} Z`;
}

function OgCanvas() {
  return (
    <div
      className="relative bg-sun-lighter shrink-0"
      style={{ width: OG_WIDTH, height: OG_HEIGHT }}
    >
      <div
        className="absolute border-3 bg-sun-light border-sun pointer-events-none"
        style={{ inset: OG_SAFE_MARGIN }}
      >
        <div className="h-full w-full divide-y-3 divide-sun grid grid-rows-5">
          <div className="grid grid-cols-5 divide-x-3 divide-sun overflow-hidden">
            <div className="col-span-1 px-4 py-2">
              <p className="font-redacted text-sm text-sun">
                links amarelos pra sempre, links amarelos até morrer <br></br>{" "}
                ondas amarelas pra sempre, ondas amarelas até morrer
              </p>
            </div>
            <div className="col-span-4 bg-[url('/bg-texture.svg')] bg-repeat" />
          </div>

          <div className="row-span-3 min-h-0 divide-x-3 divide-sun overflow-hidden grid grid-cols-5">
            <div className="col-span-1 shrink-0 flex items-center justify-center p-4 overflow-hidden bg-[url('/bg-texture.svg')] bg-repeat">
              {/* eslint-disable-next-line @next/next/no-img-element -- static file convention icon, not an optimizable asset */}
              <img src="/icon.svg" alt="" className="w-32 h-32 shrink-0" />
            </div>
            <div className="col-span-4 min-w-0 flex items-center px-6 overflow-hidden bg-sun">
              <p className="font-manrope font-semibold tracking-tight text-6xl leading-tight text-brand-black">
                Uma curadoria mensal do melhor que a internet ainda tem pra
                oferecer
              </p>
            </div>
          </div>

          <div className="shrink-0 flex divide-x-3 divide-sun overflow-hidden">
            <div className="flex-1 bg-[url('/bg-texture.svg')] bg-repeat"></div>
            <div className="w-2/5 shrink-0 flex items-center px-6 py-4 overflow-hidden bg-code">
              <svg
                width="100%"
                height={WAVE_H}
                viewBox={`0 0 ${WAVE_W} ${WAVE_H}`}
                preserveAspectRatio="none"
                className="w-full"
              >
                <path
                  d={waveformPath(WAVEFORM_AMPLITUDES, WAVE_W, WAVE_H)}
                  className="fill-sun-light"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <span className="absolute top-3 left-3 text-[11px] font-space-mono text-brand-black/40">
        {OG_WIDTH}×{OG_HEIGHT}
      </span>
    </div>
  );
}

export default function PlaygroundPage() {
  return (
    <main className="font-space-mono min-h-screen bg-brand-white px-6 py-12">
      <div className="space-y-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-manrope font-semibold text-stone-900">
            Playground
          </h1>
          <p className="text-sm text-stone-600">
            Espaço pra conferir peças visuais antes de ir pro ar.
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-stone-700">
            Paleta — amarelos ({TOKENS.length} tokens, era 14 tons)
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {TOKENS.map(({ name, swatch, value, replaces }) => (
              <div key={name} className="space-y-1.5">
                <div
                  className={`h-16 rounded border border-stone-200 ${swatch}`}
                />
                <p className="text-[11px] font-semibold text-stone-800">
                  {name}
                </p>
                <p className="text-[10px] text-stone-500 font-space-mono">
                  {value}
                </p>
                <p className="text-[10px] text-stone-400 leading-snug">
                  substitui: {replaces}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-stone-700">
            Paleta — azuis ({BLUES.length} tokens, era 5 tons)
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {BLUES.map(({ name, swatch, value, replaces }) => (
              <div key={name} className="space-y-1.5">
                <div
                  className={`h-16 rounded border border-stone-200 ${swatch}`}
                />
                <p className="text-[11px] font-semibold text-stone-800">
                  {name}
                </p>
                <p className="text-[10px] text-stone-500 font-space-mono">
                  {value}
                </p>
                <p className="text-[10px] text-stone-400 leading-snug">
                  substitui: {replaces}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-stone-700">
            Paleta — preto ({BLACKS.length} token)
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {BLACKS.map(({ name, swatch, value, replaces }) => (
              <div key={name} className="space-y-1.5">
                <div
                  className={`h-16 rounded border border-stone-200 ${swatch}`}
                />
                <p className="text-[11px] font-semibold text-stone-800">
                  {name}
                </p>
                <p className="text-[10px] text-stone-500 font-space-mono">
                  {value}
                </p>
                <p className="text-[10px] text-stone-400 leading-snug">
                  substitui: {replaces}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-stone-700">
            OG image — {OG_WIDTH}×{OG_HEIGHT} (1.91:1)
          </h2>
          <p className="text-xs text-stone-500 max-w-2xl">
            Tracejado = margem de segurança ({OG_SAFE_MARGIN}px). Mantenha
            logo/headline dentro dele — Slack e iMessage cortam mais apertado
            que Facebook/LinkedIn. Fora da caixa é zona de risco de corte.
          </p>
          <div className="overflow-x-auto pb-2">
            <OgCanvas />
          </div>

          <div className="flex items-end gap-3 pt-1">
            <div
              className="overflow-hidden shrink-0"
              style={{ width: OG_WIDTH * 0.25, height: OG_HEIGHT * 0.25 }}
            >
              <div
                style={{
                  transform: "scale(0.25)",
                  transformOrigin: "top left",
                }}
              >
                <OgCanvas />
              </div>
            </div>
            <p className="text-[10px] text-stone-400 max-w-40 leading-snug">
              ~300px — tamanho aproximado de preview em chat/feed. Se não ler
              aqui, não vai ler lá.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
