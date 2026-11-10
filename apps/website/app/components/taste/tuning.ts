// What the dev tuning panel drives — the sim's field tuning and the scene's
// view — and where it keeps them between reloads. Kept apart from
// TuningPanel.tsx so TasteSection can read the tuning without pulling the
// panel into its bundle.
import type { FieldTuning } from "./field";
import { FIELD_DEFAULTS } from "./field";
import type { ViewTuning } from "./scene";
import { VIEW_DEFAULTS } from "./scene";

export type Tuning = { field: FieldTuning; view: ViewTuning };

export const TUNING_DEFAULTS = {
  field: FIELD_DEFAULTS,
  view: VIEW_DEFAULTS,
} satisfies Tuning;

const STORAGE_KEY = "taste:tuning";

function isFieldKey(key: string): key is keyof FieldTuning {
  return Object.hasOwn(FIELD_DEFAULTS, key);
}
function isViewKey(key: string): key is keyof ViewTuning {
  return Object.hasOwn(VIEW_DEFAULTS, key);
}

// Persisted as "field.key=value;view.key=value;…" so reloads and HMR keep the
// tuning without decoding untyped JSON. A bare "key=value" is a field key,
// from before the view was tunable. Unknown keys and non-numbers are dropped.
export function readTuning(): Tuning {
  const field = { ...FIELD_DEFAULTS };
  const view = { ...VIEW_DEFAULTS };
  try {
    for (const pair of (localStorage.getItem(STORAGE_KEY) ?? "").split(";")) {
      const [path = "", raw = ""] = pair.split("=");
      const value = Number(raw);
      if (raw === "" || !Number.isFinite(value)) continue;
      const [scope, key = scope] = path.includes(".")
        ? path.split(".")
        : ["field", path];
      if (scope === "field" && isFieldKey(key)) field[key] = value;
      if (scope === "view" && isViewKey(key)) view[key] = value;
    }
  } catch {
    // No storage: start from the defaults.
  }
  return { field, view };
}

export function writeTuning(tune: Tuning): void {
  try {
    const pairs = [
      ...Object.entries(tune.field).map(
        ([key, value]) => `field.${key}=${value}`,
      ),
      ...Object.entries(tune.view).map(
        ([key, value]) => `view.${key}=${value}`,
      ),
    ];
    localStorage.setItem(STORAGE_KEY, pairs.join(";"));
  } catch {
    // Losing the tuning on reload is fine.
  }
}
