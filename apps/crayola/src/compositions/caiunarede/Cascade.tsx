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
  /** Frames entre a primeira e a segunda janela e entre as duas últimas; os
   *  do meio vão de um ao outro. Começar espaçado e terminar em 1 dá a pilha
   *  que dispara, como o sistema travando. Sem isso, ritmo fixo. */
  gaps?: readonly [first: number, last: number];
};

// Uma janela nova a cada tantos frames.
const FRAMES_PER_WINDOW = 3;

/** Frame (dentro da sequência) em que a janela `i` da pilha abre. */
export function windowOpensAt(stack: CascadeStack, i: number): number {
  const [first, last] = stack.gaps ?? [FRAMES_PER_WINDOW, FRAMES_PER_WINDOW];
  let at = stack.from;
  for (let k = 0; k < i; k++) {
    const t = stack.count > 2 ? k / (stack.count - 2) : 0;
    at += Math.max(1, Math.round(first + (last - first) * t));
  }
  return at;
}

/** Frame em que a última janela de todas já abriu. */
export const cascadeEnd = (stacks: readonly CascadeStack[]) =>
  Math.max(...stacks.map((stack) => windowOpensAt(stack, stack.count - 1) + 1));

export const Cascade: React.FC<{
  stacks: readonly CascadeStack[];
  content: LinkCardContent;
  palette: LinkCardPalette;
}> = ({ stacks, content, palette }) => {
  const frame = useCurrentFrame();

  return (
    <>
      {stacks.map((stack, s) => {
        const open = Array.from({ length: stack.count }, (_, i) => windowOpensAt(stack, i)).filter(
          (at) => at <= frame,
        ).length;
        return Array.from({ length: open }, (_, i) => (
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
