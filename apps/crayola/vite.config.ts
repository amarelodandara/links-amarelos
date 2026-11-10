import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import type { Plugin } from "vite";

/**
 * Dev server for the local playgrounds (`npm run playground`). Never built or
 * deployed: it only serves playground/ on localhost.
 */

const PRESETS_FILE = fileURLToPath(
  new URL("../../packages/brand/src/logo/presets.ts", import.meta.url),
);
/** First line of a file the playground serialized; anything else is refused. */
const PRESETS_HEADER = "// Named logo configs.";

/**
 * POST /__logo/presets writes the body to packages/brand/src/logo/presets.ts.
 * The page sends finished TS source (playground/serialize.ts), so the server
 * only checks it is ours and writes it — no parsing here.
 */
function savePresets(): Plugin {
  return {
    name: "logo-presets-save",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/__logo/presets", (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end();
          return;
        }
        let body = "";
        req.setEncoding("utf8");
        req.on("data", (chunk: string) => {
          body += chunk;
        });
        req.on("end", () => {
          if (!body.startsWith(PRESETS_HEADER)) {
            res.statusCode = 400;
            res.end("not a presets file");
            return;
          }
          writeFileSync(PRESETS_FILE, body, "utf8");
          res.end("saved");
        });
      });
    },
  };
}

export default defineConfig({
  root: fileURLToPath(new URL("./playground", import.meta.url)),
  plugins: [react(), savePresets()],
  // Fixed address, so the bookmark always works: fail rather than move ports.
  server: { host: "127.0.0.1", port: 5199, strictPort: true },
});
