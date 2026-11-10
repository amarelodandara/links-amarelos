// @ts-check
/**
 * Transcreve um trecho do episódio, com o tempo de cada palavra — a base da
 * legenda do destaque (ver docs/input.md).
 *
 *   node scripts/transcribe.mjs <N> <início> <fim>
 *   node scripts/transcribe.mjs 10 07:42 08:20
 *
 * Lê input/links+ondas-N/ondas-amarelas-N.mp3 e grava
 * outputs/links+ondas-N/_trabalho/destaque-<início>.json: a lista de palavras com
 * início/fim em ms, relativos ao começo do trecho. Esse texto é rascunho: a
 * grafia é conferida no rascunho da edição e a Dandara aprova antes do render.
 *
 * Na primeira vez instala o whisper.cpp e baixa o modelo em /whisper.cpp
 * (fora do git).
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  downloadWhisperModel,
  installWhisperCpp,
  toCaptions,
  transcribe,
} from "@remotion/install-whisper-cpp";
import { root } from "./lib/editions.mjs";

const WHISPER_PATH = join(root, "whisper.cpp");
const WHISPER_VERSION = "1.5.5";
const MODEL = "medium";

const [n, start, end] = process.argv.slice(2);
if (!n || !start || !end) {
  console.error("uso: node scripts/transcribe.mjs <N> <início mm:ss> <fim mm:ss>");
  process.exit(1);
}

const inputDir = join(root, "input", `links+ondas-${n}`);
const mp3 = join(inputDir, `ondas-amarelas-${n}.mp3`);
if (!existsSync(mp3)) {
  console.error(`Falta ${mp3}.`);
  process.exit(1);
}

await installWhisperCpp({ to: WHISPER_PATH, version: WHISPER_VERSION });
await downloadWhisperModel({ model: MODEL, folder: WHISPER_PATH });

// Arquivos de trabalho ficam em _trabalho/; a raiz da pasta é só o que vai pro ar.
const workDir = join(root, "outputs", `links+ondas-${n}`, "_trabalho");
mkdirSync(workDir, { recursive: true });
const slug = `destaque-${start.replace(/:/g, "")}`;
const wav = join(workDir, `${slug}.wav`);

// whisper.cpp só lê WAV 16 kHz mono.
const cut = spawnSync(
  "npx",
  ["remotion", "ffmpeg", "-y", "-ss", start, "-to", end, "-i", mp3, "-ar", "16000", "-ac", "1", wav],
  { stdio: "inherit", cwd: root },
);
if (cut.status !== 0) process.exit(cut.status ?? 1);

const output = await transcribe({
  inputPath: wav,
  whisperPath: WHISPER_PATH,
  whisperCppVersion: WHISPER_VERSION,
  model: MODEL,
  language: "pt",
  tokenLevelTimestamps: true,
});

const { captions } = toCaptions({ whisperCppOutput: output });

// O whisper devolve pedaços de palavra (" div" + "ir" + "ge"). A legenda
// precisa de palavras inteiras: pedaço que começa com espaço abre palavra
// nova, o resto (inclusive pontuação) gruda na anterior.
/** @type {{ text: string, startMs: number, endMs: number }[]} */
const words = [];
for (const c of captions) {
  const last = words[words.length - 1];
  if (last && !c.text.startsWith(" ")) {
    last.text += c.text;
    last.endMs = c.endMs;
  } else {
    words.push({ text: c.text.trim(), startMs: c.startMs, endMs: c.endMs });
  }
}

const json = join(workDir, `${slug}.json`);
writeFileSync(json, JSON.stringify({ start, end, words }, null, 2) + "\n");

console.log(`\n${words.map((w) => w.text).join(" ")}\n\n→ ${json}`);
