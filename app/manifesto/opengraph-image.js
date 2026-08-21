import { renderOgImage, OG_SIZE } from "../lib/og-image";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "manifesto — os quatro princípios dos links amarelos";

export default async function Image() {
  return renderOgImage(
    "Profundo e otimista, presente e multimídia, auto-sustentável e apoiador",
  );
}
