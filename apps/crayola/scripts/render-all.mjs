// @ts-check
/**
 * Renderiza o pacote completo de uma edição (seção 7 do plano).
 *
 *   npm run render:all -- links-ondas/009-abracadabra
 *   npm run render:all               # todas as edições
 *
 * Saída em /outputs/<type>/<slug>/ — fora do controle de versão, sobe manual
 * pro Google Drive (seção 8). O `prerender:all` roda o check-assets de
 * @links/content antes, então nenhuma edição com asset faltando chega aqui.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { renumberSequence } from "./lib/sequence.mjs";
import { root } from "./lib/root.mjs";
// Node 24 roda TS direto: a mesma lista que o Root.tsx usa, vinda de
// @links/content. O `prerender:all` já checou que nenhum asset falta.
import { editions } from "../src/editions.ts";

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
