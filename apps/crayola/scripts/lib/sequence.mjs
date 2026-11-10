// @ts-check
/**
 * O `remotion render --sequence` nomeia os frames como `element-0.png`, que não
 * diz nada pra quem abre a pasta pra postar. Esta renomeação passa pra `01.png`
 * … `06.png`: 1-based (é "slide 1", não "slide 0") e com zero à esquerda, pra
 * ordenar certo em qualquer gerenciador de arquivos.
 */
import { readdirSync, renameSync } from "node:fs";
import { join } from "node:path";

export const renumberSequence = (dir) => {
  const frames = readdirSync(dir)
    .map((name) => ({ name, match: /^element-(\d+)\.(\w+)$/.exec(name) }))
    .filter((f) => f.match)
    .sort((a, b) => Number(a.match[1]) - Number(b.match[1]));

  for (const [index, frame] of frames.entries()) {
    const next = `${String(index + 1).padStart(2, "0")}.${frame.match[2]}`;
    renameSync(join(dir, frame.name), join(dir, next));
  }

  return frames.length;
};
