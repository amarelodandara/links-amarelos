// @ts-check
/**
 * Varredura e validação de /content, compartilhada por dois consumidores com
 * exigências diferentes:
 *
 * - `sync-editions.mjs` roda uma vez e falha ruidosamente (nada deve renderizar
 *   com assets faltando);
 * - `watch-editions.mjs` roda continuamente e precisa tolerar estados
 *   intermediários — enquanto o form do Studio grava uma edição nova, o
 *   `edition.json` pode existir por alguns milissegundos antes das imagens.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const contentDir = join(root, "content");
export const outFile = join(root, "src", "editions.generated.ts");

export const TYPES = ["links-ondas", "hyperlinks"];
export const REQUIRED_TABS = 4;

const listDirs = (path) =>
  existsSync(path)
    ? readdirSync(path, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
        .sort()
    : [];

/**
 * Lê e valida todas as edições.
 * @returns {{entries: {slug: string, dir: string, edition: any}[], errors: string[]}}
 */
export const collectEditions = () => {
  /** @type {string[]} */
  const errors = [];
  /** @type {{slug: string, dir: string, edition: any}[]} */
  const entries = [];

  for (const type of TYPES) {
    for (const slug of listDirs(join(contentDir, type))) {
      const dir = `${type}/${slug}`;
      const editionFile = join(contentDir, type, slug, "edition.json");

      if (!existsSync(editionFile)) {
        errors.push(`${dir}: falta edition.json`);
        continue;
      }

      let edition;
      try {
        edition = JSON.parse(readFileSync(editionFile, "utf8"));
      } catch (err) {
        errors.push(`${dir}/edition.json: JSON inválido — ${err.message}`);
        continue;
      }

      if (edition.type !== type) {
        errors.push(
          `${dir}/edition.json: campo "type" é "${edition.type}" mas o arquivo está na pasta "${type}"`,
        );
      }

      const tabs = Array.isArray(edition.tabs) ? edition.tabs : [];
      // Com `chant`, a frase toma o lugar das tabs e elas ficam de fora.
      const requiredTabs = edition.chant?.length ? 0 : REQUIRED_TABS;
      if (tabs.length !== requiredTabs) {
        errors.push(
          edition.chant?.length
            ? `${dir}/edition.json: tem "chant", então "tabs" deve ficar vazio`
            : `${dir}/edition.json: ${tabs.length} tab(s), mas toda edição precisa de exatamente ${REQUIRED_TABS}`,
        );
      }

      tabs.forEach((tab, i) => {
        if (!tab?.author) errors.push(`${dir}: tab ${i + 1} sem "author"`);
        if (!tab?.image) {
          errors.push(`${dir}: tab ${i + 1} sem "image"`);
          return;
        }
        if (!existsSync(join(contentDir, type, slug, tab.image))) {
          errors.push(`${dir}: tab ${i + 1} aponta pra "${tab.image}", que não existe`);
        }
      });

      entries.push({ slug, dir, edition });
    }
  }

  entries.sort((a, b) =>
    a.dir === b.dir ? 0 : a.edition.editionNumber - b.edition.editionNumber,
  );

  return { entries, errors };
};

const renderIndex = (entries) =>
  `// GERADO POR scripts/sync-editions.mjs — não editar à mão.
import type { EditionEntry } from "./schema/edition";

export const editions: EditionEntry[] = ${JSON.stringify(entries, null, 2)};
`;

/**
 * Grava `src/editions.generated.ts` — mas só se o conteúdo mudou. O watch
 * depende disso: reescrever o arquivo igual dispararia hot-reload em loop.
 * @returns {boolean} true se o arquivo foi reescrito.
 */
export const writeIndex = (entries) => {
  const next = renderIndex(entries);
  if (existsSync(outFile) && readFileSync(outFile, "utf8") === next) return false;

  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, next, "utf8");
  return true;
};
