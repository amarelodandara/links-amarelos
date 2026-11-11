import { PAGES } from "../../lib/pages";
import type { SitePage } from "../../lib/pages";

/**
 * The home network: every station, where it sits in the world, and the
 * metro lines that join them. World units are CSS pixels at zoom 1, with the
 * hub at (0, 0). Lines only run horizontal, vertical or at 45°.
 *
 * All copy here comes from the site as it was: page taglines (NavDrawer),
 * edition titles and blurbs (the old home), platform names and labels
 * (ExternalLinkPill).
 */

export type Point = { x: number; y: number };

export type LineId = "paginas" | "edicoes" | "redes";

/** A run of text in a blurb; `redacted` renders in the Redacted face, as on the old home. */
export type Run = { text: string; redacted?: boolean };

export type Platform = "substack" | "spotify";

export type Cta = { platform: Platform; href: string };

type Base = { id: string; at: Point; line: LineId | null };

export type HubNode = Base & {
  kind: "hub";
  label: string;
  blurb: string;
};

export type PageNode = Base & {
  kind: "page";
  page: SitePage;
};

export type EditionNode = Base & {
  kind: "edition";
  /** One or two series names, e.g. "links amarelos #8" and "ondas amarelas #8". */
  names: readonly [string, ...string[]];
  blurb: readonly Run[];
  /** Cover images under /public. */
  covers: readonly [string, ...string[]];
  ctas: readonly Cta[];
  /** Not out yet. */
  upcoming: boolean;
};

export type SocialNode = Base & {
  kind: "social";
  platform: Platform;
  href: string;
};

export type RedeNode = HubNode | PageNode | EditionNode | SocialNode;

const SUBSTACK = "https://amarelodandara.substack.com";
const SPOTIFY_SHOW = "https://open.spotify.com/show/043Gs7eyY2KOlotEWSTSxB?si=e7abf2b9730747d7";

/** Grid step: stations sit on multiples of this. */
export const G = 120;

const at = (gx: number, gy: number): Point => ({ x: gx * G, y: gy * G });

/** Where each page station sits, keyed by route. */
const PAGE_AT = {
  "/sobre": at(0, -2),
  "/manifesto": at(2, -4),
  "/realizacoes": at(5, -4),
  "/apoio": at(7, -2),
} as const satisfies Record<string, Point>;

const pageAt = (href: string): Point => {
  for (const [route, point] of Object.entries(PAGE_AT)) {
    if (route === href) return point;
  }
  return at(0, -2);
};

export const NODES: readonly RedeNode[] = [
  {
    id: "hub",
    kind: "hub",
    at: at(0, 0),
    line: null,
    label: "links amarelos",
    blurb: "Curadoria mensal de links que valem seu tempo.",
  },
  ...PAGES.map(
    (page): PageNode => ({
      id: `page${page.href.replace("/", "-")}`,
      kind: "page",
      at: pageAt(page.href),
      line: "paginas",
      page,
    }),
  ),
  {
    id: "links-amarelos-3",
    kind: "edition",
    at: at(-2, 0),
    line: "edicoes",
    names: ["links amarelos #3"],
    blurb: [{ text: "maestros, saltos e seriedade" }],
    covers: ["/brand/links-amarelos-3.png"],
    ctas: [{ platform: "substack", href: `${SUBSTACK}/links-amarelos-3` }],
    upcoming: false,
  },
  {
    id: "ondas-amarelas-6",
    kind: "edition",
    at: at(-5, 3),
    line: "edicoes",
    names: ["ondas amarelas #6"],
    blurb: [{ text: "autorrealização, autocriação" }],
    covers: ["/brand/ondas-amarelas-6.png"],
    ctas: [{ platform: "spotify", href: "https://open.spotify.com/episode/56YFLEYZebBCBU9DEOCZlL?si=ceb9096ddfc347c3" }],
    upcoming: false,
  },
  {
    id: "edicao-8",
    kind: "edition",
    at: at(-5, 6),
    line: "edicoes",
    names: ["links amarelos #8", "ondas amarelas #8"],
    blurb: [{ text: "uma semana de pensamento com o Espírito Santo, amém" }],
    covers: ["/brand/links-amarelos-8.png", "/brand/ondas-amarelas-8.png"],
    ctas: [
      { platform: "substack", href: SUBSTACK },
      { platform: "spotify", href: SPOTIFY_SHOW },
    ],
    upcoming: false,
  },
  {
    id: "edicao-9",
    kind: "edition",
    at: at(-2, 9),
    line: "edicoes",
    names: ["links amarelos #9", "ondas amarelas #9"],
    blurb: [],
    covers: ["/brand/coming-newsletter.png", "/brand/coming-podcast.png"],
    ctas: [],
    upcoming: true,
  },
  {
    id: "hyperlinks-1",
    kind: "edition",
    at: at(2, 9),
    line: "edicoes",
    names: ["hyperlinks #1"],
    blurb: [
      { text: "o primeiro episódio dos hyperlinks " },
      { text: "amarelos", redacted: true },
      { text: ", grátis pra todos, sobre a coisa mais " },
      { text: "amarela", redacted: true },
      { text: " que já " },
      { text: "entrou em campo.", redacted: true },
    ],
    covers: ["/brand/coming-newsletter.png"],
    ctas: [],
    upcoming: true,
  },
  {
    id: "social-substack",
    kind: "social",
    at: at(2, 2),
    line: "redes",
    platform: "substack",
    href: SUBSTACK,
  },
  {
    id: "social-spotify",
    kind: "social",
    at: at(5, 2),
    line: "redes",
    platform: "spotify",
    href: SPOTIFY_SHOW,
  },
];

/** Each line's stops in order, starting at the hub. Consecutive stops are joined with 45° routing. */
export const LINES = {
  paginas: ["hub", "page-sobre", "page-manifesto", "page-realizacoes", "page-apoio"],
  edicoes: ["hub", "links-amarelos-3", "ondas-amarelas-6", "edicao-8", "edicao-9", "hyperlinks-1"],
  redes: ["hub", "social-substack", "social-spotify"],
} as const satisfies Record<LineId, readonly string[]>;

export const LINE_IDS: readonly LineId[] = ["paginas", "edicoes", "redes"];

export const PLATFORM_NAME = {
  substack: { name: "Substack", label: "Leia" },
  spotify: { name: "Spotify", label: "Ouça" },
} as const satisfies Record<Platform, { name: string; label: string }>;

export function nodeById(id: string): RedeNode | undefined {
  return NODES.find((n) => n.id === id);
}

/** The station's name as the HUD shows it. */
export function nodeTitle(node: RedeNode): string {
  switch (node.kind) {
    case "hub":
      return node.label;
    case "page":
      return node.page.label;
    case "edition":
      return node.names.join(" · ");
    case "social":
      return PLATFORM_NAME[node.platform].name;
  }
}

/** Where the station leads: a route, or an outside URL. */
export function nodeHref(node: RedeNode): string {
  switch (node.kind) {
    case "hub":
      return "/";
    case "page":
      return node.page.href;
    case "edition":
      return node.ctas[0]?.href ?? "/";
    case "social":
      return node.href;
  }
}

/**
 * Metro routing between two stations: a straight run, then a 45° run (or
 * the reverse), so every segment is horizontal, vertical or diagonal.
 */
export function route(a: Point, b: Point): Point[] {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const diag = Math.min(Math.abs(dx), Math.abs(dy));
  if (diag === 0 || Math.abs(dx) === Math.abs(dy)) return [a, b];
  const corner =
    Math.abs(dx) > Math.abs(dy)
      ? { x: b.x - Math.sign(dx) * diag, y: a.y }
      : { x: a.x, y: b.y - Math.sign(dy) * diag };
  return [a, corner, b];
}

/** The polyline for one line, through all its stops. */
export function linePoints(line: LineId): Point[] {
  const stops = LINES[line]
    .map((id) => nodeById(id))
    .filter((n): n is RedeNode => n !== undefined)
    .map((n) => n.at);
  const points: Point[] = [];
  for (let i = 0; i < stops.length - 1; i++) {
    const seg = route(stops[i], stops[i + 1]);
    points.push(...(i === 0 ? seg : seg.slice(1)));
  }
  return points;
}

export type Bounds = { minX: number; minY: number; maxX: number; maxY: number };

/** The world box every station fits in, padded. */
export function worldBounds(pad: number): Bounds {
  const xs = NODES.map((n) => n.at.x);
  const ys = NODES.map((n) => n.at.y);
  return {
    minX: Math.min(...xs) - pad,
    minY: Math.min(...ys) - pad,
    maxX: Math.max(...xs) + pad,
    maxY: Math.max(...ys) + pad,
  };
}
