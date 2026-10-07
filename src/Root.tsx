import { Composition, Folder } from "remotion";
import { editions } from "./editions.generated";
import { InstagramFeed } from "./compositions/InstagramFeed";
import { SubstackCarrossel } from "./compositions/SubstackCarrossel";
import { Square } from "./compositions/Square";
import { CAIU_NA_REDE, CaiuNaRede } from "./compositions/CaiuNaRede";
import { Stories } from "./compositions/Stories";
import { EditionEditor } from "./editor/EditionEditor";
import {
  CAROUSEL,
  CAROUSEL_SLIDE_COUNT,
  DURATION_IN_FRAMES,
  EDITOR,
  SQUARE,
  FPS,
  STORIES,
} from "./settings";

/**
 * Uma pasta por edição no seletor lateral do Studio, com as três compositions
 * de saída dentro (seção 4), uma por plataforma: `InstagramStories` é vídeo
 * 9:16; `XBlueSky` é vídeo quadrado; `InstagramFeed` e `SubstackCarrossel`
 * saem como stills, o primeiro quadrado e o segundo em 14:10.
 *
 * As três compartilham as cenas de `compositions/scenes` e só diferem no
 * layout. `CarouselSlide` roda a 1 fps: cada frame é um slide, congelado.
 */
export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/*
       * Ferramenta, não peça de saída: o form de criação/edição das edições.
       * O render em lote percorre as edições por id, então esta composition
       * nunca entra no pacote renderizado.
       */}
      <Composition
        id="Editor"
        component={EditionEditor}
        durationInFrames={1}
        fps={FPS}
        width={EDITOR.width}
        height={EDITOR.height}
      />

      {/* Template novo em construção — ainda não ligado às edições. */}
      <Composition
        id="CaiuNaRede"
        component={CaiuNaRede}
        durationInFrames={CAIU_NA_REDE.durationInSeconds * FPS}
        fps={FPS}
        width={CAIU_NA_REDE.width}
        height={CAIU_NA_REDE.height}
        defaultProps={{
          lema: "caiu na rede, é link!",
          link: {
            title: "onde dá pra conversar",
            description:
              "entenda quantas pessoas não votaram ou votaram em candidatos que podem ser nossos aliados",
            action: "visitar",
            image: "caiunarede/onde-da-pra-conversar.jpg",
            imagePosition: "6% 50%",
          },
        }}
      />

      {editions.map((entry) => {
        const id = `${entry.edition.type}-${String(entry.edition.editionNumber).padStart(3, "0")}`;

        return (
          <Folder name={id} key={entry.dir}>
            <Composition
              id={`InstagramStories-${id}`}
              component={Stories}
              durationInFrames={DURATION_IN_FRAMES}
              fps={FPS}
              width={STORIES.width}
              height={STORIES.height}
              defaultProps={{ entry }}
            />
            <Composition
              id={`XBlueSky-${id}`}
              component={Square}
              durationInFrames={DURATION_IN_FRAMES}
              fps={FPS}
              width={SQUARE.width}
              height={SQUARE.height}
              defaultProps={{ entry }}
            />
            {/*
             * fps=1 e 1 frame por slide: cada frame vira um still. Vale pras
             * duas peças estáticas — feed do Instagram e carrossel do Substack.
             */}
            <Composition
              id={`InstagramFeed-${id}`}
              component={InstagramFeed}
              durationInFrames={CAROUSEL_SLIDE_COUNT}
              fps={1}
              width={SQUARE.width}
              height={SQUARE.height}
              defaultProps={{ entry }}
            />
            <Composition
              id={`SubstackCarrossel-${id}`}
              component={SubstackCarrossel}
              durationInFrames={CAROUSEL_SLIDE_COUNT}
              fps={1}
              width={CAROUSEL.width}
              height={CAROUSEL.height}
              defaultProps={{ entry }}
            />
          </Folder>
        );
      })}
    </>
  );
};
