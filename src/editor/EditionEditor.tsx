import { AbsoluteFill, getRemotionEnvironment } from "remotion";
import { editions } from "../editions.generated";
import { SANS } from "../design/fonts";
import { EditionForm, formColors } from "./EditionForm";
import { studioWriter } from "./studio-writer";

/**
 * O form de edições hospedado dentro do Studio (etapa 8 do plano). O Studio não
 * tem API de painel customizado, então uma composition é o único lugar onde UI
 * própria roda — ver a correção da seção 3 do plano.
 *
 * O caminho normal de trabalho hoje é o app de 3 colunas (`npm run app`), que
 * hospeda o mesmo `EditionForm`; este aqui continua servindo pra quem já está
 * com o Studio aberto debugando uma composition.
 */
export const EditionEditor: React.FC = () => {
  if (!getRemotionEnvironment().isStudio) {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: formColors.bg,
          fontFamily: SANS,
          fontSize: 28,
          color: formColors.muted,
          alignItems: "center",
          justifyContent: "center",
          padding: 80,
          textAlign: "center",
        }}
      >
        O Editor existe só dentro do Remotion Studio — não é uma peça de saída.
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ backgroundColor: formColors.bg, padding: 44 }}>
      <div>
        <div
          style={{
            fontFamily: SANS,
            fontSize: 34,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: formColors.ink,
          }}
        >
          Editor de edições
        </div>
        <div
          style={{
            fontFamily: SANS,
            fontSize: 16,
            color: formColors.muted,
            marginTop: 4,
            marginBottom: 26,
          }}
        >
          Grava o <code>edition.json</code> e as imagens em <code>/content</code>.
        </div>
      </div>
      <EditionForm editions={editions} writer={studioWriter} />
    </AbsoluteFill>
  );
};
