# Links Amarelos

Everything Links Amarelos puts out, from one repo: the website and the promo
pieces for each edition, built on the same brand and the same edition data.

```
apps/website      the website (Next.js)
apps/crayola      promo pieces per edition (Remotion)
packages/brand    palette and handle
packages/content  editions, links and their media
packages/config   shared tsconfig
```

## Getting started

Node 24, npm 11.

```bash
npm install
npm run dev:website # http://localhost:3000
npm run crayola     # Remotion studio
npm run typecheck && npm run lint
```

See `CLAUDE.md` for where things live and the TypeScript rules.
