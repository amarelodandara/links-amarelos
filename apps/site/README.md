# Links Amarelos

Personal website for Links Amarelos — showcasing curation work, releases, and ways to support the project.

## Stack

- **Next.js 16** (App Router) · React 19 · TypeScript (strict)
- **Tailwind CSS v4** via PostCSS; palette from `@links/brand`
- **three** for the WebGL taste section; links and editions from `@links/content`
- **react-type-animation** for text animations

## Getting started

Part of the links-amarelos monorepo. From the repo root:

```bash
npm install
npm run dev:site  # http://localhost:3000
```

## Commands

```bash
npm run dev       # development server with hot reload
npm run build     # production build
npm run start     # serve production build locally
npm run lint      # run ESLint
```

## Project structure

```
app/
├── layout.tsx          # root layout — Geist fonts, nav
├── page.tsx            # home page
├── sobre/              # about page
├── realizacoes/        # releases / achievements page
├── apoio/              # support page
└── components/
    ├── taste/          # WebGL taste section
    └── icons/
```

## Contributing

1. Fork the repo and create a branch from `main`
2. Run `npm run dev:site` and confirm your changes work locally
3. Run `npm run typecheck && npm run lint` — fix any errors before opening a PR
4. Open a pull request with a clear description of what changed and why

No test suite — keep PRs focused and small.
