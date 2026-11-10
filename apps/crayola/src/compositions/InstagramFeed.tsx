import type { EditionEntry } from "../schema/edition";
import { LAYOUTS } from "../settings";
import { StillDeck } from "./StillDeck";

/**
 * Os 6 stills quadrados do feed do Instagram.
 *
 * Mesma proporção do vídeo do X/BlueSky e still pelo mesmo motivo que o
 * carrossel do Substack é still: vídeo postado no feed do Instagram é
 * convertido em Reels, que não é o que a peça quer ser.
 */
export const InstagramFeed: React.FC<{ entry: EditionEntry }> = ({ entry }) => (
  <StillDeck entry={entry} layout={LAYOUTS.instagramFeed} />
);
