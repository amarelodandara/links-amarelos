import { useCallback, useMemo, useState } from "react";
import { staticFile } from "remotion";
import { Button } from "@base-ui/react/button";
import { Field } from "@base-ui/react/field";
import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup } from "@base-ui/react/toggle-group";
import { type EditionEntry, type EditionType, editionTypeSchema } from "../schema/edition";
import { SANS } from "../design/fonts";
import "../design/tokens.generated.css";
import "../design/controls.css";
import {
  type Draft,
  type EditionWriter,
  draftFromEntry,
  editionDir,
  emptyDraft,
  saveEdition,
  validateDraft,
} from "./edition-io";

/**
 * Form de criação e edição de edições. Hospedado em dois lugares — a composition
 * `Editor` do Studio e a coluna de input do app de 3 colunas — então não assume
 * nada sobre o shell: recebe o transporte de gravação e a lista de edições.
 */

const NEW = "__new__";

/**
 * Cores como custom property, não hex: o mesmo token vale no style inline e no
 * controls.css. Os `--ui-*` saem do controls.css; o resto, do settings.json via
 * tokens.generated.css.
 */
export const formColors = {
  bg: "var(--background)",
  ink: "var(--foreground)",
  muted: "var(--ui-muted)",
  line: "var(--ui-line)",
  field: "var(--ui-field)",
  danger: "var(--ui-danger)",
  ok: "var(--ui-ok)",
};

const ui = formColors;

/** Hyperlinks é azul, Links + Ondas é amarelo. */
export const accentFor = (type: EditionType) =>
  type === "hyperlinks" ? "var(--code)" : "var(--sun-dark)";

/** Título de um grupo de controles — não rotula um campo só. */
const GroupLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="ui-field-label">{children}</span>
);

/**
 * Campo de texto. O `Field.Root` do Base UI amarra label e controle pelo id
 * sozinho, então o clique no rótulo cai no input certo sem `htmlFor` na mão.
 */
const TextField: React.FC<{
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}> = ({ label, value, placeholder, onChange }) => (
  <Field.Root className="ui-field">
    <Field.Label className="ui-field-label">{label}</Field.Label>
    <Field.Control
      className="ui-input"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  </Field.Root>
);

/**
 * Chip do form. Cada um pode ter o próprio acento (amarelo/azul, por tipo de
 * edição), então a cor entra como custom property em vez de style direto — o
 * estado pressionado é do `data-pressed`, que o CSS lê.
 */
const Chip: React.FC<{
  value: string;
  accent: string;
  children: React.ReactNode;
}> = ({ value, accent, children }) => (
  <Toggle
    className="ui-chip"
    value={value}
    style={{ "--ui-accent": accent }}
  >
    {children}
  </Toggle>
);

export const EditionForm: React.FC<{
  editions: EditionEntry[];
  writer: EditionWriter;
  /** Chamado depois de gravar, com a pasta da edição. */
  onSaved?: (dir: string) => void;
  /** Chamado quando a seleção muda — `null` enquanto a edição nova não existe. */
  onTargetChange?: (dir: string | null) => void;
}> = ({ editions, writer, onSaved, onTargetChange }) => {
  const [target, setTarget] = useState<string>(NEW);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [status, setStatus] = useState<{ kind: "ok" | "error"; message: string } | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  // Um form em branco não deve abrir com uma parede de erros: a lista de
  // pendências só aparece depois da primeira tentativa de gravar.
  const [attempted, setAttempted] = useState(false);

  const isNew = target === NEW;
  const existingDirs = useMemo(() => editions.map((e) => e.dir), [editions]);

  const selectTarget = useCallback(
    (dir: string) => {
      setTarget(dir);
      setStatus(null);
      setAttempted(false);

      if (dir === NEW) {
        setDraft(emptyDraft());
        onTargetChange?.(null);
        return;
      }

      const entry = editions.find((e) => e.dir === dir);
      if (entry) setDraft(draftFromEntry(entry));
      onTargetChange?.(dir);
    },
    [editions, onTargetChange],
  );

  const patch = useCallback((partial: Partial<Draft>) => {
    setDraft((prev) => ({ ...prev, ...partial }));
    setStatus(null);
  }, []);

  const patchTab = useCallback((index: number, partial: Partial<Draft["tabs"][number]>) => {
    setDraft((prev) => ({
      ...prev,
      tabs: prev.tabs.map((tab, i) => (i === index ? { ...tab, ...partial } : tab)),
    }));
    setStatus(null);
  }, []);

  const problems = validateDraft(draft, { existingDirs, isNew });

  // Numa edição existente a pasta é fixa: trocar número ou nome ali mexe apenas
  // no conteúdo do edition.json, não renomeia a pasta.
  const hasSlugParts = Number(draft.editionNumber) > 0 && draft.name.trim() !== "";
  const dir = isNew
    ? hasSlugParts
      ? editionDir(draft.type, Number(draft.editionNumber), draft.name)
      : ""
    : target;

  const save = useCallback(async () => {
    setAttempted(true);
    if (problems.length > 0) {
      setStatus({
        kind: "error",
        message: `Faltam ${problems.length} campo(s) — veja abaixo.`,
      });
      return;
    }

    setSaving(true);
    try {
      const edition = await saveEdition({ dir, draft, writer });
      setDraft((prev) => ({
        ...prev,
        tabs: prev.tabs.map((tab, i) => ({
          author: tab.author,
          image: edition.tabs[i].image,
          file: null,
        })),
      }));
      if (isNew) {
        setTarget(dir);
        onTargetChange?.(dir);
      }
      setAttempted(false);
      setStatus({ kind: "ok", message: `Gravado em content/${dir}` });
      onSaved?.(dir);
    } catch (err) {
      setStatus({
        kind: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setSaving(false);
    }
  }, [dir, draft, isNew, onSaved, onTargetChange, problems.length, writer]);

  const accent = accentFor(draft.type);

  return (
    <div
      // O acento padrão é o amarelo; aqui ele segue o tipo da edição aberta.
      style={{
        "--ui-accent": accent,
        fontFamily: SANS,
        color: ui.ink,
        display: "flex",
        flexDirection: "column",
        gap: 26,
        height: "100%",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <GroupLabel>Edição</GroupLabel>
        {/* O ToggleGroup garante escolha única e navegação por setas; clicar no
            chip já ativo não desmarca porque a seleção nunca pode ficar vazia. */}
        <ToggleGroup
          className="ui-chip-group"
          aria-label="Edição"
          value={[target]}
          onValueChange={(next) => {
            if (next[0] != null) selectTarget(next[0]);
          }}
        >
          <Chip value={NEW} accent={accent}>
            + Nova
          </Chip>
          {editions.map((entry) => (
            <Chip
              key={entry.dir}
              value={entry.dir}
              accent={accentFor(entry.edition.type)}
            >
              {entry.edition.type === "hyperlinks" ? "HL" : "LO"} #
              {entry.edition.editionNumber}
            </Chip>
          ))}
        </ToggleGroup>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <GroupLabel>Tipo</GroupLabel>
        <ToggleGroup
          className="ui-chip-group"
          aria-label="Tipo"
          value={[draft.type]}
          onValueChange={(next) => {
            const type = editionTypeSchema.safeParse(next[0]);
            if (type.success) patch({ type: type.data });
          }}
        >
          {(["links-ondas", "hyperlinks"] as const).map((type) => (
            <Chip key={type} value={type} accent={accentFor(type)}>
              {type === "links-ondas" ? "Links + Ondas Amarelas" : "Hyperlinks"}
            </Chip>
          ))}
        </ToggleGroup>
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div style={{ width: 130, flexShrink: 0 }}>
          <TextField
            label="Número"
            value={draft.editionNumber}
            placeholder="42"
            onChange={(editionNumber) => patch({ editionNumber })}
          />
        </div>
        <TextField
          label={isNew ? "Nome (monta a pasta)" : "Nome (pasta já criada)"}
          value={draft.name}
          placeholder="nome da edição"
          onChange={(name) => patch({ name })}
        />
        <div style={{ width: 170, flexShrink: 0 }}>
          <TextField
            label="Lançamento"
            value={draft.airDate}
            placeholder="2026-08-15"
            onChange={(airDate) => patch({ airDate })}
          />
        </div>
      </div>

      {draft.type === "hyperlinks" ? (
        <TextField
          label="Tema (aparece na abertura)"
          value={draft.theme}
          placeholder="tema aqui"
          onChange={(theme) => patch({ theme })}
        />
      ) : null}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <GroupLabel>4 tabs</GroupLabel>
        {draft.tabs.map((tab, index) => {
          const preview = tab.file
            ? URL.createObjectURL(tab.file)
            : tab.image && !isNew
              ? staticFile(`${target}/${tab.image}`)
              : null;

          return (
            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: 12,
                borderRadius: 12,
                border: `1px solid ${ui.line}`,
              }}
            >
              <div
                style={{
                  width: 76,
                  height: 54,
                  flexShrink: 0,
                  borderRadius: 8,
                  border: `1px solid ${ui.line}`,
                  backgroundColor: ui.field,
                  backgroundImage: preview ? `url("${preview}")` : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  color: ui.muted,
                }}
              >
                {preview ? null : "sem imagem"}
              </div>
              <Field.Root style={{ flex: 1, minWidth: 0 }}>
                <Field.Control
                  className="ui-input"
                  aria-label={`Autor da tab ${index + 1}`}
                  value={tab.author}
                  placeholder={`Nome do autor da tab ${index + 1}`}
                  onChange={(e) => patchTab(index, { author: e.target.value })}
                />
              </Field.Root>
              <input
                type="file"
                accept="image/*"
                style={{ width: 190, flexShrink: 0, fontSize: 13, color: ui.muted }}
                onChange={(e) => patchTab(index, { file: e.target.files?.[0] ?? null })}
              />
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
        {attempted && problems.length > 0 ? (
          <div style={{ fontSize: 14, color: ui.danger, lineHeight: "22px" }}>
            {problems.map((problem) => (
              <div key={problem}>• {problem}</div>
            ))}
          </div>
        ) : null}

        {status ? (
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: status.kind === "ok" ? ui.ok : ui.danger,
            }}
          >
            {status.message}
          </div>
        ) : null}

        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <Button className="ui-action ui-action--lg" disabled={saving} onClick={save}>
            {saving ? "Gravando…" : isNew ? "Criar edição" : "Salvar alterações"}
          </Button>
          <span style={{ fontSize: 14, color: ui.muted }}>
            {dir ? `content/${dir}` : "a pasta sai do número + nome"}
          </span>
        </div>
      </div>
    </div>
  );
};
