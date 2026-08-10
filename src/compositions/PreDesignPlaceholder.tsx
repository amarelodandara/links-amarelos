import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { EditionEntry } from "../schema/edition";
import { ctaTargetForType, tabAssetPath } from "../schema/edition";

/**
 * ANDAIME, NÃO DESIGN.
 *
 * Existe só pra que o Remotion Studio abra com as proporções e a duração certas
 * e pra provar que os dados da edição e as imagens carregam. Todo o visual real
 * (tipografia, cor, tema/logo, metáfora de aba de navegador, timing das cenas)
 * vem depois, do HTML+CSS aprovado no Paper — seção 3.2 do plano.
 *
 * Este arquivo inteiro é pra ser jogado fora na etapa 5 da ordem de construção.
 */

export const PreDesignPlaceholder: React.FC<{
  entry: EditionEntry;
  label: string;
}> = ({ entry, label }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height, fps } = useVideoConfig();
  const { edition } = entry;

  // 6 blocos de tempo iguais: capa, 4 tabs, CTA.
  const segment = Math.min(5, Math.floor((frame / durationInFrames) * 6));
  const tabIndex = segment - 1;
  const tab = tabIndex >= 0 && tabIndex < 4 ? edition.tabs[tabIndex] : null;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#111",
        color: "#fff",
        fontFamily: "monospace",
        padding: 48,
        gap: 24,
        justifyContent: "center",
      }}
    >
      <div style={{ fontSize: 28, opacity: 0.5 }}>
        {label} · {width}×{height} · {(durationInFrames / fps).toFixed(1)}s
      </div>

      <div style={{ fontSize: 40 }}>
        essa semana em{" "}
        <span style={{ opacity: 0.5 }}>[logo: {edition.type}]</span>
      </div>

      {tab ? (
        <>
          <Img
            src={staticFile(tabAssetPath(entry, tabIndex))}
            style={{
              width: "100%",
              maxHeight: height * 0.4,
              objectFit: "contain",
              border: "2px solid #333",
            }}
          />
          <div style={{ fontSize: 44 }}>{tab.author}</div>
        </>
      ) : null}

      {segment === 5 ? (
        <div style={{ fontSize: 36 }}>
          {edition.airDate} · CTA: {ctaTargetForType(edition.type)}
        </div>
      ) : null}

      <div style={{ fontSize: 24, opacity: 0.4, marginTop: "auto" }}>
        edição #{edition.editionNumber} — placeholder, aguardando design do Paper
      </div>
    </AbsoluteFill>
  );
};
