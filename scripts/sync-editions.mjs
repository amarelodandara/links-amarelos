// @ts-check
/**
 * Varre /content, valida cada edition.json e gera src/editions.generated.ts.
 *
 * Roda antes de `studio` e de `render` (npm pre-scripts). Falha ruidosamente —
 * o programa não deve rodar se a pasta /assets da edição estiver vazia ou com
 * menos imagens do que os 4 teasers exigem (seção 2 do plano).
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const contentDir = join(root, "content");
const outFile = join(root, "src", "editions.generated.ts");

const TYPES = ["links-ondas", "hyperlinks"];
const REQUIRED_TABS = 4;

/** @type {string[]} */
const errors = [];
/** @type {{slug: string, dir: string, edition: unknown}[]} */
const entries = [];

const listDirs = (path) =>
  existsSync(path)
    ? readdirSync(path, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
        .sort()
    : [];

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
    if (tabs.length !== REQUIRED_TABS) {
      errors.push(
        `${dir}/edition.json: ${tabs.length} tab(s), mas toda edição precisa de exatamente ${REQUIRED_TABS}`,
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

if (errors.length > 0) {
  console.error("\nEdições inválidas — corrija antes de rodar:\n");
  for (const e of errors) console.error(`  • ${e}`);
  console.error("");
  process.exit(1);
}

if (entries.length === 0) {
  console.error("\nNenhuma edição encontrada em /content. Crie uma antes de rodar.\n");
  process.exit(1);
}

entries.sort((a, b) =>
  a.dir === b.dir ? 0 : a.edition.editionNumber - b.edition.editionNumber,
);

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(
  outFile,
  `// GERADO POR scripts/sync-editions.mjs — não editar à mão.
import type { EditionEntry } from "./schema/edition";

export const editions: EditionEntry[] = ${JSON.stringify(entries, null, 2)};
`,
  "utf8",
);

console.log(`editions.generated.ts atualizado — ${entries.length} edição(ões).`);
