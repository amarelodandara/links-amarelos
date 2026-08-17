import { useCallback, useEffect, useState } from "react";
import { Button } from "@base-ui/react/button";
import { Checkbox } from "@base-ui/react/checkbox";
import { CheckboxGroup } from "@base-ui/react/checkbox-group";
import { Progress } from "@base-ui/react/progress";
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

/**
 * O grupo de checkbox devolve os `name` dos itens marcados como `string[]`; só
 * os ids das peças interessam, e é aqui que eles voltam a ser `PieceId`.
 */
const isPieceId = (value: string): value is PieceId =>
  PIECES.some((piece) => piece.id === value);

/** O tique do checkbox. O Base UI só monta o indicador quando está marcado. */
const CheckMark: React.FC = () => (
  <svg viewBox="0 0 12 12" width="11" height="11" fill="none" aria-hidden>
    <path
      d="M1.5 6.2 4.4 9 10.5 2.8"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

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
      <CheckboxGroup
        aria-label="Peças do pacote"
        disabled={running}
        value={selected}
        onValueChange={(value) => setSelected(value.filter(isPieceId))}
        style={{ display: "flex", flexDirection: "column", gap: 10 }}
      >
        {PIECES.map((piece) => (
          <label key={piece.id} className="ui-check-row">
            {/* O `name` é o que entra no array de valor do grupo. */}
            <Checkbox.Root className="ui-checkbox" name={piece.id}>
              <Checkbox.Indicator className="ui-checkbox-indicator">
                <CheckMark />
              </Checkbox.Indicator>
            </Checkbox.Root>
            <span style={{ fontWeight: 600 }}>{piece.label}</span>
            <span style={{ fontSize: 13, color: colors.muted }}>{piece.format}</span>
          </label>
        ))}
      </CheckboxGroup>

      <Button
        className="ui-action"
        disabled={running || selected.length === 0}
        onClick={start}
      >
        {running
          ? "Renderizando…"
          : selected.length === PIECES.length
            ? "Exportar pacote completo"
            : `Exportar ${selected.length} peça(s)`}
      </Button>

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
              {/* O Progress do Base UI escreve a largura do indicador e o
                  aria-valuenow a partir de `value` — a barra vira informação
                  pro leitor de tela, não só pixel. */}
              <Progress.Root
                className={step.status === "error" ? "ui-progress--error" : undefined}
                value={Math.round(step.progress * 100)}
                aria-label={step.label}
                getAriaValueText={() => statusLabel(step)}
              >
                <Progress.Track className="ui-progress-track">
                  <Progress.Indicator className="ui-progress-indicator" />
                </Progress.Track>
              </Progress.Root>
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
