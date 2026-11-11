import { createContext } from "react";
import type { RefObject } from "react";

/** Windows that spawn on top of the scene: they belong to no layer. */
export type Extra = "newsletter" | "podcast";

export type RedeApi = {
  /** Opens an extra window; opening one already open does nothing. */
  spawn: (id: Extra) => void;
  /** Scene windows shown although their layer is hidden, by node id. */
  revealed: ReadonlySet<string>;
  /** Shows a scene window outside the visible layers, or hides it again. */
  toggleReveal: (id: string) => void;
  /** The intro's last window is typed: the scene zooms out to make room. */
  finishIntro: () => void;
  /** Where hover windows portal to: inside `.rede`, so they keep its color roles. */
  portal: RefObject<HTMLDivElement | null>;
};

export const RedeContext = createContext<RedeApi>({
  spawn: () => {},
  revealed: new Set(),
  toggleReveal: () => {},
  finishIntro: () => {},
  portal: { current: null },
});
