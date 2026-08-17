import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Agentation } from "agentation";
import { App } from "./App";

declare global {
  interface Window {
    /** Base que o `staticFile()` do Remotion resolve — ver abaixo. */
    remotion_staticBase: string;
  }
}

/**
 * `staticFile()` resolve contra `window.remotion_staticBase`. Aqui ele aponta
 * pra rota que o servidor local usa pra servir /content — assim os mesmos
 * componentes funcionam sem alteração no player, no Studio e no render.
 *
 * Precisa acontecer antes de qualquer render, porque `staticFile` é chamado
 * durante a renderização dos componentes.
 */
window.remotion_staticBase = "/content";

const container = document.getElementById("root");
if (!container) {
  throw new Error("app/index.html precisa de uma <div id=\"root\">.");
}

/**
 * A barra de anotação só entra no dev server (`npm run app`). O projeto não usa
 * `vite/client` (ver src/types/css.d.ts), então a checagem é pelo
 * `process.env.NODE_ENV` — que o Vite também substitui em tempo de bundle.
 */
createRoot(container).render(
  <StrictMode>
    <App />
    {process.env.NODE_ENV === "development" ? <Agentation /> : null}
  </StrictMode>,
);
