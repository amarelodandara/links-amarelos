import type { EditionEntry } from "../schema/edition";
import { LAYOUTS } from "../settings";
import { StillDeck } from "./StillDeck";

/** Os 6 stills do carrossel do Substack, em 14:10 horizontal (seção 5 do plano). */
export const SubstackCarrossel: React.FC<{ entry: EditionEntry }> = ({ entry }) => (
  <StillDeck entry={entry} layout={LAYOUTS.carousel} />
);
