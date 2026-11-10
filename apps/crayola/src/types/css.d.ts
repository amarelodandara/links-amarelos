/**
 * O projeto não usa `vite/client` (o app é o único bundler com Vite, e o mesmo
 * código roda no bundler do Remotion), então o import de CSS precisa deste
 * declare pra passar no `tsc --noEmit`. Os dois bundlers injetam a folha.
 */
declare module "*.css";
