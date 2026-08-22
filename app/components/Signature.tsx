"use client";

import { useId, useRef } from "react";
import { CENTERLINES } from "./signature-data";
import useIsomorphicLayoutEffect from "../lib/use-isomorphic-layout-effect";

// Handwritten signature, drawn on scroll-in as if being written live.
//
// The source SVG is five FILLED OUTLINE paths (each traces AROUND a pen
// stroke), not stroked lines — so stroke-dashoffset can't drive them directly.
// scripts/build-signature.mjs recovers each stroke's centreline offline and
// bakes it into signature-data.js; here that centreline is stroked inside a
// mask and wiped on, which reveals the fill in the direction the pen travelled.
// Re-run the script if the signature artwork changes.
//
// Listed in DRAW ORDER, which is not the source document order: the D curve
// first, then the marks inside it, then the long right-hand stroke last.
// `source` indexes into the generated CENTERLINES, so this array can be
// reordered freely without regenerating anything.
const STROKES = [
  {
    d: "M1107.647 359.71C1109.505 359.882 1112.145 360.024 1113.633 362.264 1120.182 372.121 1127.593 391.74 1132.346 405.394 1174.294 525.921 1198.297 690.618 1216.583 835.069 1234.673 978.006 1253.514 1174.753 1218.001 1309.43 1205.524 1356.75 1185.273 1396.835 1160.74 1411.004 1138.94 1423.599 1113.534 1412.226 1093.593 1389.616 1035.098 1323.305 984.715 1205.024 939.785 1101.458 909.413 1031.451 881.002 959.861 850.703 891.051 828.549 840.74 792.238 759.906 765.321 725.645 763.603 723.707 762.059 721.758 760.404 719.537 755.473 712.995 754.159 692.23 761.89 692.579 766.726 692.798 773.379 702.352 777.425 708.341 800.431 742.405 820.997 785.413 840.601 828.272 876.64 907.068 910.298 991.011 944.958 1072.674 963.087 1115.631 981.731 1157.538 1000.871 1198.351 1034.898 1269.768 1093.283 1389.227 1142.784 1388.245 1160.956 1387.882 1179.967 1365.891 1192.358 1336.758 1250.291 1200.508 1217.736 945.944 1196.979 788.89 1185.457 701.701 1170.438 606.815 1151.596 526.392 1142.36 486.972 1131.456 448.304 1118.852 413.434 1114.881 402.448 1104.267 384.613 1103.829 372.302 1103.67 367.819 1105.663 363.58 1107.135 360.705L1107.647 359.71z",
    // Long sweeping stroke: minimum-jerk. Limb movement has a bell-shaped
    // velocity profile, which integrates to a symmetric ease-in-out — this is
    // the nearest cubic-bezier to 10t³−15t⁴+6t⁵.
    source: 0,
    easing: "cubic-bezier(0.45, 0, 0.55, 1)",
    liftAfter: 110, // pen-lift before the next stroke, ms
  },
  {
    d: "M990.51 1396.741C1017.354 1392.009 1055.763 1410.426 1063.861 1476.105 1065.47 1493.069 1071.998 1589.989 1054.091 1571.734 1049.657 1567.217 1053.803 1529.121 1052.976 1515.168 1051.392 1488.445 1051.853 1467.058 1040.434 1449.906 1025.959 1428.169 1006.696 1420.762 989.47 1425.911 942.338 1443.023 1009.258 1549.284 1020.171 1575.767 1030.415 1600.609 1042.792 1622.949 1050.376 1653.247 1066.975 1719.572 1037.198 1782.16 1038.135 1848.982 1038.993 1910.065 1047.69 1971.468 1052.704 2031.932 1057.638 2094.682 1058.847 2156.489 1060.8 2219.87 1061.344 2237.547 1064.617 2276.207 1061.804 2291.532 1061.192 2294.852 1060.104 2297.943 1058.504 2299.154 1056.76 2300.47 1054.43 2299.489 1052.878 2297.459 1048.159 2291.262 1048.23 2231.511 1047.9 2218.553 1046.327 2156.758 1044.47 2095.649 1039.684 2034.594 1034.945 1974.131 1024.015 1905.709 1025.144 1844.735 1025.512 1824.867 1027.312 1804.595 1030.167 1785.736 1034.559 1756.701 1042.737 1725.218 1042.443 1694.127 1041.763 1622.035 966.393 1540.037 959.947 1462.515 958.843 1449.233 959.942 1435.508 963.576 1424.446 969.678 1405.855 980.779 1400.263 990.51 1396.741z",
    source: 1,
    // Drawn LAST. Not minimum-jerk like the other long stroke: this one is a
    // closing flourish, so it gets an expo-out — nearly all the distance is
    // covered early, then it releases. durationScale takes it below the beat
    // its length would otherwise earn.
    easing: "cubic-bezier(0.16, 1, 0.3, 1)",
    durationScale: 0.75,
    liftAfter: 0,
  },
  {
    d: "M1126.408 802.161C1131.501 801.832 1136.215 807.379 1134.108 821.004 1133.333 826.007 1128.741 831.161 1126.401 833.306 1111.497 846.968 1096 857.89 1081.14 871.914 1056.991 894.637 1034.283 919.95 1009.292 938.455 1000.837 940.757 998.534 918.018 1005.564 912.155 1041.344 882.32 1075.185 843.171 1111.418 815.678 1116.396 811.899 1121.724 807.279 1126.408 802.161z",
    source: 2,
    // Short marks are ballistic flicks — launched fast, no gentle wind-up.
    easing: "cubic-bezier(0.3, 0, 0.35, 1)",
    liftAfter: 90,
  },
  {
    d: "M976.49 674.431C985.14 675.436 996.333 719.158 1000.278 736.372 1004.228 753.623 1012.402 787.331 1011.839 807.11 1011.74 810.585 1008.424 814.208 1006.995 815.798 1000.89 814.845 999.111 801.836 997.088 791.191 991.765 762.866 986.691 735.896 977.785 711.929 972.448 697.567 968.015 686.532 976.49 674.431z",
    source: 3,
    easing: "cubic-bezier(0.3, 0, 0.35, 1)",
    liftAfter: 70,
  },
  {
    d: "M1009.627 629.814C1011.212 630.377 1014.787 632.243 1015.565 635.493 1023.799 669.918 1033.185 703.085 1041.235 737.697 1043.932 749.293 1042.098 755.468 1037.506 762.416 1034.835 760.56 1032.935 758.428 1031.199 753.476 1026.235 739.318 1003.611 653.814 1004.756 640.849 1005.23 635.491 1007.688 632.543 1009.627 629.814z",
    source: 4,
    easing: "cubic-bezier(0.3, 0, 0.35, 1)",
    // Long reach across to the right-hand stroke.
    liftAfter: 150,
  },
];

// Draw order: D curve, its interior marks, then the right-hand stroke last.
const ORDER = [0, 2, 3, 4, 1];
const DRAWN = ORDER.map((i) => ({ ...STROKES[i], line: CENTERLINES[STROKES[i].source] }));

// The export was a portrait artboard flipped upright with `rotate: 270deg` on
// the <svg>, which doesn't survive inlining — so the rotation is baked into a
// <g> instead: rotate(-90) maps (x, y) -> (y, -x).
//
// This is the TIGHT bounding box of the actual ink, not the exported artboard,
// which carried ~360/454 units of dead margin left/right and ~200 top/bottom
// (the ink filled only 38% of it). Cropping it is what lets the signature align
// flush with the name beneath it. Natural aspect of the ink is 4.028:1; it is
// stretched to ASPECT below via preserveAspectRatio="none", matching what the
// original export did.
const VIEW_BOX = "359.710 -1238.070 1940.043 481.671";
const MASK_REGION = { x: 400, y: -200, width: 1200, height: 3200 };

// The ink's own aspect is 4.028:1, but the original export squashed the
// artboard non-uniformly before rotating it, which rendered the ink at
// 1.954:1 — the proportion the signature is meant to be read at. Held here
// rather than at the call site so callers only pick a width.
const ASPECT = "1.954 / 1";

// Ink time is spread by length^0.72 rather than length: a stroke twice as long
// doesn't take twice as long to write, because the pen reaches a higher peak
// speed over longer travels.
const LENGTH_EXPONENT = 0.72;
const TOTAL_DRAW_MS = 1500;
const MIN_STROKE_MS = 180;

const TIMELINE = (() => {
  const weights = DRAWN.map((s) => Math.pow(s.line.length, LENGTH_EXPONENT));
  const sum = weights.reduce((a, b) => a + b, 0);
  let cursor = 0;
  return DRAWN.map((stroke, i) => {
    const duration =
      Math.max(MIN_STROKE_MS, (weights[i] / sum) * TOTAL_DRAW_MS) *
      (stroke.durationScale ?? 1);
    const step = { duration, delay: cursor, easing: stroke.easing };
    cursor += duration + stroke.liftAfter;
    return step;
  });
})();

type SignatureProps = {
  className?: string;
  title?: string;
};

export default function Signature({
  className = "",
  title = "Assinatura",
}: SignatureProps) {
  const rawId = useId();
  const maskId = `sig-${rawId.replace(/:/g, "")}`;
  const rootRef = useRef<SVGSVGElement | null>(null);
  // One slot per drawn stroke; a slot is null while its <path> is unmounted.
  const maskRefs = useRef<(SVGPathElement | null)[]>([]);

  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Rendered visible so it degrades gracefully without JS; hidden here before
    // paint, so there's no flash of the finished signature.
    maskRefs.current.forEach((el, i) => {
      if (el) el.style.strokeDashoffset = String(DRAWN[i].line.length);
    });

    let animations: Animation[] = [];
    let played = false;
    let observer: IntersectionObserver | null = null;

    const cancelAll = () => {
      for (const animation of animations) animation.cancel();
      animations = [];
    };

    // Draws ONCE, the first time it scrolls into view, and is then left on
    // screen as finished ink. It used to redraw itself every 5s for as long as
    // it stayed visible — auto-playing motion that never ends needs a
    // pause/stop control, and a control bolted onto a signature is worse than
    // simply not looping. The whole sequence is ~2s, well under the five-second
    // threshold, so drawing once needs no control at all.
    const play = () => {
      if (played) return;
      played = true;

      cancelAll();
      maskRefs.current.forEach((el, i) => {
        if (!el) return;
        animations.push(
          el.animate(
            [
              { strokeDashoffset: DRAWN[i].line.length },
              { strokeDashoffset: 0 },
            ],
            { ...TIMELINE[i], fill: "forwards" },
          ),
        );
      });

      observer?.disconnect();
    };

    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) play();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(root);

    return () => {
      observer?.disconnect();
      cancelAll();
    };
  }, [maskId]);

  return (
    <svg
      ref={rootRef}
      viewBox={VIEW_BOX}
      preserveAspectRatio="none"
      style={{ aspectRatio: ASPECT }}
      role="img"
      aria-label={title}
      className={className}
      fill="currentColor"
    >
      <defs>
        {DRAWN.map(({ line }, i) => (
          <mask
            key={i}
            id={`${maskId}-${i}`}
            maskUnits="userSpaceOnUse"
            x={MASK_REGION.x}
            y={MASK_REGION.y}
            width={MASK_REGION.width}
            height={MASK_REGION.height}
          >
            <path
              ref={(el) => {
                maskRefs.current[i] = el;
              }}
              d={line.d}
              fill="none"
              stroke="#fff"
              strokeWidth={line.width}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={line.length}
              strokeDashoffset={0}
            />
          </mask>
        ))}
      </defs>

      <g transform="rotate(-90)">
        {DRAWN.map((stroke, i) => (
          <path key={i} d={stroke.d} mask={`url(#${maskId}-${i})`} />
        ))}
      </g>
    </svg>
  );
}
