import { z } from "zod";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { settings } from "../settings";
import { SANS } from "../design/fonts";
import { PLATFORM_ORDER, PlatformIcon } from "../design/PlatformIcon";

const A = settings.formats.anuncio;
const c = settings.colors;

export const anuncioSchema = z.object({
  layout: z.enum(["feed", "stories"]),
  /** Subtítulo da edição, cópia literal da primeira linha do rascunho. */
  subtitle: z.string().min(1),
  /** Capa do episódio (2000×2000), relativa à publicDir — no render, `input/`. */
  cover: z.string().min(1),
  /** Onde o lançamento sai. A ordem na peça é sempre a de PLATFORM_ORDER. */
  ctas: z.array(z.enum(["substack", "spotify", "youtube"])).min(1),
});

export type AnuncioProps = z.infer<typeof anuncioSchema>;

/**
 * Anúncio "no ar agora!" (D0): a capa do episódio no quadrado de cima e, na
 * faixa de baixo, o subtítulo da edição e os ícones de onde ler, ouvir e
 * assistir. Um still por layout — feed 4:5 e stories 9:16 — saídos dos
 * artboards da página Pieces do Paper.
 */
export const Anuncio: React.FC<AnuncioProps> = ({ layout, subtitle, cover, ctas }) => {
  const f = A[layout];
  const line = `${A.lineWidth}px solid ${c.sunDark}`;
  const stripTop = f.coverTop + f.width;
  const squareLeft = f.width - A.ctaSquareWidthPx;
  const platforms = PLATFORM_ORDER.filter((p) => ctas.includes(p));

  return (
    <AbsoluteFill style={{ backgroundColor: c.sunLighter, fontFamily: SANS }}>
      <Img
        src={staticFile(cover)}
        style={{ position: "absolute", left: 0, top: f.coverTop, width: f.width, height: f.width, objectFit: "cover" }}
      />

      {/* Linhas: em volta da capa, a divisória do quadrado dos CTAs e, no
          stories, o fechamento da faixa. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: f.coverTop,
          width: f.width,
          height: f.width,
          borderTop: f.coverTop > 0 ? line : undefined,
          borderBottom: line,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: squareLeft,
          top: stripTop - A.lineWidth,
          height: f.stripHeight + A.lineWidth,
          borderLeft: line,
        }}
      />
      {f.closeStrip && (
        <div style={{ position: "absolute", left: 0, top: stripTop + f.stripHeight, width: f.width, borderTop: line }} />
      )}

      <div
        style={{
          position: "absolute",
          left: A.textLeftPx,
          top: stripTop,
          width: A.textWidthPx,
          height: f.stripHeight,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 10,
          color: c.brandBlack,
          letterSpacing: "-0.04em",
        }}
      >
        <div style={{ display: "flex", gap: 22, fontSize: 88, lineHeight: "96px" }}>
          <span style={{ fontWeight: 600 }}>no ar</span>
          <span style={{ fontWeight: 800 }}>agora!</span>
        </div>
        <div style={{ fontSize: 32, lineHeight: "40px", fontWeight: 600 }}>{subtitle}</div>
      </div>

      <div
        style={{
          position: "absolute",
          left: squareLeft + A.lineWidth,
          top: stripTop,
          width: A.ctaSquareWidthPx - A.lineWidth,
          height: f.stripHeight,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: A.ctaGapPx,
        }}
      >
        {platforms.map((p) => (
          <PlatformIcon key={p} platform={p} />
        ))}
      </div>
    </AbsoluteFill>
  );
};
