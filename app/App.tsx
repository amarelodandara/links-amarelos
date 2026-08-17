import { useCallback, useEffect, useState } from "react";
import { SANS } from "../src/design/fonts";
import type { EditionEntry } from "../src/schema/edition";
import { EditionForm } from "../src/editor/EditionForm";
import { ExportColumn } from "./ExportColumn";
import { PreviewColumn } from "./PreviewColumn";
import { httpWriter } from "./http-writer";
import { Column, colors } from "./ui";

/**
 * O fluxo em três passos, um por coluna: input → preview → export.
 *
 * O Remotion Studio continua existindo (`npm run studio`) pra debugar composition
 * com timeline e scrubbing; aqui a timeline não aparece de propósito.
 */
export const App: React.FC = () => {
  const [editions, setEditions] = useState<EditionEntry[]>([]);
  const [problems, setProblems] = useState<string[]>([]);
  const [selectedDir, setSelectedDir] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Cada gravação incrementa isto, pra o preview recarregar os assets novos.
  const [revision, setRevision] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/state");
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "falha ao carregar");
      setEditions(body.editions);
      setProblems(body.errors ?? []);
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onSaved = useCallback(
    async (dir: string) => {
      await refresh();
      setSelectedDir(dir);
      setRevision((r) => r + 1);
    },
    [refresh],
  );

  const entry = editions.find((e) => e.dir === selectedDir) ?? null;

  return (
    <div
      style={{
        fontFamily: SANS,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: colors.ground,
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 14,
          padding: "18px 24px 14px",
          flexShrink: 0,
        }}
      >
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: colors.ink,
            margin: 0,
          }}
        >
          Estúdio de Teasers
        </h1>
        <span style={{ fontSize: 14, color: colors.muted }}>
          {entry
            ? `editando content/${entry.dir}`
            : "nenhuma edição selecionada"}
        </span>
        {loadError ? (
          <span style={{ fontSize: 14, color: colors.danger }}>
            servidor local fora do ar: {loadError}
          </span>
        ) : null}
        {problems.length > 0 ? (
          <span style={{ fontSize: 14, color: colors.danger }}>
            {problems.length} pendência(s) em /content
          </span>
        ) : null}
      </header>

      <main
        style={{
          flex: 1,
          minHeight: 0,
          display: "grid",
          // O input é o mais largo (é onde se digita), o preview vem depois, e o
          // export é uma lista curta de checkboxes e barras.
          gridTemplateColumns: "minmax(0, 1.25fr) minmax(0, 1fr) minmax(0, 0.75fr)",
          gap: 16,
          padding: "0 24px 24px",
        }}
      >
        <Column step={1} title="Input" hint="grava em /content">
          <EditionForm
            editions={editions}
            writer={httpWriter}
            onSaved={onSaved}
            onTargetChange={setSelectedDir}
          />
        </Column>

        <Column step={2} title="Preview" hint="o mesmo componente do render">
          <PreviewColumn entry={entry} revision={revision} />
        </Column>

        <Column step={3} title="Export" hint="sai em /outputs">
          <ExportColumn entry={entry} />
        </Column>
      </main>
    </div>
  );
};
