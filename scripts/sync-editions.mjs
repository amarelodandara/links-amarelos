// @ts-check
/**
 * Valida /content e gera src/editions.generated.ts.
 *
 * Roda antes de `studio` e de `render` (npm pre-scripts). Falha ruidosamente —
 * o programa não deve rodar se a pasta /assets da edição estiver vazia ou com
 * menos imagens do que os 4 teasers exigem (seção 2 do plano). A varredura em
 * si vive em scripts/lib/editions.mjs, compartilhada com o watch.
 */
import { collectEditions, writeIndex } from "./lib/editions.mjs";

const { entries, errors } = collectEditions();

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

writeIndex(entries);
console.log(`editions.generated.ts atualizado — ${entries.length} edição(ões).`);
