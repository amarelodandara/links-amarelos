import { EDITIONS } from "@links/content";
import type { Series } from "@links/content";
import type { EditionEntry, EditionType } from "./schema/edition";

/**
 * Every edition with a promo kit, shaped for the scenes. Replaces the old
 * `editions.generated.ts` that `npm run sync` built from /content.
 *
 * Composition ids and output folders keep their pre-monorepo names
 * (links-ondas-009, outputs/links-ondas/009-abracadabra).
 */
const TYPE_OF_SERIES = {
  "links-amarelos": "links-ondas",
  hyperlinks: "hyperlinks",
} satisfies Record<Series, EditionType>;

export const editions: EditionEntry[] = EDITIONS.flatMap((edition) => {
  if (edition.promo === undefined) return [];
  const { promo } = edition;
  const type = TYPE_OF_SERIES[edition.series];
  const slug = `${String(edition.number).padStart(3, "0")}-${promo.slug}`;
  return [
    {
      slug,
      dir: `${type}/${slug}`,
      edition: {
        editionNumber: edition.number,
        type,
        airDate: edition.airDate,
        theme: promo.theme,
        chant: promo.kind === "chant" ? [...promo.chant] : undefined,
        tabs:
          promo.kind === "tabs"
            ? promo.tabs.map((tab) => ({ author: tab.author, image: `${edition.id}/${tab.image}` }))
            : [],
      },
    },
  ];
});
