import { renderOgImage, OG_SIZE } from "../lib/og-image";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "realizações — o que nasce dos links amarelos";

export default async function Image() {
  return renderOgImage(
    "Os links amarelos são a semente. Isso aqui é tudo que nasce dela.",
  );
}
