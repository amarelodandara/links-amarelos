import { z } from "zod";

/**
 * Schema do `edition.json` (seção 3 do plano).
 *
 * Regras que o schema garante sozinho:
 * - exatamente 4 tabs (ela escolhe manualmente as 4 mais interessantes);
 * - cada tab só carrega o nome do autor — nada de título de conteúdo;
 * - `type` é o que decide tema e CTA final, não existe campo "tema".
 *
 * O que o schema NÃO garante (validado em runtime, ver `scripts/sync-editions.mjs`):
 * - que os arquivos de imagem apontados por cada tab existam de fato em /assets.
 */

export const editionTypeSchema = z.enum(["links-ondas", "hyperlinks"]);

export type EditionType = z.infer<typeof editionTypeSchema>;

export const tabSchema = z.object({
  author: z.string().min(1, "author não pode ser vazio"),
  image: z
    .string()
    .min(1)
    .regex(/^assets\//, 'image deve ser um caminho relativo começando com "assets/"'),
});

export const editionSchema = z.object({
  editionNumber: z.number().int().positive(),
  type: editionTypeSchema,
  airDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "airDate deve estar no formato YYYY-MM-DD"),
  tabs: z.array(tabSchema).length(4, "toda edição precisa de exatamente 4 tabs"),
});

export type Edition = z.infer<typeof editionSchema>;

/** Edição + de onde ela foi lida, para montar caminhos de asset e de output. */
export const editionEntrySchema = z.object({
  /** Slug da pasta, ex: "042-nome-da-edicao". */
  slug: z.string().min(1),
  /** Caminho relativo a /content, ex: "links-ondas/042-nome-da-edicao". */
  dir: z.string().min(1),
  edition: editionSchema,
});

export type EditionEntry = z.infer<typeof editionEntrySchema>;

/**
 * Destino do CTA final. Derivado do `type` — hyperlinks não tem post longo no
 * Substack, então aponta pro Spotify (seção 2).
 */
export const ctaTargetForType = (type: EditionType): "substack" | "spotify" =>
  type === "hyperlinks" ? "spotify" : "substack";

/** Caminho de um asset da tab, relativo à publicDir (= /content). */
export const tabAssetPath = (entry: EditionEntry, tabIndex: number): string =>
  `${entry.dir}/${entry.edition.tabs[tabIndex].image}`;
