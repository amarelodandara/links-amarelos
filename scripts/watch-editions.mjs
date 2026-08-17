// @ts-check
/**
 * Mantém src/editions.generated.ts em sincronia com /content enquanto o Studio
 * está aberto.
 *
 * É o que fecha o ciclo do form de criação (etapa 8): a composition `Editor`
 * grava o `edition.json` via `writeStaticFile`, este watch regenera o índice, e
 * o hot-reload do Remotion faz as compositions da edição nova aparecerem no
 * seletor sem reiniciar nada.
 *
 * Ao contrário do sync, não morre em edição inválida — só avisa e espera a
 * próxima gravação. Uma edição pela metade é estado normal aqui.
 */
import { watch } from "node:fs";
import { collectEditions, contentDir, writeIndex } from "./lib/editions.mjs";

const DEBOUNCE_MS = 150;

/** @type {NodeJS.Timeout | null} */
let pending = null;
let lastErrorSignature = "";

const resync = () => {
  const { entries, errors } = collectEditions();

  // Só reporta quando o conjunto de erros muda — senão o log vira ruído a cada
  // arquivo que a gravação toca.
  const signature = errors.join("\n");
  if (signature !== lastErrorSignature) {
    lastErrorSignature = signature;
    if (errors.length > 0) {
      console.warn(`\n[watch] ${errors.length} pendência(s) em /content:`);
      for (const e of errors) console.warn(`  • ${e}`);
      console.warn("  (o índice segue com as edições válidas)\n");
    }
  }

  const valid = entries.filter((entry) => {
    const dir = entry.dir;
    return !errors.some((e) => e.startsWith(`${dir}:`) || e.startsWith(`${dir}/`));
  });

  if (writeIndex(valid)) {
    console.log(`[watch] editions.generated.ts — ${valid.length} edição(ões).`);
  }
};

const schedule = () => {
  if (pending) clearTimeout(pending);
  pending = setTimeout(resync, DEBOUNCE_MS);
};

resync();

// `recursive` é suportado em macOS e Windows; em Linux exige Node 20+.
watch(contentDir, { recursive: true }, schedule);

console.log("[watch] observando /content — Ctrl-C para sair.");
