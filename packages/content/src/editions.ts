import type { Edition } from "./types.ts";

// Every edition, in release order. To add one: append an entry here, and if
// it has a promo kit, put its tab images in packages/content/assets/<id>/.
// `npm run check-assets -w @links/content` confirms every image exists.

// Typed as Edition[] (not `satisfies`): consumers read optional fields like
// `promo.theme`, which a narrowed literal type would hide.
export const EDITIONS: readonly Edition[] = [
  {
    id: "links-amarelos-3",
    series: "links-amarelos",
    number: 3,
    title: "maestros, saltos e seriedade",
    media: {
      newsletter: "https://amarelodandara.substack.com/links-amarelos-3",
    },
  },
  {
    id: "links-amarelos-9",
    series: "links-amarelos",
    number: 9,
    airDate: "2026-08-22",
    media: {},
    promo: {
      slug: "abracadabra",
      kind: "tabs",
      tabs: [
        { author: "Daniel Primata", image: "01.png" },
        { author: "Marco Reis", image: "02.png" },
        { author: "Brandon Sanderson", image: "03.png" },
        { author: "Roberto Barreto", image: "04.webp" },
      ],
    },
  },
  {
    id: "links-amarelos-17",
    series: "links-amarelos",
    number: 17,
    airDate: "2026-10-17",
    media: {},
    promo: {
      slug: "voces-sabem",
      kind: "chant",
      chant: ["vocês sabem", "a única coisa possível"],
    },
  },
];
