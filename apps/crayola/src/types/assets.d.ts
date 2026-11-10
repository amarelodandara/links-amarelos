/** Imagens importadas direto no código (o bundler do Remotion devolve a URL). */
declare module "*.png" {
  const src: string;
  export default src;
}
