/** The site's pages, as the nav drawer, the footer and the home network list them. */
export type SitePage = {
  href: `/${string}`;
  label: string;
  tagline: string;
};

export const PAGES: readonly SitePage[] = [
  { href: "/sobre", label: "Sobre", tagline: "Conheça a história por trás dos links" },
  { href: "/manifesto", label: "Manifesto", tagline: "Os quatro princípios que guiam tudo" },
  { href: "/apoio", label: "Apoio", tagline: "Faça parte da comunidade" },
  { href: "/realizacoes", label: "Realizações", tagline: "Descubra o que o apoio ajuda a realizar" },
];
