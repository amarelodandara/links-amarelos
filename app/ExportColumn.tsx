import { useCallback, useEffect, useState } from "react";
import { SANS } from "../src/design/fonts";
import type { EditionEntry } from "../src/schema/edition";
import { PIECES, type PieceId } from "./pieces";
import { Empty, colors } from "./ui";

/**
 * Coluna 3: o export. Dispara o mesmo `remotion render` da linha de comando no
 * servidor local, então o arquivo que sai aqui é igual ao do `npm run render`.
 *
 * O padrão é o pacote completo; os checkboxes servem pra não esperar o render de
 * uma peça que você não vai usar naquela rodada.
 */

interface Step {
  piece: PieceId;
  label: string;
  status: "pending" | "running" | "done" | "error" | "skipped";
  progress: number;
  phase?: "rendering" | "encoding";
  error?: string;
}

interface Job {
  id: string;
  done: boolean;
  error: string | null;
  outputDir?: string;
  steps: Step[];
}

const statusLabel = (step: Step) => {
  if (step.status === "done") return "pronto";
  if (step.status === "error") return "erro";
  if (step.status === "skipped") return "não rodou";
  if (step.status === "pending") return "na fila";
  const percent = Math.round(step.progress * 100);
  return step.phase === "encoding" ? `codificando ${percent}%` : `renderizando ${percent}%`;
};

export const ExportColumn: React.FC<{ entry: EditionEntry | null }> = ({ entry }) => {
  const [selected, setSelected] = useState<PieceId[]>(PIECES.map((p) => p.id));
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);

  const running = job !== null && !job.done;

  // Enquanto o job roda, pergunta o progresso ao servidor. Meio segundo é
  // suficiente: as barras se movem em passos de frames, não continuamente.
  useEffect(() => {
    if (!running || !job) return;

    const timer = setInterval(async () => {
      const response = await fetch(`/api/render/${job.id}`);
      if (response.ok) setJob(await response.json());
    }, 500);

    return () => clearInterval(timer);
  }, [running, job?.id]);

  // Trocar de edição descarta o resultado da anterior, que não vale mais.
  useEffect(() => {
    setJob(null);
    setError(null);
  }, [entry?.dir]);

  const toggle = useCallback((piece: PieceId) => {
    setSelected((prev) =>
      prev.includes(piece) ? prev.filter((p) => p !== piece) : [...prev, piece],
    );
  }, []);

  const start = useCallback(async () => {
    if (!entry) return;
    setError(null);

    const response = await fetch("/api/render", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ dir: entry.dir, pieces: selected }),
    });

    const body = await response.json();
    if (!response.ok) {
      setError(body.error ?? "falha ao iniciar o render");
      return;
    }

    setJob({ id: body.id, done: false, error: null, steps: [] });
  }, [entry, selected]);

  if (!entry) {
    return <Empty>O export precisa de uma edição gravada.</Empty>;
  }

  return (
    <div style={{ fontFamily: SANS, display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {PIECES.map((piece) => (
          <label
            key={piece.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 15,
              color: colors.ink,
              cursor: running ? "default" : "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={selected.includes(piece.id)}
              disabled={running}
              onChange={() => toggle(piece.id)}
              style={{ width: 17, height: 17, accentColor: colors.accent }}
            />
            <span style={{ fontWeight: 600 }}>{piece.label}</span>
            <span style={{ fontSize: 13, color: colors.muted }}>{piece.format}</span>
          </label>
        ))}
      </div>

      <button
        type="button"
        disabled={running || selected.length === 0}
        onClick={start}
        style={{
          fontFamily: SANS,
          fontSize: 17,
          fontWeight: 700,
          padding: "14px 22px",
          borderRadius: 12,
          border: "none",
          color: "#FFFFFF",
          backgroundColor: running || selected.length === 0 ? "#C9C9C9" : colors.accent,
          cursor: running || selected.length === 0 ? "default" : "pointer",
        }}
      >
        {running
          ? "Renderizando…"
          : selected.length === PIECES.length
            ? "Exportar pacote completo"
            : `Exportar ${selected.length} peça(s)`}
      </button>

      {error ? (
        <div style={{ fontSize: 14, color: colors.danger }}>{error}</div>
      ) : null}

      {job && job.steps.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {job.steps.map((step) => (
            <div key={step.piece} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                <span style={{ fontWeight: 600, color: colors.ink }}>{step.label}</span>
                <span
                  style={{
                    color:
                      step.status === "error"
                        ? colors.danger
                        : step.status === "done"
                          ? colors.ok
                          : colors.muted,
                  }}
                >
                  {statusLabel(step)}
                </span>
              </div>
              <div
                style={{
                  height: 6,
                  borderRadius: 999,
                  backgroundColor: "#EDEDED",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${Math.round(step.progress * 100)}%`,
                    backgroundColor: step.status === "error" ? colors.danger : colors.accent,
                  }}
                />
              </div>
              {step.error ? (
                <span style={{ fontSize: 13, color: colors.danger }}>{step.error}</span>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {job?.done && !job.error ? (
        <div style={{ fontSize: 14, color: colors.ok, fontWeight: 600 }}>
          Pronto em {job.outputDir}/ — pode subir pro Drive.
        </div>
      ) : null}

      {job?.error ? (
        <div style={{ fontSize: 14, color: colors.danger }}>{job.error}</div>
      ) : null}
    </div>
  );
};
