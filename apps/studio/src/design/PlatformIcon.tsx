import { settings } from "../settings";

export type Platform = "substack" | "spotify" | "youtube";

/** Ordem fixa dos CTAs: ler, ouvir, assistir. */
export const PLATFORM_ORDER: readonly Platform[] = ["substack", "spotify", "youtube"];

const c = settings.colors;

/**
 * Ícones das plataformas. Substack e Spotify são cópia dos SVGs do site
 * (`links-amarelos/app/components/icons`); o site ainda não tem YouTube.
 * Os tamanhos são os do Paper, equilibrados no olho, não na caixa.
 */
export const PlatformIcon: React.FC<{ platform: Platform }> = ({ platform }) => {
  switch (platform) {
    case "substack":
      return (
        <svg width={50} height={57} viewBox="0 0 448 511.471" fillRule="evenodd" style={{ flexShrink: 0 }}>
          <path
            fill={c.substack}
            d="M0 0h448v62.804H0V0zm0 229.083h448v282.388L223.954 385.808 0 511.471V229.083zm0-114.542h448v62.804H0v-62.804z"
          />
        </svg>
      );
    case "spotify":
      return (
        <svg width={57} height={57} viewBox="0 0 64 64" fillRule="evenodd" style={{ flexShrink: 0 }}>
          <path
            fill={c.spotify}
            d="M32 0C14.3 0 0 14.337 0 32c0 17.7 14.337 32 32 32 17.7 0 32-14.337 32-32S49.663 0 32 0zm14.68 46.184c-.573.956-1.797 1.223-2.753.65-7.532-4.588-16.975-5.62-28.14-3.097-1.07.23-2.14-.42-2.37-1.49s.42-2.14 1.49-2.37c12.196-2.79 22.67-1.606 31.082 3.556a2 2 0 0 1 .688 2.753zm3.9-8.717c-.726 1.185-2.256 1.53-3.44.84-8.602-5.276-21.716-6.805-31.885-3.747-1.338.382-2.714-.344-3.097-1.644-.382-1.338.344-2.714 1.682-3.097 11.622-3.517 26.074-1.835 35.976 4.244 1.147.688 1.49 2.217.765 3.403zm.344-9.1c-10.323-6.117-27.336-6.69-37.2-3.708-1.568.497-3.25-.42-3.747-1.988s.42-3.25 1.988-3.747c11.317-3.44 30.127-2.753 41.98 4.282 1.415.84 1.873 2.676 1.032 4.09-.765 1.453-2.638 1.912-4.053 1.07z"
          />
        </svg>
      );
    case "youtube":
      return (
        <svg width={66} height={47} viewBox="0 0 28 20" style={{ flexShrink: 0 }}>
          <path
            fill={c.youtube}
            d="M27.41 3.12A3.5 3.5 0 0 0 24.94.65C22.76.06 14 .06 14 .06s-8.76 0-10.94.59A3.5 3.5 0 0 0 .59 3.12C0 5.31 0 10 0 10s0 4.69.59 6.88a3.5 3.5 0 0 0 2.47 2.47c2.18.59 10.94.59 10.94.59s8.76 0 10.94-.59a3.5 3.5 0 0 0 2.47-2.47C28 14.69 28 10 28 10s0-4.69-.59-6.88z"
          />
          <path fill="#FFFFFF" d="M11.2 14.29 18.48 10 11.2 5.71z" />
        </svg>
      );
  }
};
