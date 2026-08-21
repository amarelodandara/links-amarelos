// Regenerates the baked centreline data in app/components/signature-data.js
// from a signature SVG of filled outline paths.
//
//   node scripts/build-signature.mjs <path-to.svg>
//
// Each path traces AROUND a pen stroke, so its outline has two "caps" (the
// stroke's endpoints) with a side running between them. We locate both caps by
// searching for the split that minimises the mean distance between paired
// points, then take the midpoints of those pairs as the centreline. That
// centreline, stroked and used as a mask, is what animates.
import { readFileSync, writeFileSync } from "node:fs";

const SAMPLES = 600;
const OUT_POINTS = 160;

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

function parsePath(d) {
  const tokens = d.match(/[MCLZz]|-?\d*\.?\d+/g);
  const segs = [];
  let i = 0, cmd = null, cur = null, start = null;
  while (i < tokens.length) {
    const t = tokens[i];
    if (/[MCLZz]/.test(t)) { cmd = t; i += 1; continue; }
    if (cmd === "M") {
      cur = [+tokens[i], +tokens[i + 1]]; start = cur; i += 2; cmd = "L";
    } else if (cmd === "C") {
      const p1 = [+tokens[i], +tokens[i + 1]];
      const p2 = [+tokens[i + 2], +tokens[i + 3]];
      const p3 = [+tokens[i + 4], +tokens[i + 5]];
      segs.push(["C", cur, p1, p2, p3]); cur = p3; i += 6;
    } else if (cmd === "L") {
      const p = [+tokens[i], +tokens[i + 1]];
      segs.push(["L", cur, p]); cur = p; i += 2;
    } else { i += 1; }
  }
  if (cur && start && (cur[0] !== start[0] || cur[1] !== start[1])) segs.push(["L", cur, start]);
  return segs;
}

function pointAt(seg, t) {
  if (seg[0] === "L") {
    const [, a, b] = seg;
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  }
  const [, p0, p1, p2, p3] = seg, u = 1 - t;
  return [
    u ** 3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t ** 3 * p3[0],
    u ** 3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t ** 3 * p3[1],
  ];
}

function flatten(segs, per = 60) {
  const pts = [];
  for (const s of segs) {
    for (let k = 0; k <= per; k++) {
      if (k === 0 && pts.length) continue;
      pts.push(pointAt(s, k / per));
    }
  }
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + dist(pts[i], pts[i - 1]));
  return { pts, cum };
}

function at(pts, cum, len) {
  if (len <= 0) return pts[0];
  if (len >= cum[cum.length - 1]) return pts[pts.length - 1];
  let lo = 0, hi = cum.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (cum[mid] < len) lo = mid; else hi = mid;
  }
  const span = cum[hi] - cum[lo], f = span === 0 ? 0 : (len - cum[lo]) / span;
  return [pts[lo][0] + (pts[hi][0] - pts[lo][0]) * f, pts[lo][1] + (pts[hi][1] - pts[lo][1]) * f];
}

const cumOf = (seg) => {
  const c = [0];
  for (let i = 1; i < seg.length; i++) c.push(c[i - 1] + dist(seg[i], seg[i - 1]));
  return c;
};

function pairSides(P, a, b, samples) {
  const N = P.length - 1;
  const lenA = ((b - a) % N + N) % N;
  const lenB = ((a - b) % N + N) % N;
  if (lenA < 8 || lenB < 8) return null;
  const A = Array.from({ length: lenA + 1 }, (_, i) => P[(a + i) % N]);
  const B = Array.from({ length: lenB + 1 }, (_, i) => P[(b + i) % N]).reverse();
  const ca = cumOf(A), cb = cumOf(B);
  if (!ca[ca.length - 1] || !cb[cb.length - 1]) return null;
  const widths = [], center = [];
  for (let i = 0; i <= samples; i++) {
    const u = i / samples;
    const p = at(A, ca, u * ca[ca.length - 1]);
    const q = at(B, cb, u * cb[cb.length - 1]);
    widths.push(dist(p, q));
    center.push([(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]);
  }
  return { widths, center };
}

function findCaps(P) {
  const N = SAMPLES;
  let best = null;
  for (let a = 0; a < N - 1; a += 10) {
    for (let b = a + 30; b < N - 1; b += 10) {
      const r = pairSides(P, a, b, 60);
      if (!r) continue;
      const mean = r.widths.reduce((x, y) => x + y, 0) / r.widths.length;
      if (!best || mean < best.mean) best = { mean, a, b };
    }
  }
  // Refine around the coarse optimum.
  const refined = { ...best };
  for (let a = Math.max(0, best.a - 12); a <= best.a + 12; a += 2) {
    for (let b = Math.max(a + 30, best.b - 12); b <= Math.min(N - 2, best.b + 12); b += 2) {
      const r = pairSides(P, a, b, 90);
      if (!r) continue;
      const mean = r.widths.reduce((x, y) => x + y, 0) / r.widths.length;
      if (mean < refined.mean) { refined.mean = mean; refined.a = a; refined.b = b; }
    }
  }
  return refined;
}

const svgPath = process.argv[2];
if (!svgPath) { console.error("usage: node scripts/build-signature.mjs <svg>"); process.exit(1); }
const svg = readFileSync(svgPath, "utf8");
const ds = [...svg.matchAll(/\sd="([^"]+)"/g)].map((m) => m[1]);

const out = ds.map((d, idx) => {
  const { pts, cum } = flatten(parsePath(d));
  const total = cum[cum.length - 1];
  const P = Array.from({ length: SAMPLES }, (_, i) => at(pts, cum, (total * i) / (SAMPLES - 1)));
  const caps = findCaps(P);
  const { widths, center } = pairSides(P, caps.a, caps.b, OUT_POINTS);

  // Trim the ends before measuring width: pairing degrades at the caps and one
  // inflated sample there would fatten the mask enough to reveal nearby ink.
  const lo = Math.floor(widths.length * 0.05), hi = Math.ceil(widths.length * 0.95);
  const trimmed = widths.slice(lo, hi);
  const width = Math.max(...trimmed) * 1.2;

  let length = 0;
  for (let i = 1; i < center.length; i++) length += dist(center[i], center[i - 1]);

  const cd = center
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(" ");

  const med = [...trimmed].sort((x, y) => x - y)[trimmed.length >> 1];
  console.error(
    `stroke ${idx + 1}: caps=(${caps.a},${caps.b}) len=${length.toFixed(0)} ` +
    `median_w=${med.toFixed(1)} mask_w=${width.toFixed(1)}`,
  );
  return { d: cd, length: +length.toFixed(2), width: +width.toFixed(2) };
});

const file = `// GENERATED by scripts/build-signature.mjs — do not edit by hand.
// Centrelines recovered from the filled outline paths of the signature SVG.
export const CENTERLINES = ${JSON.stringify(out, null, 2)};
`;
writeFileSync("app/components/signature-data.js", file);
console.error("wrote app/components/signature-data.js");
