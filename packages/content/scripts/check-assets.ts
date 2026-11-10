/**
 * The one rule types cannot enforce: every tab image an edition names must
 * exist on disk in assets/<edition id>/. Exits 1 and lists every miss, so
 * nothing renders with a hole in it.
 */
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { EDITIONS } from "../src/editions.ts";

const assetsDir = fileURLToPath(new URL("../assets/", import.meta.url));
const missing: string[] = [];

for (const edition of EDITIONS) {
  if (edition.promo?.kind !== "tabs") continue;
  edition.promo.tabs.forEach((tab, i) => {
    const path = `${edition.id}/${tab.image}`;
    if (!existsSync(`${assetsDir}${path}`)) missing.push(`${edition.id}: tab ${i + 1} → assets/${path}`);
  });
}

if (missing.length > 0) {
  console.error("\nMissing edition assets:\n");
  for (const line of missing) console.error(`  • ${line}`);
  console.error("");
  process.exit(1);
}
console.log(`Edition assets OK (${EDITIONS.length} editions).`);
