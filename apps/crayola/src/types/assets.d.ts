/** Imagens importadas direto no código (o bundler do Remotion devolve a URL). */
declare module "*.png" {
  const src: string;
  export default src;
}
/** Files imported as a URL (Vite `?url`): the playgrounds use it for textures. */
declare module "*?url" {
  const src: string;
  export default src;
}
