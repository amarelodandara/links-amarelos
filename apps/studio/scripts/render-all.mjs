// @ts-check
/**
 * Renderiza o pacote completo de uma edição (seção 7 do plano).
 *
 *   npm run render:all -- links-ondas/042-edicao-de-exemplo
 *   npm run render:all               # todas as edições
 *
 * Saída em /outputs/<type>/<slug>/ — fora do controle de versão, sobe manual
 * pro Google Drive (seção 8). O `npm run sync` que roda antes já garante que
 * nenhuma edição com assets faltando chegue até aqui.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { renumberSequence } from "./lib/sequence.mjs";
import { collectEditions, root } from "./lib/editions.mjs";

// Lê /content direto pela mesma varredura do sync. A versão anterior fatiava o
// array de dentro do editions.generated.ts, mas o primeiro "[" do arquivo é o da
// anotação de tipo (`EditionEntry[]`), não o do array — o JSON.parse sempre
// falhava.
const { entries: editions, errors } = collectEditions();

if (errors.length > 0) {
  console.error("\nEdições inválidas — corrija antes de renderizar:\n");
  for (const e of errors) console.error(`  • ${e}`);
  console.error("");
  process.exit(1);
}

const filter = process.argv[2];
const targets = filter ? editions.filter((e) => e.dir === filter) : editions;

if (targets.length === 0) {
  console.error(`Nenhuma edição bate com "${filter}".`);
  process.exit(1);
}

const run = (args) => {
  console.log(`\n$ remotion ${args.join(" ")}`);
  const res = spawnSync("npx", ["remotion", ...args], { stdio: "inherit", cwd: root });
  if (res.status !== 0) process.exit(res.status ?? 1);
};

for (const entry of targets) {
  const id = `${entry.edition.type}-${String(entry.edition.editionNumber).padStart(3, "0")}`;
  const outDir = join(root, "outputs", entry.dir);
  mkdirSync(outDir, { recursive: true });

  run(["render", `InstagramStories-${id}`, join(outDir, "instagram-stories.mp4")]);
  run(["render", `XBlueSky-${id}`, join(outDir, "x-bluesky.mp4")]);

  // As duas peças estáticas saem como 6 PNGs numerados, não como vídeo.
  for (const [composition, folder] of [
    [`InstagramFeed-${id}`, "instagram-feed"],
    [`SubstackCarrossel-${id}`, "substack-carrossel"],
  ]) {
    const target = join(outDir, folder);
    run(["render", composition, target, "--sequence", "--image-format=png"]);
    renumberSequence(target);
  }

  console.log(`\n✓ ${entry.dir} → outputs/${entry.dir}`);
}
