import { LINKS } from "@links/content";
import type { AuthorCard, Recommendation, Run } from "./graph";

/**
 * The words of the home: the introduction typed into the hub, and the two
 * windows that follow it. Brackets mark copy still to be written.
 */

const link = (id: string) => LINKS.find((l) => l.id === id);
const nostalgia = link("sobre-nostalgia");

const RECS = {
  artigo: { kind: "artigo", title: nostalgia?.title ?? "[artigo]", href: nostalgia?.url },
  livro: { kind: "livro", title: "[livro a definir]" },
  filme: { kind: "filme", title: "[filme a definir]" },
  musica: { kind: "música", title: "[música a definir]" },
} as const satisfies Record<string, Recommendation>;

const recommend = (text: string, rec: Recommendation): Run => ({ text, action: { kind: "recommend", rec } });

/** The introduction to every episode and issue, typed out in the hub window. */
export const INTRO: readonly Run[] = [
  { text: "Em tempos ideais, eu " },
  { text: "amarelo dandara", action: { kind: "author" } },
  {
    text: ", me sento com um lanchinho gostoso em mãos e passo horas em vadiagem digital. No final, me levanto com o bolso cheio de ",
  },
  recommend("artigos", RECS.artigo),
  { text: ", " },
  recommend("livros", RECS.livro),
  { text: ", " },
  recommend("filmes", RECS.filme),
  { text: ", " },
  recommend("músicas", RECS.musica),
  { text: " e outras coisas ainda sem lugar na taxonomia digital vigente." },
];

/** Typed into the newsletter window, which opens once the intro is done. */
export const NEWSLETTER: readonly Run[] = [
  { text: "Os links amarelos são " },
  { text: "o creme de la creme", italic: true },
  { text: " dessa vadiagem." },
];

/** Typed into the podcast window, which opens once the newsletter's is done. */
export const PODCAST: readonly Run[] = [{ text: "[apresentação do ondas amarelas]" }];

/** The author, in the about window opened from "amarelo dandara" in the intro. Copy from /sobre. */
export const AUTHOR: AuthorCard = {
  name: "amarelo dandara",
  lines: [
    "Amarelo Dandara é, para os próximos, Nicoly Dandara.",
    "Há tempos perambula pela internet e retorna com links que fazem todo mundo se perguntar: de onde isso saiu? Com os links amarelos, “todo mundo” pode passar a significar “o mundo todo”.",
  ],
  links: [
    { label: "instagram", href: "https://instagram.com/nydndr" },
    { label: "site", href: "https://adandara.com" },
  ],
};
