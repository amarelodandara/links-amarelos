import { defineConfig } from "vite";
import { resolve } from "node:path";

const API_PORT = Number(process.env.APP_API_PORT ?? 3010);

/**
 * App de 3 colunas (input → preview → export). O `root` é /app, mas os
 * componentes vêm de /src — os mesmos que o Studio e o render usam.
 */
export default defineConfig({
  root: resolve(import.meta.dirname, "app"),
  server: {
    port: Number(process.env.APP_PORT ?? 3020),
    // /api e /content são do servidor local (scripts/server.mjs): gravação de
    // arquivos, render e as imagens das tabs que o preview carrega.
    proxy: {
      "/api": `http://localhost:${API_PORT}`,
      "/content": `http://localhost:${API_PORT}`,
    },
    fs: {
      // O root é /app, mas os imports sobem pra /src.
      allow: [resolve(import.meta.dirname)],
    },
  },
  /**
   * Sem @vitejs/plugin-react de propósito: a versão atual puxa Babel 8, que
   * conflita com o Babel 7 que o @remotion/studio-server fixa, e a alternativa
   * em SWC precisa de postinstall nativo — que o `allowScripts` deste repo
   * bloqueia. O esbuild do próprio Vite compila o JSX igual; o que se perde é o
   * Fast Refresh, então editar um componente recarrega a página inteira.
   */
  esbuild: { jsx: "automatic" },
});
