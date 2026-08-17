/**
 * Tile de textura do fundo (mesmo desenho de brand/textures/bg-texture-soft*.svg,
 * que bate byte a byte com o asset usado no Paper). Inline como data URI porque
 * a publicDir do projeto é /content — /brand não é servido pro player.
 * A cor dos "+"/círculos vem do tema.
 */
const tileSvg = (color: string) => `<svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="none">
  <g opacity="0.2">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M24 19H23V23H19V24H23V28H24V24H28V23H24V19Z" fill="${color}"></path>
  </g>
  <g opacity="0.035">
    <g clip-path="url(#tileclip)">
      <path d="M0 12C0 18.6274 5.37258 24 12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0C5.37258 0 0 5.37258 0 12Z" fill="${color}"></path>
      <path d="M0 36C0 42.6274 5.37258 48 12 48C18.6274 48 24 42.6274 24 36C24 29.3726 18.6274 24 12 24C5.37258 24 0 29.3726 0 36Z" fill="${color}"></path>
      <path d="M24 36C24 42.6274 29.3726 48 36 48C42.6274 48 48 42.6274 48 36C48 29.3726 42.6274 24 36 24C29.3726 24 24 29.3726 24 36Z" fill="${color}"></path>
      <path d="M24 12C24 18.6274 29.3726 24 36 24C42.6274 24 48 18.6274 48 12C48 5.37258 42.6274 0 36 0C29.3726 0 24 5.37258 24 12Z" fill="${color}"></path>
    </g>
    <defs>
      <clipPath id="tileclip"><rect width="48" height="48" fill="white"></rect></clipPath>
    </defs>
  </g>
</svg>`;

export const textureDataUri = (color: string): string =>
  `data:image/svg+xml;utf8,${encodeURIComponent(tileSvg(color))}`;
