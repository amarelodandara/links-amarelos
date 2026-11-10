# Links Amarelos

Personal website for Links Amarelos — showcasing curation work, releases, and ways to support the project.

## Stack

- **Next.js 16** (App Router) · React 19 · JavaScript
- **Tailwind CSS v4** via PostCSS
- **matter-js** for physics-based UI interactions
- **react-type-animation** for text animations

## Getting started

```bash
npm install
npm run dev       # http://localhost:3000
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
├── layout.js           # root layout — Geist fonts, nav
├── page.js             # home page
├── sobre/              # about page
├── realizacoes/        # releases / achievements page
├── apoio/              # support page
└── components/
    ├── CurationAnimation/  # multi-stage scroll-driven animation
    └── icons/
```

## Contributing

1. Fork the repo and create a branch from `main`
2. Run `npm run dev` and confirm your changes work locally
3. Run `npm run lint` — fix any errors before opening a PR
4. Open a pull request with a clear description of what changed and why

No TypeScript, no test suite — keep PRs focused and small.
