import { useId } from "react";
import type { Ref } from "react";
import { colors } from "../colors.ts";
import { crayonOutline, grainMatrix } from "./crayon.ts";
import { CURSORS } from "./cursors.ts";
import { meridiansPath, parallelsPath, spinFrames } from "./globe.ts";
import { orbitAxes, orbitPoint } from "./orbit.ts";
import { gridPath } from "./pixels.ts";
import { CURSOR_PIXEL, SUN_RADIUS } from "./types.ts";
import type { LogoConfig } from "./types.ts";

/** Set in stone: the sun is always the `sun` token, whatever the style. */
const SUN = colors.sun;

/**
 * Set in stone: every logo draws on the same 1000×1000 grid. Nothing in the
 * config resizes it, so the sun and the cursor keep their proportions in
 * every variant; what goes past the edge is clipped, like an artboard.
 */
export const LOGO_GRID = 1000;

/** Set in stone: the backdrop, when on, is always the `brand-white` token. */
const BACKDROP = colors.brandWhite;

const INK = colors.brandBlack;
const PAPER = "#ffffff";

type LogoProps = {
  config: LogoConfig;
  /** CSS size of the SVG; the drawing always fills it. */
  size?: number | string;
  /** Accessible name. Omit for decorative use. */
  title?: string;
  /** Dashed orbit path: a playground guide, never part of an export. */
  showOrbit?: boolean;
  /** Draw the first frame only, even when the globe spins: the static version. */
  still?: boolean;
  className?: string;
  ref?: Ref<SVGSVGElement>;
};

/**
 * The Links Amarelos mark, from parameters: the sun, a cursor clicking it from
 * a point on its orbit, and optionally the orbit drawn as a ring. The same
 * component renders the website, the crayola playground and the exported
 * files. A spinning globe animates inside the SVG itself (stepped SMIL
 * frames), so the exported file plays anywhere an SVG does.
 */
export function Logo({
  config,
  size = "100%",
  title,
  showOrbit = false,
  still = false,
  className,
  ref,
}: LogoProps) {
  const { sun, orbit } = config;
  // Unique per instance: a page can show many logos, each with its own clip.
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const clipId = `sun-${uid}`;
  const crayonId = `crayon-${uid}`;
  const crayon = config.style.kind === "crayon" ? config.style : null;
  const tip = orbitPoint(config);
  const cursor = CURSORS[config.cursor];
  const axes = orbitAxes(config);
  // The globe's lines, oriented by the orbit when they are matched.
  const globe =
    config.style.kind === "globe"
      ? config.style.matchOrbit
        ? { ...config.style, inclination: orbit.inclination, tilt: orbit.tilt }
        : config.style
      : null;
  const spin = globe && !still && globe.spin !== 0 ? spinFrames(globe, sun.cx, sun.cy) : null;

  // The cursor, positioned so its hotspot is on the orbit.
  const cursorLayer = (
    <g filter={crayon?.cursor ? `url(#${crayonId})` : undefined}>
      <g transform={`translate(${tip.x} ${tip.y}) scale(${CURSOR_PIXEL})`}>
        <g transform={`translate(${-cursor.hotspot[0]} ${-cursor.hotspot[1]})`}>
          {cursor.kind === "pixel" ? (
            // eslint-disable-next-line anti-slop/no-shape-in-symbol-names -- SVG's own attribute name.
            <g shapeRendering="crispEdges">
              <path d={gridPath(cursor.grid, "#")} fill={INK} />
              <path d={gridPath(cursor.grid, ".")} fill={PAPER} />
            </g>
          ) : (
            <path
              d={cursor.path}
              fill={INK}
              stroke={PAPER}
              strokeWidth={cursor.stroke}
              strokeLinejoin="round"
              paintOrder="stroke"
            />
          )}
        </g>
      </g>
    </g>
  );

  // The orbit as two halves: the far one goes under the sun, the near one over.
  const p0 = orbitPoint({ ...config, orbit: { ...orbit, angle: 0 } });
  const p180 = orbitPoint({ ...config, orbit: { ...orbit, angle: 180 } });
  const nearHalf = `M${p0.x} ${p0.y}A${axes.rx} ${axes.ry} ${orbit.tilt} 0 1 ${p180.x} ${p180.y}`;
  const farHalf = `M${p180.x} ${p180.y}A${axes.rx} ${axes.ry} ${orbit.tilt} 0 1 ${p0.x} ${p0.y}`;
  const wholeOrbit = (
    <ellipse
      cx={sun.cx}
      cy={sun.cy}
      rx={axes.rx}
      ry={axes.ry}
      transform={`rotate(${orbit.tilt} ${sun.cx} ${sun.cy})`}
    />
  );

  const ring = config.ring;
  const ringStroke = {
    fill: "none",
    stroke: colors[ring.color],
    strokeWidth: ring.line,
    strokeLinecap: ring.cap,
    strokeDasharray: ring.dashed ? `${ring.dash} ${ring.gap}` : undefined,
    opacity: ring.opacity,
  };
  const guide = {
    fill: "none",
    stroke: INK,
    strokeOpacity: 0.35,
    strokeWidth: 2,
    strokeDasharray: "8 10",
  };
  // Behind the sun: the far half (or nothing, for a face-on ring).
  const orbitBehind = (
    <>
      {ring.on && axes.inclined && <path d={farHalf} {...ringStroke} />}
      {showOrbit && !ring.on && <g {...guide}>{wholeOrbit}</g>}
    </>
  );
  // Over the sun: the near half, or all of a face-on ring.
  const orbitInFront = (
    <>
      {ring.on && (axes.inclined ? <path d={nearHalf} {...ringStroke} /> : <g {...ringStroke}>{wholeOrbit}</g>)}
      {showOrbit &&
        !ring.on &&
        (axes.inclined ? <path d={nearHalf} {...guide} /> : <g {...guide}>{wholeOrbit}</g>)}
    </>
  );

  return (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox={`0 0 ${LOGO_GRID} ${LOGO_GRID}`}
      xmlns="http://www.w3.org/2000/svg"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      className={className}
    >
      {title && <title>{title}</title>}
      {crayon && (
        // Crayon: paper shows through the wax (grain), and every edge goes ragged (roughness).
        <defs>
          <filter id={crayonId} x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency={`${crayon.grainX} ${crayon.grainY}`}
              numOctaves={2}
              seed={crayon.seed}
              result="wax"
            />
            <feColorMatrix in="wax" type="matrix" values={grainMatrix(crayon)} result="paper" />
            <feComposite in="SourceGraphic" in2="paper" operator="in" result="grained" />
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves={2} seed={crayon.seed + 1} result="hand" />
            <feDisplacementMap
              in="grained"
              in2="hand"
              scale={crayon.roughness}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      )}
      {config.backdrop && <rect width={LOGO_GRID} height={LOGO_GRID} fill={BACKDROP} />}

      {orbitBehind}
      {tip.behind && cursorLayer}
      {crayon ? (
        <path d={crayonOutline(crayon, sun.cx, sun.cy)} fill={SUN} filter={`url(#${crayonId})`} />
      ) : (
        <circle cx={sun.cx} cy={sun.cy} r={SUN_RADIUS} fill={SUN} />
      )}
      {globe && (
        // Clipped to the sun: a line ending at the edge never spills past it.
        <g
          clipPath={`url(#${clipId})`}
          fill="none"
          stroke={colors[globe.color]}
          // Opacity on the whole group, not each stroke: crossings stay one tone.
          opacity={globe.opacity}
          strokeWidth={globe.line}
          strokeLinecap={globe.cap}
          strokeLinejoin="round"
        >
          <clipPath id={clipId}>
            <circle cx={sun.cx} cy={sun.cy} r={SUN_RADIUS} />
          </clipPath>
          <path d={parallelsPath(globe, sun.cx, sun.cy)} />
          <path d={spin ? spin.frames[0] : meridiansPath(globe, sun.cx, sun.cy, globe.turn)}>
            {spin && (
              <animate
                attributeName="d"
                values={spin.frames.join(";")}
                dur={`${spin.seconds.toFixed(3)}s`}
                calcMode="discrete"
                repeatCount="indefinite"
              />
            )}
          </path>
          {globe.outline && <circle cx={sun.cx} cy={sun.cy} r={SUN_RADIUS - globe.line / 2} />}
        </g>
      )}
      {orbitInFront}
      {!tip.behind && cursorLayer}
    </svg>
  );
}
