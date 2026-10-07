import { useCurrentFrame } from "remotion";
import type { LinkCardContent, LinkCardPalette } from "../../design/LinkCard";
import { LinkCard, linkCardShadow } from "../../design/LinkCard";

/**
 * O link abrindo de novo e de novo, como janela de erro do Windows travado:
 * cada janela nova aparece de uma vez, um passo pro lado e pra baixo da
 * anterior, por cima dela. Várias pilhas começam em pontos diferentes do
 * quadro; as menores ficam atrás e as maiores na frente, passando da borda do
 * campo pras faixas — é isso que dá a profundidade.
 */
export type CascadeStack = {
  /** Canto superior esquerdo da primeira janela, em px do post. */
  x: number;
  y: number;
  /** Frame (dentro da sequência) em que a primeira janela abre. */
  from: number;
  count: number;
  scale: number;
  /** Passo entre janelas, em px do post. */
  step: number;
};

// Uma janela nova a cada tantos frames.
const FRAMES_PER_WINDOW = 3;

export const Cascade: React.FC<{
  stacks: readonly CascadeStack[];
  content: LinkCardContent;
  palette: LinkCardPalette;
}> = ({ stacks, content, palette }) => {
  const frame = useCurrentFrame();

  return (
    <>
      {stacks.map((stack, s) => {
        const open = Math.min(stack.count, Math.floor((frame - stack.from) / FRAMES_PER_WINDOW) + 1);
        return Array.from({ length: Math.max(0, open) }, (_, i) => (
          <div
            key={`${s}-${i}`}
            style={{
              position: "absolute",
              left: stack.x + i * stack.step,
              top: stack.y + i * stack.step,
              // Separa cada camada da de baixo.
              filter: linkCardShadow(stack.scale),
            }}
          >
            <LinkCard content={content} scale={stack.scale} palette={palette} />
          </div>
        ));
      })}
    </>
  );
};
