import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup } from "@base-ui/react/toggle-group";
import { SANS } from "../src/design/fonts";
import "../src/design/tokens.generated.css";
import "../src/design/controls.css";

/**
 * Átomos de UI do app. Tom neutro de ferramenta; o amarelo é o acento.
 *
 * As cores são as custom properties, não hex: o mesmo token vale no style
 * inline daqui e nas regras do controls.css, então os dois nunca divergem.
 */
export const colors = {
  surface: "var(--background)",
  ground: "var(--ui-ground)",
  ink: "var(--foreground)",
  muted: "var(--ui-muted)",
  line: "var(--ui-line)",
  accent: "var(--sun-dark)",
  danger: "var(--ui-danger)",
  ok: "var(--ui-ok)",
};

/**
 * Grupo de chips de escolha única. O Base UI cuida da interação: só um fica
 * pressionado, e as setas do teclado andam entre eles com foco roving.
 *
 * `value`/`onChange` são de um item só — o `multiple` fica desligado, então o
 * array do ToggleGroup tem no máximo um elemento. Voltar a clicar no chip ativo
 * o despressiona; aqui isso é ignorado, porque a coluna precisa de uma seleção.
 */
export const ChipGroup = <Value extends string>({
  value,
  onChange,
  ariaLabel,
  children,
}: {
  value: Value;
  onChange: (value: Value) => void;
  ariaLabel: string;
  children: React.ReactNode;
}) => (
  <ToggleGroup
    className="ui-chip-group"
    aria-label={ariaLabel}
    value={[value]}
    onValueChange={(next) => {
      if (next[0] != null) onChange(next[0]);
    }}
  >
    {children}
  </ToggleGroup>
);

export const Chip: React.FC<{
  value: string;
  disabled?: boolean;
  children: React.ReactNode;
}> = ({ value, disabled, children }) => (
  <Toggle className="ui-chip ui-chip--sm" value={value} disabled={disabled}>
    {children}
  </Toggle>
);

export const Column: React.FC<{
  step: number;
  title: string;
  hint?: string;
  children: React.ReactNode;
}> = ({ step, title, hint, children }) => (
  <section
    style={{
      display: "flex",
      flexDirection: "column",
      minWidth: 0,
      minHeight: 0,
      backgroundColor: colors.surface,
      borderRadius: 16,
      border: `1px solid ${colors.line}`,
      overflow: "hidden",
    }}
  >
    <header
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: 10,
        padding: "18px 22px",
        borderBottom: `1px solid ${colors.line}`,
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontFamily: SANS,
          fontSize: 13,
          fontWeight: 700,
          color: colors.surface,
          backgroundColor: colors.ink,
          borderRadius: 999,
          width: 22,
          height: 22,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {step}
      </span>
      <h2
        style={{
          fontFamily: SANS,
          fontSize: 19,
          fontWeight: 700,
          letterSpacing: "-0.01em",
          color: colors.ink,
          margin: 0,
        }}
      >
        {title}
      </h2>
      {hint ? (
        <span style={{ fontFamily: SANS, fontSize: 13, color: colors.muted }}>{hint}</span>
      ) : null}
    </header>
    <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: 22 }}>{children}</div>
  </section>
);

export const Empty: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      fontFamily: SANS,
      fontSize: 15,
      color: colors.muted,
      lineHeight: "24px",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      padding: 24,
    }}
  >
    {children}
  </div>
);
