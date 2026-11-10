# Crayola

Receitas (skills do Claude Code) que geram a divulgação de cada edição de
Links Amarelos / Ondas Amarelas / Hyperlinks. Sem interface: o Claude lê o
conteúdo da edição, monta os arquivos e renderiza as peças via
[Remotion](https://remotion.dev).

Contexto da marca e vocabulário: `CLAUDE.md` e `docs/`.

## Motor

```bash
npm run render <CompositionId> outputs/<arquivo>
npm run render:all [<tipo>/<numero-slug>]   # pacote completo de uma edição
npx remotion studio   # só pra depurar timing, frame a frame
npm run typecheck
```

## Estrutura

```
packages/content/src/editions.ts                       # edições (no monorepo)
packages/content/assets/<id da edição>/                # imagens das tabs
/outputs                                               # saída, gitignored
/brand                                                 # logos e texturas
settings.json                                          # formatos, timing (cores: packages/brand)
/src/compositions                                      # peças Remotion
/scripts                                               # render, fetch-og, transcribe
```

Edições são TS tipado em `packages/content/src/editions.ts`. Uma edição com
`promo` vira peças: `kind: "tabs"` com exatamente 4 `tabs` (`author`, `image`)
ou `kind: "chant"` com as frases; `theme` opcional (hyperlinks); `airDate`
obrigatório. O typecheck recusa tab faltando ou sobrando; o `check-assets`
(roda antes de todo render) recusa imagem que não existe em
`packages/content/assets/<id>/`.
