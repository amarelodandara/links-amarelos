import { Composition, Folder, Still } from "remotion";
import { editions } from "./editions.generated";
import { InstagramFeed } from "./compositions/InstagramFeed";
import { SubstackCarrossel } from "./compositions/SubstackCarrossel";
import { Square } from "./compositions/Square";
import { BEATS as CAIU_NA_REDE_BEATS, CAIU_NA_REDE, CaiuNaRede } from "./compositions/CaiuNaRede";
import { Stories } from "./compositions/Stories";
import { Anuncio, anuncioSchema } from "./compositions/Anuncio";
import { CASCADE_STORIES, CascadeStories, cascadeStoriesFrames } from "./compositions/portfolio/CascadeStories";
import { videoDurationInFrames } from "./compositions/scenes/ChantScene";
import {
  CAROUSEL,
  CAROUSEL_SLIDE_COUNT,
  SQUARE,
  FPS,
  STORIES,
  settings,
} from "./settings";

const CAIU_NA_REDE_LINK = {
  title: "onde dá pra conversar",
  description:
    "entenda quantas pessoas não votaram ou votaram em candidatos que podem ser nossos aliados",
  action: "visitar",
  image: "caiunarede/onde-da-pra-conversar.jpg",
  imagePosition: "6% 50%",
};

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
       * Anúncio "no ar agora!" (D0). As imagens vêm de /input, não de /content:
       * renderize com --public-dir=input e --props (ver a skill anuncio). Os
       * defaultProps são o exemplo do #10 que está no catálogo.
       */}
      <Folder name="anuncio">
        {(["feed", "stories"] as const).map((layout) => (
          <Still
            key={layout}
            id={layout === "feed" ? "AnuncioFeed" : "AnuncioStories"}
            component={Anuncio}
            schema={anuncioSchema}
            width={settings.formats.anuncio[layout].width}
            height={settings.formats.anuncio[layout].height}
            defaultProps={{
              layout,
              subtitle: "minha seleção de outubro: você sabe.",
              cover: "links+ondas-10/capa-episodio.png",
              ctas: ["substack", "spotify"],
            }}
          />
        ))}
      </Folder>

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
          link: CAIU_NA_REDE_LINK,
        }}
      />

      {/* Recortes do CaiuNaRede pro portfólio, só a animação, sem texto. */}
      <Folder name="portfolio">
        {/* Até o instante em que a janela do link abriria. Campo em 2×, pra
            renderizar com --scale=2. */}
        <Composition
          id="CaiuNaRedeCampo"
          component={CaiuNaRede}
          durationInFrames={Math.round(CAIU_NA_REDE_BEATS.card * FPS)}
          fps={FPS}
          width={CAIU_NA_REDE.width}
          height={CAIU_NA_REDE.height}
          defaultProps={{
            lema: "caiu na rede, é link!",
            link: CAIU_NA_REDE_LINK,
            fieldOnly: true,
            fieldResolution: 2,
          }}
        />
        <Composition
          id="CascadeStories"
          component={CascadeStories}
          durationInFrames={cascadeStoriesFrames}
          fps={FPS}
          width={CASCADE_STORIES.width}
          height={CASCADE_STORIES.height}
          defaultProps={{ link: CAIU_NA_REDE_LINK }}
        />
      </Folder>

      {editions.map((entry) => {
        const id = `${entry.edition.type}-${String(entry.edition.editionNumber).padStart(3, "0")}`;

        return (
          <Folder name={id} key={entry.dir}>
            <Composition
              id={`InstagramStories-${id}`}
              component={Stories}
              durationInFrames={videoDurationInFrames(entry.edition)}
              fps={FPS}
              width={STORIES.width}
              height={STORIES.height}
              defaultProps={{ entry }}
            />
            <Composition
              id={`XBlueSky-${id}`}
              component={Square}
              durationInFrames={videoDurationInFrames(entry.edition)}
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
