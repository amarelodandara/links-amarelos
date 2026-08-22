# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # start dev server (localhost:3000)
npm run build     # production build
npm run lint      # oxlint (anti-slop plugin) + eslint
npm run typecheck # tsc --noEmit
```

## Stack

- Next.js 16.2.9, React 19 — App Router, TypeScript (7 legacy .js/.jsx files left)
- Tailwind CSS v4 (PostCSS plugin, `@import "tailwindcss"` in globals.css)
- `agentation` — agent utilities package

## TypeScript migration (nearly complete)

`tsconfig.json` runs `strict` with `allowJs: true` and `checkJs: false`, so the
few remaining `.js`/`.jsx` files still build and are inferred from, but are not
themselves type-checked. `.js` holding JSX becomes `.tsx`, not `.ts`.

Seven files are left, and all of them are held back by uncommitted work rather
than by anything technical:

    app/page.js                          app/components/PageActions.jsx
    app/sobre/page.js                    app/components/Signature.jsx
    app/components/FloatingLink.jsx      app/components/icons/SpotifyIcon.jsx
                                         app/components/icons/SubstackIcon.jsx

Convert each once its in-progress edits are committed, then drop `allowJs` and
`checkJs` from `tsconfig.json`.

Patterns worth reusing when converting them:

- Adding a `.ts` file activated the 8 anti-slop rules that are TypeScript-only:
  the four assertion rules, the three `unknown` rules, and
  `no-unsafe-dictionary-type`. Every `as` needs a `SAFETY:` comment stating the
  checked invariant. Do not reach for `as` to clear a type error; narrow, use a
  type predicate, or declare the type on the binding.
- A lookup table keyed by a union wants `satisfies Record<K, V>`, not a
  `Record<K, V>` annotation — the annotation discards the literal key evidence
  and trips `anti-slop/no-known-value-widening`. See `Button.tsx`.
- Canvas code: a hoisted `function frame()` does not see a `if (!ctx) return`
  narrowing from its enclosing scope. Bind through an explicitly typed const
  (`const ctx: CanvasRenderingContext2D = maybeCtx`) rather than asserting.
  See `PixelTrail.tsx`, `YellowCircle.tsx`, `ExperimenteSection.tsx`.
- Timer handles: `useRef<ReturnType<typeof setTimeout> | undefined>(undefined)`.
  `useRef(null)` infers `RefObject<null>` and rejects every later assignment.
- State that is genuinely "not chosen yet" needs the null spelled out:
  `useState<boolean | null>(null)`, not `useState(null)`.
- CSS custom properties in an inline `style` need the object typed as
  `CSSProperties & Record<"--name", string>`. See `NavDrawer.tsx`.

`app/components/signature-data.ts` is generated. Edit the template in
`scripts/build-signature.mjs`, never the output.

## Important: Next.js version

This is Next.js 16 — may differ from training data. Read `node_modules/next/dist/docs/` before writing code that depends on Next.js internals. Heed deprecation notices.

## Architecture

App Router convention: all routes live under `app/`. Layout at `app/layout.js` wraps all pages with Geist fonts and a `<nav>` element. No dark mode — CSS variables fixed to light theme only.
