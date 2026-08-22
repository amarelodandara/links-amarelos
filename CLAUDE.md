# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # start dev server (localhost:3000)
npm run build    # production build
npm run lint     # oxlint (anti-slop plugin) + eslint
```

## Stack

- Next.js 16.2.9, React 19 — App Router, JavaScript (no TypeScript)
- Tailwind CSS v4 (PostCSS plugin, `@import "tailwindcss"` in globals.css)
- `agentation` — agent utilities package

## Important: Next.js version

This is Next.js 16 — may differ from training data. Read `node_modules/next/dist/docs/` before writing code that depends on Next.js internals. Heed deprecation notices.

## Architecture

App Router convention: all routes live under `app/`. Layout at `app/layout.js` wraps all pages with Geist fonts and a `<nav>` element. No dark mode — CSS variables fixed to light theme only.
