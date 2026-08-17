import "react";

/**
 * As custom properties que a UI escreve em `style` inline. Sem este augment o
 * `CSSProperties` do React só aceita propriedades conhecidas, e cada `style`
 * com token viraria um cast.
 */
declare module "react" {
  interface CSSProperties {
    /** Acento da UI (amarelo/azul, por tipo de edição). Lido pelo controls.css. */
    "--ui-accent"?: string;
  }
}
