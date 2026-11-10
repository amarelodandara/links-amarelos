/**
 * The studio's view of an edition: what the scenes read. Built from the
 * shared @links/content editions in `src/editions.ts`; the rules that used to
 * live in a zod schema (exactly 4 tabs or a chant, an air date) are now types
 * there, checked at compile time.
 */

/** Picks the whole visual theme and the final CTA. Studio name for a series:
 *  links-amarelos ships as "links + ondas". */
export type EditionType = "links-ondas" | "hyperlinks";

export type Tab = {
  author: string;
  /** Path relative to the public dir (packages/content/assets). */
  image: string;
};

export type Edition = {
  editionNumber: number;
  type: EditionType;
  /** YYYY-MM-DD. */
  airDate: string;
  /** Opening "{tema aqui}". Only hyperlinks uses it. */
  theme?: string;
  /** Phrases that replace the 4 tabs; with them, `tabs` is empty. */
  chant?: string[];
  tabs: Tab[];
};

/** An edition plus where its outputs go. */
export type EditionEntry = {
  /** Folder slug, e.g. "009-abracadabra". */
  slug: string;
  /** Output path under outputs/, e.g. "links-ondas/009-abracadabra". */
  dir: string;
  edition: Edition;
};

/** A tab's image, as `staticFile` takes it. */
export const tabAssetPath = (entry: EditionEntry, tabIndex: number): string =>
  entry.edition.tabs[tabIndex].image;
