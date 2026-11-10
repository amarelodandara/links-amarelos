# Crayola

Receitas (skills do Claude Code) que geram a divulgação de cada edição de
Links Amarelos / Ondas Amarelas / Hyperlinks. Sem interface: o Claude lê o
conteúdo da edição, monta os arquivos e renderiza as peças via
[Remotion](https://remotion.dev).

Contexto da marca e vocabulário: `CLAUDE.md` e `docs/`.

## Motor

```bash
npm run sync          # valida /content e regenera o índice de edições
npm run render <CompositionId> outputs/<arquivo>
npm run render:all [<tipo>/<numero-slug>]   # pacote completo de uma edição
npx remotion studio   # só pra depurar timing, frame a frame
npm run typecheck
```

## Estrutura

```
/content/<tipo>/<numero-slug>/edition.json + /assets   # entrada, versionado
/outputs                                               # saída, gitignored
/brand                                                 # logos e texturas
settings.json                                          # formatos, timing (cores: packages/brand)
/src/compositions                                      # peças Remotion
/scripts                                               # sync, render, fetch-og
```

`edition.json`: `editionNumber`, `type` (`links-ondas` | `hyperlinks`),
`airDate`, 4 `tabs` com `author` e `image`; `theme` opcional em `hyperlinks`.
A validação recusa rodar se faltar tab, autor ou imagem no disco.
