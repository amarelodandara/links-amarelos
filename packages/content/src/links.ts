import { EDITIONS } from "./editions.ts";
import type { Edition, Link } from "./types.ts";

// Every link ever sent out. The stand-in for a future links database + API:
// LINKS joins EDITIONS by edition id, like two tables would. The compiler
// checks every entry against `Link`; edition id references are checked at
// module load in development.

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
