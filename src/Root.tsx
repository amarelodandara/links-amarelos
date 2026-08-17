import { Composition, Folder } from "remotion";
import { editions } from "./editions.generated";
import { PreDesignPlaceholder } from "./compositions/PreDesignPlaceholder";
import { Stories } from "./compositions/stories/Stories";
import {
  CAROUSEL,
  CAROUSEL_SLIDE_COUNT,
  DURATION_IN_FRAMES,
  FEED,
  FPS,
  STORIES,
} from "./settings";

/**
 * Uma pasta por edição no seletor lateral do Studio, com as três compositions
 * de saída dentro (seção 4). `Stories` cobre Instagram Stories + Twitter +
 * BlueSky; `Feed` cobre o 4:5 do Instagram; `CarouselSlide` sai como stills.
 *
 * `Stories` já usa o design final do Paper; `Feed` e `CarouselSlide` ainda são
 * placeholder (etapas 6 e 7 da ordem de construção).
 */
export const RemotionRoot: React.FC = () => {
  return (
    <>
      {editions.map((entry) => {
        const id = `${entry.edition.type}-${String(entry.edition.editionNumber).padStart(3, "0")}`;

        return (
          <Folder name={id} key={entry.dir}>
            <Composition
              id={`Stories-${id}`}
              component={Stories}
              durationInFrames={DURATION_IN_FRAMES}
              fps={FPS}
              width={STORIES.width}
              height={STORIES.height}
              defaultProps={{ entry }}
            />
            <Composition
              id={`Feed-${id}`}
              component={PreDesignPlaceholder}
              durationInFrames={DURATION_IN_FRAMES}
              fps={FPS}
              width={FEED.width}
              height={FEED.height}
              defaultProps={{ entry, label: "Instagram Feed" }}
            />
            {/* fps=1 e 1 frame por slide: cada frame vira um still do carrossel. */}
            <Composition
              id={`CarouselSlide-${id}`}
              component={PreDesignPlaceholder}
              durationInFrames={CAROUSEL_SLIDE_COUNT}
              fps={1}
              width={CAROUSEL.width}
              height={CAROUSEL.height}
              defaultProps={{ entry, label: "Carrossel Substack" }}
            />
          </Folder>
        );
      })}
    </>
  );
};
