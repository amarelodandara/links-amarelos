import { createContext } from "react";
import { useDialKit } from "dialkit";
import type { DialConfig } from "dialkit";
import { DEFAULT_GLITCH, GLITCH_TOKENS } from "./Glitch";
import type { GlitchConfig } from "./Glitch";
import type { Curve } from "./scene";

/**
 * Every visual choice of the main (hub) window as a DialKit control. Options
 * are Tailwind classes, and every color is a brand token. Each class is
 * written out in full below so Tailwind's scanner generates it. The panel only
 * shows in development.
 */

// Brand tokens, in palette order: sunray, sunshine, sun, source, terminal, paint, pencil, pen.
const BORDER = ["border-sunray", "border-sunshine", "border-sun", "border-source", "border-terminal", "border-paint", "border-pencil", "border-pen"];
const BG = ["bg-sunray", "bg-sunshine", "bg-sun", "bg-source", "bg-terminal", "bg-paint", "bg-pencil", "bg-pen"];
const INK = ["text-sunray", "text-sunshine", "text-sun", "text-source", "text-terminal", "text-paint", "text-pencil", "text-pen"];
const SHADOW_COLOR = ["shadow-sunray", "shadow-sunshine", "shadow-sun", "shadow-source", "shadow-terminal", "shadow-paint", "shadow-pencil", "shadow-pen"];
const MARKER = ["to-sunray", "to-sunshine", "to-sun", "to-source", "to-terminal", "to-paint", "to-pencil", "to-pen"];
const INK_HOVER = ["hover:text-sunray", "hover:text-sunshine", "hover:text-sun", "hover:text-source", "hover:text-terminal", "hover:text-paint", "hover:text-pencil", "hover:text-pen"];
const BG_HOVER = ["hover:bg-sunray", "hover:bg-sunshine", "hover:bg-sun", "hover:bg-source", "hover:bg-terminal", "hover:bg-paint", "hover:bg-pencil", "hover:bg-pen"];

/** Every background token at every opacity step, written out so Tailwind generates each. */
const BG_ALPHA = {
  "bg-sunray": { "/100": "bg-sunray/100", "/90": "bg-sunray/90", "/80": "bg-sunray/80", "/70": "bg-sunray/70", "/60": "bg-sunray/60", "/50": "bg-sunray/50", "/40": "bg-sunray/40", "/30": "bg-sunray/30", "/20": "bg-sunray/20", "/10": "bg-sunray/10", "/0": "bg-sunray/0" },
  "bg-sunshine": { "/100": "bg-sunshine/100", "/90": "bg-sunshine/90", "/80": "bg-sunshine/80", "/70": "bg-sunshine/70", "/60": "bg-sunshine/60", "/50": "bg-sunshine/50", "/40": "bg-sunshine/40", "/30": "bg-sunshine/30", "/20": "bg-sunshine/20", "/10": "bg-sunshine/10", "/0": "bg-sunshine/0" },
  "bg-sun": { "/100": "bg-sun/100", "/90": "bg-sun/90", "/80": "bg-sun/80", "/70": "bg-sun/70", "/60": "bg-sun/60", "/50": "bg-sun/50", "/40": "bg-sun/40", "/30": "bg-sun/30", "/20": "bg-sun/20", "/10": "bg-sun/10", "/0": "bg-sun/0" },
  "bg-source": { "/100": "bg-source/100", "/90": "bg-source/90", "/80": "bg-source/80", "/70": "bg-source/70", "/60": "bg-source/60", "/50": "bg-source/50", "/40": "bg-source/40", "/30": "bg-source/30", "/20": "bg-source/20", "/10": "bg-source/10", "/0": "bg-source/0" },
  "bg-terminal": { "/100": "bg-terminal/100", "/90": "bg-terminal/90", "/80": "bg-terminal/80", "/70": "bg-terminal/70", "/60": "bg-terminal/60", "/50": "bg-terminal/50", "/40": "bg-terminal/40", "/30": "bg-terminal/30", "/20": "bg-terminal/20", "/10": "bg-terminal/10", "/0": "bg-terminal/0" },
  "bg-paint": { "/100": "bg-paint/100", "/90": "bg-paint/90", "/80": "bg-paint/80", "/70": "bg-paint/70", "/60": "bg-paint/60", "/50": "bg-paint/50", "/40": "bg-paint/40", "/30": "bg-paint/30", "/20": "bg-paint/20", "/10": "bg-paint/10", "/0": "bg-paint/0" },
  "bg-pencil": { "/100": "bg-pencil/100", "/90": "bg-pencil/90", "/80": "bg-pencil/80", "/70": "bg-pencil/70", "/60": "bg-pencil/60", "/50": "bg-pencil/50", "/40": "bg-pencil/40", "/30": "bg-pencil/30", "/20": "bg-pencil/20", "/10": "bg-pencil/10", "/0": "bg-pencil/0" },
  "bg-pen": { "/100": "bg-pen/100", "/90": "bg-pen/90", "/80": "bg-pen/80", "/70": "bg-pen/70", "/60": "bg-pen/60", "/50": "bg-pen/50", "/40": "bg-pen/40", "/30": "bg-pen/30", "/20": "bg-pen/20", "/10": "bg-pen/10", "/0": "bg-pen/0" },
} as const;
const ALPHAS = ["/100", "/90", "/80", "/70", "/60", "/50", "/40", "/30", "/20", "/10", "/0"];

/** Navbar and footer rules: the borders and the dividers between cells, per token. */
const RULES = ["border-sunray divide-sunray", "border-sunshine divide-sunshine", "border-sun divide-sun", "border-source divide-source", "border-terminal divide-terminal", "border-paint divide-paint", "border-pencil divide-pencil", "border-pen divide-pen"];

const select = (options: string[], value: string) => ({ type: "select" as const, options, default: value });

const CONFIG = {
  frame: {
    width: select(["w-80", "w-96", "w-112", "w-120", "w-125", "w-128", "w-136", "w-144", "w-160", "w-180"], "w-180"),
    padding: select(["p-0", "p-2", "p-3", "p-4", "p-5", "p-6", "p-7", "p-8", "p-9", "p-10", "p-12", "p-14", "p-16"], "p-10"),
    gap: select(["gap-0", "gap-1", "gap-2", "gap-3", "gap-4", "gap-5", "gap-6", "gap-8", "gap-10", "gap-12"], "gap-3"),
    "border width": select(["border-0", "border", "border-[1.5px]", "border-2", "border-4", "border-8"], "border-2"),
    "border style": select(["border-solid", "border-dashed", "border-dotted", "border-double"], "border-solid"),
    radius: select(["rounded-none", "rounded-xs", "rounded-sm", "rounded-md", "rounded-lg", "rounded-xl", "rounded-2xl", "rounded-3xl"], "rounded-xs"),
    border: select(BORDER, "border-pen"),
    background: select(BG, "bg-sunray"),
    "background opacity": select(ALPHAS, "/100"),
    "backdrop blur": select(["backdrop-blur-none", "backdrop-blur-xs", "backdrop-blur-sm", "backdrop-blur-md", "backdrop-blur-lg", "backdrop-blur-xl", "backdrop-blur-2xl"], "backdrop-blur-none"),
    ink: select(INK, "text-pen"),
  },
  shadow: {
    _collapsed: true,
    size: select(["shadow-none", "shadow-2xs", "shadow-xs", "shadow-sm", "shadow-md", "shadow-lg", "shadow-xl", "shadow-2xl"], "shadow-none"),
    color: select(SHADOW_COLOR, "shadow-pen"),
  },
  text: {
    font: select(
      [
        "font-sans",
        "font-serif",
        "font-mono",
        "font-geist-pixel-square",
        "font-geist-pixel-grid",
        "font-geist-pixel-circle",
        "font-geist-pixel-triangle",
        "font-geist-pixel-line",
        "font-inter",
        "font-unbounded",
      ],
      "font-mono",
    ),
    size: select(["text-xs", "text-sm", "text-base", "text-lg", "text-xl", "text-2xl", "text-3xl", "text-4xl", "text-5xl"], "text-2xl"),
    "line height": select(["leading-none", "leading-tight", "leading-snug", "leading-normal", "leading-relaxed", "leading-loose"], "leading-normal"),
    weight: select(
      ["font-thin", "font-extralight", "font-light", "font-normal", "font-medium", "font-semibold", "font-bold", "font-extrabold", "font-black"],
      "font-normal",
    ),
    tracking: select(["tracking-tighter", "tracking-tight", "tracking-normal", "tracking-wide", "tracking-wider", "tracking-widest"], "tracking-normal"),
    align: select(["text-left", "text-center", "text-right", "text-justify"], "text-left"),
    wrap: select(["text-wrap", "text-pretty", "text-balance"], "text-wrap"),
    case: select(["normal-case", "lowercase", "uppercase"], "normal-case"),
    style: select(["not-italic", "italic"], "not-italic"),
    "max width": select(["max-w-none", "max-w-prose", "max-w-xs", "max-w-sm", "max-w-md", "max-w-lg"], "max-w-none"),
  },
  typing: {
    "ms per char": [80, 0, 150, 1],
    "start delay": [400, 0, 4000, 50],
    caret: true,
    "caret char": { type: "text", default: "▍" },
    "caret animation": select(["animate-blink", "animate-pulse", "animate-none"], "animate-blink"),
    "caret color": select(INK, "text-sunshine"),
    replay: { type: "action" },
  },
  highlight: {
    _collapsed: true,
    direction: select(["bg-linear-to-b", "bg-linear-175", "bg-linear-170", "bg-linear-165", "bg-linear-185", "bg-linear-190"], "bg-linear-to-b"),
    height: select(["from-60% to-60%", "from-50% to-50%", "from-40% to-40%", "from-30% to-30%", "from-20% to-20%", "from-0% to-0%"], "from-30% to-30%"),
    padding: select(["px-0", "px-0.5", "px-1", "px-1.5", "px-2"], "px-0.5"),
    color: select(MARKER, "to-sunshine"),
    "hover ink": select(INK_HOVER, "hover:text-pen"),
  },
  glitch: {
    _collapsed: true,
    pixel: [DEFAULT_GLITCH.pixel, 1, 12, 1],
    fps: [DEFAULT_GLITCH.fps, 1, 60, 1],
    density: [DEFAULT_GLITCH.density, 0.05, 1, 0.05],
    pen: true,
    paint: true,
    sun: true,
    sunshine: true,
    sunray: true,
    source: true,
    terminal: true,
  },
  author: {
    _collapsed: true,
    "box border": select(["border", "border-[1.5px]", "border-2", "border-4"], "border-2"),
    "box color": select(BORDER, "border-pen"),
    "box padding": select(["px-0", "px-0.5", "px-1", "px-1.5", "px-2", "px-3"], "px-1"),
    "box background": select(["bg-transparent", ...BG], "bg-transparent"),
    "plus background": select(BG, "bg-pen"),
    "plus ink": select(INK, "text-sunray"),
    "plus hover background": select(BG_HOVER, "hover:bg-source"),
    "plus hover ink": select(INK_HOVER, "hover:text-sunray"),
  },
} satisfies DialConfig;

export type HubLook = {
  /** Classes for the hub window's article. */
  frame: string;
  /** Classes for its content column (padding and gap). */
  body: string;
  /** Classes for the intro paragraph. */
  text: string;
  /** Classes for a recommendation word, the author link and the caret. */
  marks: Marks;
  typing: { charMs: number; startMs: number; caret: boolean; caretChar: string };
  /** Bumped by the replay action: re-keys the intro so it types again. */
  replay: number;
};

/** The frame every other window wears: the scene's, the floating ones, the hover ones. */
export const FRAME = "border-[1.5px] border-(--rede-window-ink) bg-(--rede-window) text-(--rede-window-ink)";

export type Marks = {
  highlight: string;
  glitch: GlitchConfig;
  /**
   * The box around the author's name: its border (shared with the + square),
   * then the name's own padding and fill. `authorPlus` colors the + that opens
   * the about window.
   */
  authorBox: string;
  authorPad: string;
  authorFill: string;
  authorPlus: string;
  caret: string;
};

export const HubLookContext = createContext<HubLook | null>(null);

/** The background class for a token class and an opacity step; unknown pairs fall back to opaque sunray. */
function backgroundAt(bg: string, alpha: string): string {
  const row = Object.entries(BG_ALPHA).find(([k]) => k === bg)?.[1];
  const cell = row ? Object.entries(row).find(([k]) => k === alpha)?.[1] : undefined;
  return cell ?? "bg-sunray";
}

const cx = (...parts: string[]): string => parts.filter((p) => p.length > 0).join(" ");

/** The marks at their defaults, for windows the panel doesn't drive. */
export const DEFAULT_MARKS: Marks = {
  highlight: "box-decoration-clone bg-linear-to-b from-transparent from-30% to-30% to-(--rede-highlight) px-0.5 hover:text-pen",
  glitch: DEFAULT_GLITCH,
  authorBox: "border-2 border-(--rede-window-ink)",
  authorPad: "px-1",
  authorFill: "bg-transparent",
  authorPlus: "bg-(--rede-window-ink) text-(--rede-window) hover:bg-(--rede-accent)",
  caret: "animate-blink motion-reduce:animate-none",
};

export function useHubDials(onReplay: () => void, replay: number): HubLook {
  const v = useDialKit("main window", CONFIG, {
    persist: { key: "dialkit:rede-hub-v6" },
    onAction: (action) => {
      if (action.endsWith("replay")) onReplay();
    },
  });
  const f = v.frame;
  const t = v.text;
  const h = v.highlight;
  const a = v.author;
  const g = v.glitch;

  return {
    frame: cx(
      f.width,
      f["border width"],
      f["border style"],
      f.radius,
      v.shadow.size,
      v.shadow.color,
      f.border,
      backgroundAt(f.background, f["background opacity"]),
      f["backdrop blur"],
      f.ink,
    ),
    body: cx(f.padding, f.gap),
    text: cx(t.font, t.size, t["line height"], t.weight, t.tracking, t.align, t.wrap, t.case, t.style, t["max width"]),
    marks: {
      highlight: cx("box-decoration-clone from-transparent", h.direction, h.height, h.padding, h.color, h["hover ink"]),
      glitch: {
        pixel: g.pixel,
        fps: g.fps,
        density: g.density,
        tokens: GLITCH_TOKENS.filter((t) => g[t]),
      },
      authorBox: cx(a["box border"], a["box color"]),
      authorPad: a["box padding"],
      authorFill: a["box background"],
      authorPlus: cx(a["plus background"], a["plus ink"], a["plus hover background"], a["plus hover ink"]),
      caret: cx(v.typing["caret animation"], "motion-reduce:animate-none", v.typing["caret color"]),
    },
    typing: {
      charMs: v.typing["ms per char"],
      startMs: v.typing["start delay"],
      caret: v.typing.caret,
      caretChar: v.typing["caret char"],
    },
    replay,
  };
}

/* ── Scene: the curvature everything sits on ──────────────────────────── */

const SCENE = {
  curvature: [1, -1, 1, 0.05],
  radius: [900, 300, 5000, 50],
  "bend windows": true,
  "bend background": true,
  /** How far the camera steps back once the intro is done, in px of depth. */
  "intro zoom out": [200, 0, 1200, 10],
  "zoom ms": [1400, 0, 5000, 50],
} satisfies DialConfig;

export type SceneLook = { windows: Curve; field: Curve; zoomOut: number; zoomMs: number };

export function useSceneDials(): SceneLook {
  const v = useDialKit("scene", SCENE, { persist: { key: "dialkit:rede-scene-v2" } });
  const c: Curve = { amount: v.curvature, radius: v.radius };
  const flat: Curve = { amount: 0, radius: v.radius };
  return {
    windows: v["bend windows"] ? c : flat,
    field: v["bend background"] ? c : flat,
    zoomOut: v["intro zoom out"],
    zoomMs: v["zoom ms"],
  };
}

/* ── Navbar and footer ────────────────────────────────────────────────── */

const BARS = {
  background: select(BG, "bg-sunshine"),
  ink: select(INK, "text-pen"),
  rules: select(RULES, "border-sun divide-sun"),
  "hover background": select(BG_HOVER, "hover:bg-sun"),
  "hover ink": select(INK_HOVER, "hover:text-pen"),
  "support background": select(BG, "bg-sun"),
  "support ink": select(INK, "text-pen"),
} satisfies DialConfig;

export type HudLook = {
  /** The bar itself: background, ink, rules. */
  bar: string;
  /** Just the rules, for cell groups nested in a bar. */
  rules: string;
  /** A link cell's hover. */
  hover: string;
  /** The "Apoie" cell. */
  support: string;
};

export function useHudDials(): HudLook {
  const v = useDialKit("navbar & footer", BARS, { persist: { key: "dialkit:rede-hud" } });
  return {
    bar: cx(v.background, v.ink, v.rules),
    rules: v.rules,
    hover: cx(v["hover background"], v["hover ink"]),
    support: cx(v["support background"], v["support ink"]),
  };
}
