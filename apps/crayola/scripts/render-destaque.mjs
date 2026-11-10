// @ts-check
/**
 * Renderiza um destaque a partir da legenda aprovada.
 *
 *   node scripts/render-destaque.mjs <N> <início> [ctas] [--frame=<n>]
 *   node scripts/render-destaque.mjs 10 00:00 substack,spotify
 *
 * Lê outputs/links+ondas-N/_trabalho/destaque-<início>.legenda.json (a
 * transcrição já revisada pela Dandara), recorta o trecho do mp3 em qualidade
 * cheia, copia a capa e grava outputs/links+ondas-N/destaque-<início>.mp4 — na
 * raiz, que é só o que vai pro ar. Com --frame=<n> gera só um still daquele
 * frame em _trabalho/, pra conferir o layout.
 */
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { root } from "./lib/root.mjs";

const args = process.argv.slice(2);
const still = args.find((a) => a.startsWith("--frame="))?.split("=")[1];
const [n, start, ctasArg = "substack,spotify"] = args.filter((a) => !a.startsWith("--"));
if (!n || !start) {
  console.error("uso: node scripts/render-destaque.mjs <N> <início mm:ss> [ctas] [--frame=<n>]");
  process.exit(1);
}

const inputDir = join(root, "input", `links+ondas-${n}`);
const outDir = join(root, "outputs", `links+ondas-${n}`);
const workDir = join(outDir, "_trabalho");
const slug = `destaque-${start.replace(/:/g, "")}`;
const legendaPath = join(workDir, `${slug}.legenda.json`);
if (!existsSync(legendaPath)) {
  console.error(`Falta ${legendaPath}: a legenda precisa ser revisada antes do render.`);
  process.exit(1);
}
const legenda = JSON.parse(readFileSync(legendaPath, "utf8"));

/** "mm:ss" ou "h:mm:ss" → segundos. */
const seconds = (/** @type {string} */ ts) => ts.split(":").reduce((acc, part) => acc * 60 + Number(part), 0);
const durationMs = (seconds(legenda.end) - seconds(legenda.start)) * 1000;

const run = (/** @type {string[]} */ cmd) => {
  const res = spawnSync("npx", cmd, { stdio: "inherit", cwd: root });
  if (res.status !== 0) process.exit(res.status ?? 1);
};

// O .wav da transcrição é 16 kHz mono, só pro whisper. O vídeo leva o trecho
// recortado do mp3 original.
const audio = `${slug}.mp3`;
if (!existsSync(join(workDir, audio))) {
  run([
    "remotion", "ffmpeg", "-y", "-ss", legenda.start, "-to", legenda.end,
    "-i", join(inputDir, `ondas-amarelas-${n}.mp3`), "-c:a", "libmp3lame", "-q:a", "2", join(workDir, audio),
  ]);
}
copyFileSync(join(inputDir, "capa-episodio.png"), join(workDir, "capa-episodio.png"));

const propsPath = join(workDir, `${slug}.props.json`);
writeFileSync(
  propsPath,
  JSON.stringify({
    numero: Number(n),
    audio,
    cover: "capa-episodio.png",
    durationMs,
    words: legenda.words,
    ctas: ctasArg.split(","),
  }),
);

const common = [`--public-dir=${workDir}`, `--props=${propsPath}`];
if (still) {
  run(["remotion", "still", "Destaque", join(workDir, `${slug}-frame${still}.png`), `--frame=${still}`, ...common]);
} else {
  run(["remotion", "render", "Destaque", join(outDir, `${slug}.mp4`), ...common]);
}
