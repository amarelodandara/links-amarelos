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
import { mkdirSync, readFileSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// editions.generated.ts é TypeScript; o array literal é lido direto do arquivo.
const generated = readFileSync(join(root, "src", "editions.generated.ts"), "utf8");
const editions = JSON.parse(
  generated.slice(generated.indexOf("["), generated.lastIndexOf("]") + 1),
);

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

  run(["render", `Stories-${id}`, join(outDir, "stories.mp4")]);
  run(["render", `Feed-${id}`, join(outDir, "feed.mp4")]);
  // Carrossel sai como 6 PNGs numerados, não como vídeo.
  run([
    "render",
    `CarouselSlide-${id}`,
    join(outDir, "carrossel"),
    "--sequence",
    "--image-format=png",
  ]);

  console.log(`\n✓ ${entry.dir} → outputs/${entry.dir}`);
}
