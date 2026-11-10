// @ts-check
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** apps/crayola — where outputs/, input/ and remotion.config.ts live. */
export const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

/** packages/content/assets — the Remotion public dir: edition tab images and
 *  other media served through `staticFile`. */
export const assetsDir = resolve(root, "..", "..", "packages", "content", "assets");
