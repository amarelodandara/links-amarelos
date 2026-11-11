import { LINE_IDS, linePoints, worldBounds } from "./graph";
import type { LineId } from "./graph";

const STROKE = {
  paginas: "var(--rede-line-paginas)",
  edicoes: "var(--rede-line-edicoes)",
  redes: "var(--rede-line-redes)",
} as const satisfies Record<LineId, string>;

/** Line width in world px, Mini Metro thick. */
const WIDTH = 16;

/** The metro lines, on the network's plane (z 0). Decorative: the stations carry the meaning. */
export default function Lines() {
  const b = worldBounds(WIDTH);
  return (
    <svg
      aria-hidden="true"
      width={b.maxX - b.minX}
      height={b.maxY - b.minY}
      viewBox={`${b.minX} ${b.minY} ${b.maxX - b.minX} ${b.maxY - b.minY}`}
      style={{ position: "absolute", left: b.minX, top: b.minY, overflow: "visible" }}
    >
      {LINE_IDS.map((line) => (
        <polyline
          key={line}
          points={linePoints(line)
            .map((p) => `${p.x},${p.y}`)
            .join(" ")}
          fill="none"
          stroke={STROKE[line]}
          strokeWidth={WIDTH}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}
