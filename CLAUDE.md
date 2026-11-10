# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Monorepo

npm workspaces + Turborepo. One brand, one set of editions, every output
reads them from the same packages.

```
apps/website      @links/website  Next.js website (linksamarelos)
apps/crayola      @links/crayola  Remotion promo pieces — see apps/crayola/CLAUDE.md
packages/brand    @links/brand    palette + handle; generates tokens.css for CSS consumers
packages/content  @links/content  EDITIONS, LINKS, their types, and edition media (assets/)
packages/config   @links/config   tsconfig.base.json every workspace extends
```

Packages ship TypeScript source, no build step. The website lists them in
`transpilePackages`; Remotion bundles them as-is; Node 24 runs package
scripts (`*.ts`) directly. Imports inside packages use explicit `.ts`
extensions so those scripts resolve.

## Commands

```bash
npm run dev:website # website dev server (localhost:3000)
npm run crayola     # Remotion studio, for debugging timing frame by frame
npm run build       # turbo: production builds
npm run lint        # oxlint (anti-slop plugin, all workspaces) + eslint (website)
npm run typecheck   # turbo: tsc in every workspace + content's check-assets
npm run render -- <CompositionId> outputs/<file>     # paths relative to apps/crayola
npm run render:all -- [links-ondas/<number-slug>]    # an edition's full kit
npm run tokens -w @links/brand                       # after changing a color
```

## Where things live

- **A color**: `packages/brand/src/colors.ts`, then `npm run tokens -w @links/brand`
  and commit the regenerated `packages/brand/tokens.css`. The website imports
  it in `globals.css`; crayola reads `colors` through `settings.ts`.
- **An edition**: append to `packages/content/src/editions.ts`. If it gets a
  promo kit, put its tab images in `packages/content/assets/<edition id>/`.
  Types enforce four tabs or a chant and an air date; `check-assets` enforces
  that every image exists.
- **A link**: `packages/content/src/links.ts`.
- **Video-only settings** (formats, timing, dithering, layouts):
  `apps/crayola/settings.json`.

## TypeScript

Every workspace is `.ts`/`.tsx`, checked with `strict` from the shared base.
There is no `allowJs`, no `any`, no type assertion, and no `@ts-ignore`. Keep
it that way — the patterns below cover everything this codebase needed, so
reach for one of them before reaching for an escape hatch. Paths below are
under `apps/website/app/` unless stated.

- The 8 anti-slop rules that only match TypeScript syntax are live: the four
  assertion rules, the three `unknown` rules, and `no-unsafe-dictionary-type`.
  Any `as` needs a `SAFETY:` comment stating the checked invariant. Narrow, use
  a type predicate, or declare the type on the binding instead.
- A lookup table keyed by a union wants `satisfies Record<K, V>`, not a
  `Record<K, V>` annotation — the annotation discards the literal key evidence
  and trips `anti-slop/no-known-value-widening`. See `components/Button.tsx`.
- A list other modules read generically (like `EDITIONS`) is the opposite
  case: annotate it (`readonly Edition[]`), or consumers lose optional fields
  the narrowed literal type leaves out.
- Canvas code: a hoisted `function frame()` does not see an `if (!ctx) return`
  narrowing from its enclosing scope. Bind through an explicitly typed const
  (`const ctx: CanvasRenderingContext2D = maybeCtx`). See `PixelTrail.tsx`,
  `YellowCircle.tsx`.
- Timer handles: `useRef<ReturnType<typeof setTimeout> | undefined>(undefined)`.
  `useRef(null)` infers `RefObject<null>` and rejects every later assignment.
  For `requestAnimationFrame` ids, idle at `0` — `cancelAnimationFrame(0)` is a
  defined no-op.
- State that is genuinely "not chosen yet" needs the null spelled out:
  `useState<boolean | null>(null)`, not `useState(null)`.
- CSS custom properties in an inline `style` need the object typed as
  `CSSProperties & Record<"--name", string>`. See `NavDrawer.tsx`.
- DOM walking: narrow with `instanceof HTMLElement` / `HTMLAnchorElement`
  rather than `nodeType` or `nodeName` comparisons, which do not narrow. A
  `catch` binding is `unknown`; `error instanceof Error && error.name === ...`
  covers DOMException too. See `PageActions.tsx`.
- State with distinct phases is a discriminated union, not one shape with
  optional fields. See the falling/sliding/resting/sinking link bodies in
  `components/taste/field.ts`, and `Promo` (tabs | chant) in
  `packages/content/src/types.ts`.
- Runtime `typeof` checks are banned (`anti-slop/no-runtime-typeof`), so data
  lives in typed TS modules, not in JSON that would need decoding. See
  `packages/content/src/editions.ts`.

Two allowed exceptions, both in crayola:
- **zod** only for Remotion composition props (`anuncioSchema`,
  `destaqueSchema`, the dithering enums in `settings.ts`): Remotion's studio
  props panel needs a zod schema. Never for edition or link data.
- **`settings.json`**: imported statically (`resolveJsonModule`), so it is
  typed, never decoded at runtime.

`apps/website/app/components/signature-data.ts` is frozen data, not build
output — nothing regenerates it. Its header explains where it came from.

## Website: Next.js version

This is Next.js 16 — may differ from training data. Read
`node_modules/next/dist/docs/` before writing code that depends on Next.js
internals. Heed deprecation notices.

App Router: all routes live under `apps/website/app/`. `app/layout.tsx` wraps
every page with the fonts and the nav. No dark mode — the palette is fixed to
the light theme.
