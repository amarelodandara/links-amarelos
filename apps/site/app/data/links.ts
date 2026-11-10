// Every link ever sent out, and the editions that sent them. This is the
// stand-in for a future links database + API, so the shape mirrors two tables:
// `EDITIONS` and `LINKS`, joined by edition id.
//
// ── Format (for whoever fills this in) ───────────────────────────────────────
//
// Edition — one piece of content, released in one or more media.
//   id       "<series>-<number>", e.g. "links-amarelos-3". Unique.
//   series   "links-amarelos" today. "hyperlinks" joins later.
//   number   the edition number.
//   title    the edition's subtitle, e.g. "maestros, saltos e seriedade".
//   media    where it was released. links amarelos #N (Substack) and
//            ondas amarelas #N (podcast) are the SAME edition in two media:
//            { newsletter?: url, podcast?: url }.
//
// Link — one thing that was curated.
//   id       kebab-case slug, unique, stable (used to remember visited links).
//   url      the link itself.
//   title    Dandara's own take on the link, lowercase, in Portuguese.
//            NOT the source's headline.
//   authors  who made the linked thing. May be empty.
//   editions ids of the editions it appeared in. Every id must exist in
//            EDITIONS.
//
// The compiler checks every entry against the types below; edition id
// references are checked at module load in development.
// ─────────────────────────────────────────────────────────────────────────────

export type Series = "links-amarelos";

export type Edition = {
  id: string;
  series: Series;
  number: number;
  title: string;
  media: {
    newsletter?: string;
    podcast?: string;
  };
};

export type Link = {
  id: string;
  url: string;
  title: string;
  authors: string[];
  editions: string[];
};

export const EDITIONS = [
  {
    id: "links-amarelos-3",
    series: "links-amarelos",
    number: 3,
    title: "maestros, saltos e seriedade",
    media: {
      newsletter: "https://amarelodandara.substack.com/links-amarelos-3",
    },
  },
] satisfies Edition[];

// Seeded from the v1 section. Authors and editions are still to be filled in.
export const LINKS = [
  {
    id: "hello-stranger",
    url: "https://pudding.cool/2025/06/hello-stranger/",
    title: "é saudável falar com estranhos",
    authors: [],
    editions: [],
  },
  {
    id: "europa-de-bike",
    url: "https://www.youtube.com/watch?v=JjBLsWGldsE",
    title: "tem gente cruzando a europa de bike",
    authors: [],
    editions: [],
  },
  {
    id: "rock-nao-morreu",
    url: "https://youtu.be/ehJqJdseeNc?si=gBPHB4WsprA-7YeI",
    title: "o rock não morreu, nem mudou de cor",
    authors: [],
    editions: [],
  },
  {
    id: "sobre-nostalgia",
    url: "https://open.substack.com/pub/valternascimento/p/biscoito-passatempo-dinossauros-e",
    title: "sobre nostalgia",
    authors: [],
    editions: [],
  },
  {
    id: "gnx",
    url: "https://www.tiktok.com/@racingbr_/video/7557512133030776075",
    title: "GNX",
    authors: [],
    editions: [],
  },
  {
    id: "musica-de-fone",
    url: "https://www.youtube.com/watch?v=ngc8Fu3mGzA",
    title: "música ao vivo de fone de ouvido",
    authors: [],
    editions: [],
  },
  {
    id: "fabulacao-critica",
    url: "https://queriasergrande.substack.com/p/279-queria-ser-grande-mas-desisti",
    title: "fabulação crítica",
    authors: [],
    editions: [],
  },
  {
    id: "queda-de-icaro",
    url: "https://x.com/AJamesMcCarthy/status/1989027887689998561",
    title: "a queda de ícaro",
    authors: [],
    editions: [],
  },
  {
    id: "melhor-entrevistadora",
    url: "https://www.youtube.com/watch?v=QN1rULxGHCA",
    title: "a melhor entrevistadora do pop",
    authors: [],
    editions: [],
  },
  {
    id: "rangolithical",
    url: "https://octopodium.itch.io/rangolithical",
    title: "o Game Of The Year",
    authors: [],
    editions: [],
  },
] satisfies Link[];

const EDITIONS_BY_ID = new Map<string, Edition>(
  EDITIONS.map((edition) => [edition.id, edition]),
);

export function editionsOf(link: Link): Edition[] {
  return link.editions.flatMap((id) => {
    const edition = EDITIONS_BY_ID.get(id);
    return edition ? [edition] : [];
  });
}

if (process.env.NODE_ENV !== "production") {
  const seen = new Set<string>();
  for (const link of LINKS) {
    if (seen.has(link.id)) throw new Error(`links.ts: duplicate link id "${link.id}"`);
    seen.add(link.id);
    for (const id of link.editions) {
      if (!EDITIONS_BY_ID.has(id)) {
        throw new Error(`links.ts: link "${link.id}" names unknown edition "${id}"`);
      }
    }
  }
}

/** A shuffled sample of `count` links. Call after mount, never during render
 *  on the server, or the sample will mismatch on hydration. */
export function pickTaste(count: number): Link[] {
  const pool: Link[] = [...LINKS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}
