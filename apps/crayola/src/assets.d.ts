/** Remotion's bundler serves imported font files as assets: the import is their URL. */
declare module "*.woff2" {
  const url: string;
  export default url;
}
