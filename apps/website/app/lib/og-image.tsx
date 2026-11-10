import { ImageResponse } from "next/og";
import fs from "node:fs";
import path from "node:path";

// Shared by every opengraph-image.js route file — same layout, different
// tagline. Ported from the /playground OgCanvas by hand: next/og renders via
// Satori, which has no CSS Grid and no Tailwind, only flexbox + inline
// styles, so this can't just reuse the Tailwind classes from the playground.

export const OG_SIZE = { width: 1200, height: 630 };
const SAFE_MARGIN = 64;

const SUN = "#ffcc00";
const SUN_LIGHT = "#fde68a";
const SUN_LIGHTER = "#fef3c7";
const CODE = "#3b82f6";
const BRAND_BLACK = "#110a03";

const ICON_DATA_URI = `data:image/svg+xml;base64,${Buffer.from(
  fs.readFileSync(path.join(process.cwd(), "app/icon.svg")),
).toString("base64")}`;

const ROW1_LINES = [
  "links amarelos pra sempre, links amarelos até morrer",
  "ondas amarelas pra sempre, ondas amarelas até morrer",
];

// Same spiky mirrored waveform as the playground — see app/playground/page.js
// for the from-scratch version with commentary.
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

// next/og can't use next/font (that's a build-time CSS/webpack integration) —
// fonts have to be fetched as raw bytes per request. This is the documented
// Vercel pattern: ask Google's CSS API for only the glyphs this text needs,
// then follow the @font-face src url to the actual font file.
async function loadGoogleFont(family: string, weight: number, text: string) {
  const params = new URLSearchParams({ family: `${family}:wght@${weight}`, text });
  const css = await (
    await fetch(`https://fonts.googleapis.com/css2?${params}`)
  ).text();
  const match = css.match(
    /src: url\(([^)]+)\) format\('(opentype|truetype)'\)/,
  );
  if (!match) throw new Error(`could not resolve font file for ${family} ${weight}`);
  const res = await fetch(match[1]);
  return res.arrayBuffer();
}

// Headline length varies per page — scale it down instead of letting long
// taglines overflow their row.
function headlineFontSize(tagline: string) {
  if (tagline.length > 90) return 40;
  if (tagline.length > 70) return 46;
  return 54;
}

export async function renderOgImage(tagline: string) {
  const row1Text = ROW1_LINES.join("");
  const [manrope, spaceMono, redacted] = await Promise.all([
    loadGoogleFont("Manrope", 700, tagline),
    loadGoogleFont("Space Mono", 400, row1Text),
    loadGoogleFont("Redacted", 400, row1Text),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: OG_SIZE.width,
          height: OG_SIZE.height,
          display: "flex",
          position: "relative",
          backgroundColor: SUN_LIGHTER,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: SAFE_MARGIN,
            left: SAFE_MARGIN,
            right: SAFE_MARGIN,
            bottom: SAFE_MARGIN,
            display: "flex",
            flexDirection: "column",
            border: `3px solid ${SUN}`,
            backgroundColor: SUN_LIGHT,
          }}
        >
          {/* row 1 — brand mantra, same on every page */}
          <div
            style={{
              height: 84,
              display: "flex",
              borderBottom: `3px solid ${SUN}`,
            }}
          >
            <div
              style={{
                width: 214,
                borderRight: `3px solid ${SUN}`,
                padding: 16,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: 2,
              }}
            >
              {ROW1_LINES.map((line) => (
                <div
                  key={line}
                  style={{
                    fontFamily: "Redacted",
                    fontSize: 12,
                    color: SUN,
                    lineHeight: 1.3,
                  }}
                >
                  {line}
                </div>
              ))}
            </div>
            <div style={{ flex: 1, backgroundColor: SUN_LIGHT }} />
          </div>

          {/* row 2 — icon badge + per-page tagline */}
          <div
            style={{
              height: 294,
              display: "flex",
              borderBottom: `3px solid ${SUN}`,
            }}
          >
            <div
              style={{
                width: 214,
                backgroundColor: CODE,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- Satori (next/og) requires a plain img, next/image is not usable inside ImageResponse */}
              <img src={ICON_DATA_URI} width={140} height={140} alt="" />
            </div>
            <div
              style={{
                flex: 1,
                backgroundColor: SUN,
                display: "flex",
                alignItems: "center",
                padding: "0 48px",
              }}
            >
              <div
                style={{
                  fontFamily: "Manrope",
                  fontWeight: 700,
                  fontSize: headlineFontSize(tagline),
                  lineHeight: 1.15,
                  letterSpacing: "-1px",
                  color: BRAND_BLACK,
                }}
              >
                {tagline}
              </div>
            </div>
          </div>

          {/* row 3 — waveform, podcast signifier */}
          <div style={{ height: 118, display: "flex" }}>
            <div style={{ flex: 1, backgroundColor: SUN_LIGHT }} />
            <div
              style={{
                width: 429,
                backgroundColor: CODE,
                display: "flex",
                alignItems: "center",
                padding: "0 24px",
              }}
            >
              <svg
                width="100%"
                height={WAVE_H}
                viewBox={`0 0 ${WAVE_W} ${WAVE_H}`}
                preserveAspectRatio="none"
              >
                <path
                  d={waveformPath(WAVEFORM_AMPLITUDES, WAVE_W, WAVE_H)}
                  fill={SUN_LIGHTER}
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Manrope", data: manrope, weight: 700, style: "normal" },
        { name: "Space Mono", data: spaceMono, weight: 400, style: "normal" },
        { name: "Redacted", data: redacted, weight: 400, style: "normal" },
      ],
    },
  );
}
