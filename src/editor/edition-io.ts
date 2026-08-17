import { deleteStaticFile, writeStaticFile } from "@remotion/studio";
import type { Edition, EditionEntry, EditionType } from "../schema/edition";

/**
 * Gravação do `edition.json` e dos assets de uma edição, direto na publicDir
 * (= /content) através da API do Studio.
 *
 * Por que não o form automático de schema do Studio: ele salva em
 * `defaultProps` no `Root.tsx`, que é gerado a partir do `edition.json` pelo
 * `npm run sync` — a edição seria sobrescrita no próximo sync. Ver a correção da
 * seção 3 do plano.
 */

const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "webp"] as const;

export const slugify = (name: string): string =>
  name
    .normalize("NFD")
    // Remove os diacríticos que o NFD separou ("edição" → "edicao").
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const padEditionNumber = (editionNumber: number): string =>
  String(editionNumber).padStart(3, "0");

/** Pasta da edição, relativa a /content — ex: "links-ondas/042-nome-da-edicao". */
export const editionDir = (
  type: EditionType,
  editionNumber: number,
  name: string,
): string => `${type}/${padEditionNumber(editionNumber)}-${slugify(name)}`;

/** Nome legível de volta a partir do slug da pasta ("042-foo-bar" → "foo bar"). */
export const nameFromSlug = (slug: string): string =>
  slug.replace(/^\d+-/, "").replace(/-/g, " ");

const extensionOf = (fileName: string): string => {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return (IMAGE_EXTENSIONS as readonly string[]).includes(ext) ? ext : "png";
};

/** Caminho do asset de uma tab, relativo à pasta da edição. */
export const assetPathForTab = (tabIndex: number, fileName: string): string =>
  `assets/${String(tabIndex + 1).padStart(2, "0")}.${extensionOf(fileName)}`;

export interface DraftTab {
  author: string;
  /** Caminho já gravado ("assets/01.png"), ou "" se a tab ainda não tem imagem. */
  image: string;
  /** Arquivo novo escolhido no form, ainda não gravado. */
  file: File | null;
}

export interface Draft {
  type: EditionType;
  editionNumber: string;
  /** Só usado para montar o slug de uma edição nova. */
  name: string;
  airDate: string;
  theme: string;
  tabs: DraftTab[];
}

/** Preenche o form a partir de uma edição que já existe em /content. */
export const draftFromEntry = (entry: EditionEntry): Draft => ({
  type: entry.edition.type,
  editionNumber: String(entry.edition.editionNumber),
  name: nameFromSlug(entry.slug),
  airDate: entry.edition.airDate,
  theme: entry.edition.theme ?? "",
  tabs: entry.edition.tabs.map((tab) => ({
    author: tab.author,
    image: tab.image,
    file: null,
  })),
});

export const emptyDraft = (): Draft => ({
  type: "links-ondas",
  editionNumber: "",
  name: "",
  airDate: "",
  theme: "",
  tabs: Array.from({ length: 4 }, () => ({ author: "", image: "", file: null })),
});

/**
 * Problemas que impedem a gravação. Espelha o schema do `edition.json` — a
 * intenção é a mesma do `sync`: nunca deixar uma edição incompleta virar arquivo.
 */
export const validateDraft = (
  draft: Draft,
  { existingDirs, isNew }: { existingDirs: string[]; isNew: boolean },
): string[] => {
  const problems: string[] = [];

  const parsedNumber = Number(draft.editionNumber);
  if (!Number.isInteger(parsedNumber) || parsedNumber <= 0) {
    problems.push("Número da edição precisa ser um inteiro positivo.");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.airDate)) {
    problems.push("Data de lançamento precisa estar no formato AAAA-MM-DD.");
  }

  if (isNew) {
    if (!slugify(draft.name)) {
      problems.push("Nome da edição não pode ser vazio (ele monta o nome da pasta).");
    } else if (Number.isInteger(parsedNumber) && parsedNumber > 0) {
      const dir = editionDir(draft.type, parsedNumber, draft.name);
      if (existingDirs.includes(dir)) {
        problems.push(`Já existe uma edição em "${dir}".`);
      }
    }
  }

  draft.tabs.forEach((tab, i) => {
    if (!tab.author.trim()) problems.push(`Tab ${i + 1}: falta o nome do autor.`);
    if (!tab.file && !tab.image) problems.push(`Tab ${i + 1}: falta a imagem.`);
  });

  return problems;
};

/**
 * Grava a edição. As imagens vão primeiro, de propósito: o watch de /content
 * revalida a cada gravação, e um `edition.json` apontando pra imagem que ainda
 * não existe apareceria como edição inválida no meio do caminho.
 */
export const saveEdition = async ({
  dir,
  draft,
}: {
  dir: string;
  draft: Draft;
}): Promise<Edition> => {
  const tabs: Edition["tabs"] = [];

  for (const [index, tab] of draft.tabs.entries()) {
    if (!tab.file) {
      tabs.push({ author: tab.author.trim(), image: tab.image });
      continue;
    }

    const image = assetPathForTab(index, tab.file.name);
    await writeStaticFile({
      filePath: `${dir}/${image}`,
      contents: await tab.file.arrayBuffer(),
    });

    // Trocar png por jpg na mesma tab deixaria o arquivo antigo órfão em /assets.
    if (tab.image && tab.image !== image) {
      await deleteStaticFile(`${dir}/${tab.image}`);
    }

    tabs.push({ author: tab.author.trim(), image });
  }

  const edition: Edition = {
    editionNumber: Number(draft.editionNumber),
    type: draft.type,
    airDate: draft.airDate,
    ...(draft.type === "hyperlinks" && draft.theme.trim()
      ? { theme: draft.theme.trim() }
      : {}),
    tabs,
  };

  await writeStaticFile({
    filePath: `${dir}/edition.json`,
    contents: `${JSON.stringify(edition, null, 2)}\n`,
  });

  return edition;
};
