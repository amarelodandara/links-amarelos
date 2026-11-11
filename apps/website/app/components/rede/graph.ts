import { PAGES } from "../../lib/pages";
import type { SitePage } from "../../lib/pages";
import { AUTHOR, INTRO } from "./intro";

/**
 * The home network: every window and the threads that join them. The graph
 * is a tree rooted at the hub; the scene reads depth off it, so a window's
 * distance from the one in focus (in hops) decides how far back it floats.
 *
 * All copy here comes from the site as it was: page taglines (NavDrawer),
 * edition titles and blurbs (the old home), platform names and labels
 * (ExternalLinkPill).
 */

/** Something mentioned in the intro, shown in a hover window. */
export type Recommendation = {
  kind: "artigo" | "livro" | "filme" | "música";
  title: string;
  by?: string;
  href?: string;
};

/** What a run does: open the author window, or show a recommendation on hover. */
export type RunAction = { kind: "author" } | { kind: "recommend"; rec: Recommendation };

/**
 * A run of text in a blurb; `redacted` renders in the Redacted face, as on the
 * old home; `italic` is emphasis.
 */
export type Run = { text: string; redacted?: boolean; italic?: boolean; action?: RunAction };

export type Platform = "substack" | "spotify";

export type Cta = { platform: Platform; href: string };

type Base = { id: string };

export type HubNode = Base & {
  kind: "hub";
  label: string;
  /** The introduction to every episode and issue, typed out in the hub window. */
  intro: readonly Run[];
};

/** Who makes links amarelos, shown in the about window. */
export type AuthorCard = {
  name: string;
  lines: readonly string[];
  links: readonly { label: string; href: string }[];
};

export type PageNode = Base & {
  kind: "page";
  page: SitePage;
  author?: AuthorCard;
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

export const SUBSTACK = "https://amarelodandara.substack.com";
export const SPOTIFY_SHOW = "https://open.spotify.com/show/043Gs7eyY2KOlotEWSTSxB?si=e7abf2b9730747d7";

export const HUB_ID = "hub";
/** The about window: on the second layer, opened from the + by the author's name. */
export const ABOUT_ID = "page-sobre";

export const NODES: readonly RedeNode[] = [
  {
    id: HUB_ID,
    kind: "hub",
    label: "links amarelos",
    intro: INTRO,
  },
  ...PAGES.map(
    (page): PageNode => {
      const node: PageNode = { id: `page${page.href.replace("/", "-")}`, kind: "page", page };
      // The about page's window also introduces the author.
      if (page.href === "/sobre") node.author = AUTHOR;
      return node;
    },
  ),
  {
    id: "links-amarelos-3",
    kind: "edition",
    names: ["links amarelos #3"],
    blurb: [{ text: "maestros, saltos e seriedade" }],
    covers: ["/brand/links-amarelos-3.png"],
    ctas: [{ platform: "substack", href: `${SUBSTACK}/links-amarelos-3` }],
    upcoming: false,
  },
  {
    id: "ondas-amarelas-6",
    kind: "edition",
    names: ["ondas amarelas #6"],
    blurb: [{ text: "autorrealização, autocriação" }],
    covers: ["/brand/ondas-amarelas-6.png"],
    ctas: [{ platform: "spotify", href: "https://open.spotify.com/episode/56YFLEYZebBCBU9DEOCZlL?si=ceb9096ddfc347c3" }],
    upcoming: false,
  },
  {
    id: "edicao-8",
    kind: "edition",
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
    names: ["links amarelos #9", "ondas amarelas #9"],
    blurb: [],
    covers: ["/brand/coming-newsletter.png", "/brand/coming-podcast.png"],
    ctas: [],
    upcoming: true,
  },
  {
    id: "hyperlinks-1",
    kind: "edition",
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
    platform: "substack",
    href: SUBSTACK,
  },
  {
    id: "social-spotify",
    kind: "social",
    platform: "spotify",
    href: SPOTIFY_SHOW,
  },
];

/** Each thread's stops in order, starting at the hub. Consecutive stops are joined. */
const THREADS: readonly (readonly string[])[] = [
  [HUB_ID, "page-sobre", "page-manifesto", "page-realizacoes", "page-apoio"],
  [HUB_ID, "links-amarelos-3", "ondas-amarelas-6", "edicao-8", "edicao-9", "hyperlinks-1"],
  [HUB_ID, "social-substack", "social-spotify"],
];

export type Edge = readonly [string, string];

export const EDGES: readonly Edge[] = THREADS.flatMap((stops) =>
  stops.slice(1).map((id, i): Edge => [stops[i] ?? HUB_ID, id]),
);

export function neighbors(id: string): string[] {
  return EDGES.flatMap(([a, b]) => (a === id ? [b] : b === id ? [a] : []));
}

/** Breadth-first from `root`: each node's hop count and the node it was reached from. */
export function hops(root: string): Map<string, { hop: number; via: string | null }> {
  const out = new Map<string, { hop: number; via: string | null }>([[root, { hop: 0, via: null }]]);
  const queue = [root];
  for (let id = queue.shift(); id !== undefined; id = queue.shift()) {
    const hop = (out.get(id)?.hop ?? 0) + 1;
    for (const next of neighbors(id)) {
      if (out.has(next)) continue;
      out.set(next, { hop, via: id });
      queue.push(next);
    }
  }
  return out;
}

export const PLATFORM_NAME = {
  substack: { name: "Substack", label: "Leia" },
  spotify: { name: "Spotify", label: "Ouça" },
} as const satisfies Record<Platform, { name: string; label: string }>;

export function nodeById(id: string): RedeNode | undefined {
  return NODES.find((n) => n.id === id);
}

/** The window's name. */
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

const host = (url: string): string => url.replace(/^https?:\/\//, "").replace(/[/?#].*$/, "");

/** What the window's title bar shows: a route, a host, or that it's not out yet. */
export function nodePath(node: RedeNode): string {
  switch (node.kind) {
    case "hub":
      return "linksamarelos.com";
    case "page":
      return `linksamarelos.com${node.page.href}`;
    case "edition":
      return node.ctas[0] ? host(node.ctas[0].href) : "em breve";
    case "social":
      return host(node.href);
  }
}
