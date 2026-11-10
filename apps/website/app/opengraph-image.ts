import { renderOgImage, OG_SIZE } from "./lib/og-image";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt =
  "links amarelos — curadoria mensal de links que valem seu tempo";

export default async function Image() {
  return renderOgImage(
    "Uma curadoria mensal do melhor que a internet ainda tem pra oferecer",
  );
}
