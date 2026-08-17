import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

/**
 * `staticFile()` resolve contra `window.remotion_staticBase`. Aqui ele aponta
 * pra rota que o servidor local usa pra servir /content — assim os mesmos
 * componentes funcionam sem alteração no player, no Studio e no render.
 *
 * Precisa acontecer antes de qualquer render, porque `staticFile` é chamado
 * durante a renderização dos componentes.
 */
(window as unknown as { remotion_staticBase: string }).remotion_staticBase = "/content";

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
