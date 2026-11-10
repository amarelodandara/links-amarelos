/**
 * The Links Amarelos palette. Single source for the site (as CSS custom
 * properties, via tokens.css) and the studio (read directly in TS).
 *
 * Keys are camelCase; scripts/gen-tokens.ts turns `sunDark` into `--sun-dark`.
 */
export const colors = {
  brandBlack: "#110a03",
  brandWhite: "#fffbeb",
  brandWhiteCode: "#f7faff",
  sunLighter: "#fef3c7",
  sunLight: "#fde68a",
  sun: "#ffcc00",
  sunDark: "#f59e0b",
  codeLighter: "#eff6ff",
  codeLight: "#dbeafe",
  code: "#3b82f6",
  codeDark: "#1e40af",
  substack: "#ff681a",
  spotify: "#1ed760",
  youtube: "#ff0000",
} as const;

export type ColorName = keyof typeof colors;
