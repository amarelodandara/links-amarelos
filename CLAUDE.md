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

- Next.js 16.2.9, React 19 — App Router, TypeScript (strict)
- Tailwind CSS v4 (PostCSS plugin, `@import "tailwindcss"` in globals.css)
- `agentation` — agent utilities package

## TypeScript

Every file under `app/` is `.ts`/`.tsx`, checked with `strict`. There is no
`allowJs`, no `any`, no type assertion, and no `@ts-ignore` anywhere in the
app. Keep it that way — the patterns below cover everything this codebase
needed, so reach for one of them before reaching for an escape hatch.

- The 8 anti-slop rules that only match TypeScript syntax are live: the four
  assertion rules, the three `unknown` rules, and `no-unsafe-dictionary-type`.
  Any `as` needs a `SAFETY:` comment stating the checked invariant. Narrow, use
  a type predicate, or declare the type on the binding instead.
- A lookup table keyed by a union wants `satisfies Record<K, V>`, not a
  `Record<K, V>` annotation — the annotation discards the literal key evidence
  and trips `anti-slop/no-known-value-widening`. See `Button.tsx`.
- Canvas code: a hoisted `function frame()` does not see an `if (!ctx) return`
  narrowing from its enclosing scope. Bind through an explicitly typed const
  (`const ctx: CanvasRenderingContext2D = maybeCtx`). See `PixelTrail.tsx`,
  `YellowCircle.tsx`, `ExperimenteSection.tsx`.
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
- Physics/animation state with two distinct phases is a discriminated union,
  not one shape with optional fields. See the falling/resting circle split in
  `ExperimenteSection.tsx`.

`app/components/signature-data.ts` is generated. Edit the template in
`scripts/build-signature.mjs`, never the output.

## Important: Next.js version

This is Next.js 16 — may differ from training data. Read `node_modules/next/dist/docs/` before writing code that depends on Next.js internals. Heed deprecation notices.

## Architecture

App Router convention: all routes live under `app/`. Layout at `app/layout.js` wraps all pages with Geist fonts and a `<nav>` element. No dark mode — CSS variables fixed to light theme only.
