import { renderOgImage, OG_SIZE } from "../lib/og-image";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "sobre — o que é links amarelos e quem está por trás";

export default async function Image() {
  return renderOgImage(
    "A curadoria mensal que te tira dos sites virais e te leva pra lugares novos",
  );
}
