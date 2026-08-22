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

- Next.js 16.2.9, React 19 — App Router, mid-migration from JavaScript to TypeScript
- Tailwind CSS v4 (PostCSS plugin, `@import "tailwindcss"` in globals.css)
- `agentation` — agent utilities package

## TypeScript migration (in progress)

`tsconfig.json` runs `strict` with `allowJs: true` and `checkJs: false`, so `.js`/`.jsx`
still build and are inferred from, but are not themselves type-checked. Convert files
one at a time; `.js` holding JSX becomes `.tsx`, not `.ts`.

Converted so far: `app/sitemap.ts`, `app/robots.ts`, the five `opengraph-image.ts`
routes, `app/components/signature-data.ts`, `app/lib/use-isomorphic-layout-effect.ts`.

Two things to know before converting more:

- Adding any `.ts` file activated the 8 anti-slop rules that are TypeScript-only:
  the four assertion rules, the three `unknown` rules, and `no-unsafe-dictionary-type`.
  Every `as` now needs a `SAFETY:` comment stating the checked invariant. Do not reach
  for `as` to clear a type error; narrow instead.
- `app/components/signature-data.ts` is generated. Edit the template in
  `scripts/build-signature.mjs`, never the output.

When the last file is converted, drop `allowJs`/`checkJs` from `tsconfig.json`.

## Important: Next.js version

This is Next.js 16 — may differ from training data. Read `node_modules/next/dist/docs/` before writing code that depends on Next.js internals. Heed deprecation notices.

## Architecture

App Router convention: all routes live under `app/`. Layout at `app/layout.js` wraps all pages with Geist fonts and a `<nav>` element. No dark mode — CSS variables fixed to light theme only.
