// The shapes every edition and link is checked against. Data files declare
// their lists with `satisfies` these types, so a malformed entry fails the
// typecheck instead of a render or a page load.

/** A brand segment. links amarelos #N (Substack) and ondas amarelas #N
 *  (podcast) are the SAME edition in two media, so they share one series. */
export type Series = "links-amarelos" | "hyperlinks";

/** One of the four tabs a promo video cycles through. */
export type Tab = {
  /** Who made the linked thing. Only the author shows, never a content title. */
  author: string;
  /** File name inside `assets/<edition id>/`, e.g. "01.png". */
  image: string;
};

/**
 * What crayola needs to make an edition's promo kit. Discriminated by
 * `kind`: an edition shows either exactly four tabs or a chant, never both.
 */
export type Promo = {
  /** Folder slug crayola uses for outputs, e.g. "abracadabra" →
   *  outputs/links-ondas/009-abracadabra. */
  slug: string;
  /** Opening theme ("{tema aqui}"). Only hyperlinks uses it. */
  theme?: string;
} & (
  | { kind: "tabs"; tabs: readonly [Tab, Tab, Tab, Tab] }
  | {
      kind: "chant";
      /** Phrases that replace the tabs, one per line, filling the screen. */
      chant: readonly [string, ...string[]];
    }
);

/** Release date, YYYY-MM-DD. */
export type AirDate = `${number}-${number}-${number}`;

/** One piece of content, released in one or more media. */
export type Edition = {
  /** "<series>-<number>", e.g. "links-amarelos-3". Unique. */
  id: `${Series}-${number}`;
  series: Series;
  number: number;
  /** The edition's subtitle, e.g. "maestros, saltos e seriedade". */
  title?: string;
  airDate?: AirDate;
  /** Where it was released. */
  media: {
    newsletter?: string;
    podcast?: string;
  };
} & (
  | { promo?: undefined }
  /** An edition with a promo kit must have an air date: the CTA counts down to it. */
  | { promo: Promo; airDate: AirDate }
);

/** One thing that was curated. */
export type Link = {
  /** Kebab-case slug, unique, stable (used to remember visited links). */
  id: string;
  url: string;
  /** Dandara's own take on the link, lowercase, in Portuguese. NOT the
   *  source's headline. */
  title: string;
  /** Who made the linked thing. May be empty. */
  authors: string[];
  /** Ids of the editions it appeared in. Every id must exist in EDITIONS. */
  editions: string[];
};
