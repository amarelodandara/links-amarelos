import { useEffect, useRef, useState } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import type { EditionEntry } from "../src/schema/edition";
import { PIECES, type PieceId } from "./pieces";
import { Chip, ChipGroup, Empty, colors } from "./ui";

/**
 * Coluna 2: o preview. Roda o mesmo componente que o render usa, então é
 * WYSIWYG de verdade — o que aparece aqui é o que sai no arquivo.
 *
 * Sem timeline: o player do Remotion traz só play/pause e uma barra de posição.
 * Pro carrossel, que são 6 stills, a navegação é slide a slide.
 */
export const PreviewColumn: React.FC<{
  entry: EditionEntry | null;
  /** Muda quando a edição é regravada, pra forçar o player a recarregar. */
  revision: number;
}> = ({ entry, revision }) => {
  const [pieceId, setPieceId] = useState<PieceId>("instagram-stories");
  const [slide, setSlide] = useState(0);
  const playerRef = useRef<PlayerRef>(null);

  const piece = PIECES.find((p) => p.id === pieceId) ?? PIECES[0];

  useEffect(() => {
    setSlide(0);
  }, [pieceId, entry?.dir]);

  useEffect(() => {
    if (piece.isStills) playerRef.current?.seekTo(slide);
  }, [slide, piece.isStills]);

  if (!entry) {
    return (
      <Empty>
        Escolha uma edição na coluna de input — ou crie uma — pra ver o preview
        aqui.
      </Empty>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, height: "100%" }}>
      <ChipGroup ariaLabel="Peça" value={pieceId} onChange={setPieceId}>
        {PIECES.map((p) => (
          <Chip key={p.id} value={p.id}>
            {p.label}
          </Chip>
        ))}
      </ChipGroup>

      <div style={{ fontSize: 13, color: colors.muted }}>{piece.format}</div>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#EDEDED",
          borderRadius: 12,
          padding: 12,
        }}
      >
        <Player
          // Recriar o player quando a edição, a peça ou a gravação mudam evita
          // ficar mostrando o frame antigo com os assets novos.
          key={`${entry.dir}-${piece.id}-${revision}`}
          ref={playerRef}
          component={piece.component}
          inputProps={piece.props(entry)}
          durationInFrames={piece.durationInFrames}
          fps={piece.fps}
          compositionWidth={piece.width}
          compositionHeight={piece.height}
          initialFrame={piece.posterFrame}
          controls={!piece.isStills}
          // As peças não têm áudio; o controle de volume só ocuparia espaço.
          showVolumeControls={false}
          loop
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            aspectRatio: `${piece.width} / ${piece.height}`,
          }}
        />
      </div>

      {piece.isStills ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, color: colors.muted, marginRight: 4 }}>Slide</span>
          <ChipGroup
            ariaLabel="Slide"
            value={String(slide)}
            onChange={(next) => setSlide(Number(next))}
          >
            {Array.from({ length: piece.durationInFrames }, (_, i) => (
              <Chip key={i} value={String(i)}>
                {i + 1}
              </Chip>
            ))}
          </ChipGroup>
        </div>
      ) : null}
    </div>
  );
};
