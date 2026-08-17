import { useCallback, useMemo, useState } from "react";
import { staticFile } from "remotion";
import type { EditionEntry, EditionType } from "../schema/edition";
import { SANS } from "../design/fonts";
import { settings } from "../settings";
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

const c = settings.colors;

export const formColors = {
  bg: "#FFFFFF",
  ink: c.brandBlack,
  muted: "#6B6B6B",
  line: "#E4E4E4",
  field: "#FAFAFA",
  danger: "#B42318",
  ok: "#0A7A3D",
};

const ui = formColors;

export const accentFor = (type: EditionType) =>
  type === "hyperlinks" ? c.code : c.sunDark;

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span
    style={{
      fontSize: 13,
      fontWeight: 600,
      letterSpacing: "0.04em",
      textTransform: "uppercase",
      color: ui.muted,
    }}
  >
    {children}
  </span>
);

const inputStyle: React.CSSProperties = {
  fontFamily: SANS,
  fontSize: 17,
  fontWeight: 500,
  color: ui.ink,
  padding: "12px 14px",
  borderRadius: 10,
  border: `1px solid ${ui.line}`,
  backgroundColor: ui.field,
  width: "100%",
  boxSizing: "border-box",
};

const Field: React.FC<{
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}> = ({ label, value, placeholder, onChange }) => (
  <label style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, minWidth: 0 }}>
    <Label>{label}</Label>
    <input
      style={inputStyle}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  </label>
);

const Chip: React.FC<{
  active: boolean;
  accent: string;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, accent, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      fontFamily: SANS,
      fontSize: 15,
      fontWeight: 600,
      padding: "9px 14px",
      borderRadius: 999,
      cursor: "pointer",
      color: active ? "#FFFFFF" : ui.ink,
      backgroundColor: active ? accent : "#F2F2F2",
      border: `1px solid ${active ? accent : ui.line}`,
    }}
  >
    {children}
  </button>
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
      style={{
        fontFamily: SANS,
        color: ui.ink,
        display: "flex",
        flexDirection: "column",
        gap: 26,
        height: "100%",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Label>Edição</Label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <Chip active={isNew} accent={accent} onClick={() => selectTarget(NEW)}>
            + Nova
          </Chip>
          {editions.map((entry) => (
            <Chip
              key={entry.dir}
              active={target === entry.dir}
              accent={accentFor(entry.edition.type)}
              onClick={() => selectTarget(entry.dir)}
            >
              {entry.edition.type === "hyperlinks" ? "HL" : "LO"} #
              {entry.edition.editionNumber}
            </Chip>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Label>Tipo</Label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {(["links-ondas", "hyperlinks"] as const).map((type) => (
            <Chip
              key={type}
              active={draft.type === type}
              accent={accentFor(type)}
              onClick={() => patch({ type })}
            >
              {type === "links-ondas" ? "Links + Ondas Amarelas" : "Hyperlinks"}
            </Chip>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div style={{ width: 130, flexShrink: 0 }}>
          <Field
            label="Número"
            value={draft.editionNumber}
            placeholder="42"
            onChange={(editionNumber) => patch({ editionNumber })}
          />
        </div>
        <Field
          label={isNew ? "Nome (monta a pasta)" : "Nome (pasta já criada)"}
          value={draft.name}
          placeholder="nome da edição"
          onChange={(name) => patch({ name })}
        />
        <div style={{ width: 170, flexShrink: 0 }}>
          <Field
            label="Lançamento"
            value={draft.airDate}
            placeholder="2026-08-15"
            onChange={(airDate) => patch({ airDate })}
          />
        </div>
      </div>

      {draft.type === "hyperlinks" ? (
        <Field
          label="Tema (aparece na abertura)"
          value={draft.theme}
          placeholder="tema aqui"
          onChange={(theme) => patch({ theme })}
        />
      ) : null}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Label>4 tabs</Label>
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
              <input
                style={{ ...inputStyle, flex: 1, minWidth: 0 }}
                value={tab.author}
                placeholder={`Nome do autor da tab ${index + 1}`}
                onChange={(e) => patchTab(index, { author: e.target.value })}
              />
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
          <button
            type="button"
            disabled={saving}
            onClick={save}
            style={{
              fontFamily: SANS,
              fontSize: 18,
              fontWeight: 700,
              padding: "14px 26px",
              borderRadius: 12,
              border: "none",
              color: "#FFFFFF",
              backgroundColor: saving ? "#C9C9C9" : accent,
              cursor: saving ? "default" : "pointer",
            }}
          >
            {saving ? "Gravando…" : isNew ? "Criar edição" : "Salvar alterações"}
          </button>
          <span style={{ fontSize: 14, color: ui.muted }}>
            {dir ? `content/${dir}` : "a pasta sai do número + nome"}
          </span>
        </div>
      </div>
    </div>
  );
};
