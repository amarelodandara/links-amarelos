/**
 * The Links Amarelos palette. Single source for the website (as CSS custom
 * properties, via tokens.css) and crayola (read directly in TS).
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

/** Every token name, in palette order: for pickers that must list them all. */
export const COLOR_NAMES = [
  "brandBlack",
  "brandWhite",
  "brandWhiteCode",
  "sunLighter",
  "sunLight",
  "sun",
  "sunDark",
  "codeLighter",
  "codeLight",
  "code",
  "codeDark",
  "substack",
  "spotify",
  "youtube",
] as const satisfies readonly ColorName[];
