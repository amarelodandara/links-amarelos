import { renderOgImage, OG_SIZE } from "../lib/og-image";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "apoio — junte-se aos canarinhos";

export default async function Image() {
  return renderOgImage(
    "Seu apoio mantém os links e as ondas amarelas gratuitos pra sempre",
  );
}
