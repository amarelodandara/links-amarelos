import { SANS } from "../src/design/fonts";
import { settings } from "../src/settings";

/** Átomos de UI do app. Tom neutro de ferramenta; o amarelo é o acento. */

export const colors = {
  surface: "#FFFFFF",
  ground: "#F4F4F4",
  ink: settings.colors.brandBlack,
  muted: "#6B6B6B",
  line: "#E4E4E4",
  accent: settings.colors.sunDark,
  danger: "#B42318",
  ok: "#0A7A3D",
};

export const Chip: React.FC<{
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, disabled, onClick, children }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    style={{
      fontFamily: SANS,
      fontSize: 14,
      fontWeight: 600,
      padding: "8px 13px",
      borderRadius: 999,
      cursor: disabled ? "default" : "pointer",
      color: active ? "#FFFFFF" : disabled ? "#AAAAAA" : colors.ink,
      backgroundColor: active ? colors.accent : "#F2F2F2",
      border: `1px solid ${active ? colors.accent : colors.line}`,
    }}
  >
    {children}
  </button>
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
          color: "#FFFFFF",
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
