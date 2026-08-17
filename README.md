# Estúdio de Teasers

Ferramenta local que gera os assets de divulgação de cada edição: teasers em
vídeo pras redes sociais e o carrossel estático do Substack. Tudo via
[Remotion](https://remotion.dev). Sem relação de código com `linksamarelos.com`.

Plano completo: `plano-teaser-studio.md`.

## Estado atual

Etapas 1–5 da ordem de construção prontas: o design aprovado no Paper virou
`settings.json` + componentes Remotion, e a composition `Stories` está
implementada com o visual final dos dois temas — ver
[Próximo passo](#próximo-passo).

O que já funciona:

| | |
|---|---|
| Estrutura `/content` + `/outputs` | ✅ |
| Schema e validação do `edition.json` | ✅ |
| 3 compositions nas resoluções certas | ✅ |
| Render de vídeo e de stills | ✅ testado ponta a ponta |
| MCP do Paper conectado | ✅ escopo de usuário |
| Design real das peças | ✅ aprovado no Paper (arquivo "Crayola") |
| `settings.json` (tokens/cores) | ✅ extraído do Paper via MCP |
| `Stories` com design final | ✅ abertura + 4 tabs + CTA, dois temas |
| `Feed` e `CarouselSlide` com design final | ⏸ etapas 6 e 7 (ainda placeholder) |
| Painel de edição dentro do Studio | ⏸ etapa 8 |

## Comandos

```bash
npm run studio        # preview com hot-reload e timeline (npx remotion studio)
npm run render Stories-links-ondas-042 outputs/stories.mp4
npm run render:all links-ondas/042-edicao-de-exemplo   # pacote completo
npm run render:all    # todas as edições
npm run sync          # revalida /content e regenera o índice de edições
npm run typecheck
```

`sync` roda sozinho antes de `studio` e de `render`.

## Estrutura

```
/content                     # entrada — versionado
  /links-ondas/042-.../
    edition.json
    /assets/01.png …04.png
  /hyperlinks/017-.../
/outputs                     # saída — gitignored, sobe manual pro Drive
/brand                       # logos de cada tema (ver brand/README.md)
settings.json                # config global: resoluções, timing, cores, tipografia
/src
  schema/edition.ts          # schema do edition.json
  settings.ts                # acesso tipado ao settings.json
  design/                    # tema, fundo dithered, textura, fontes, marcas SVG
  compositions/stories/      # Stories com o design final (abertura, tabs, CTA)
  editions.generated.ts      # gerado por npm run sync, não editar
/scripts
  sync-editions.mjs          # valida /content, gera o índice
  render-all.mjs             # render em lote
```

### Uma edição

`content/<type>/<numero>-<slug>/edition.json`:

```json
{
  "editionNumber": 42,
  "type": "links-ondas",
  "airDate": "2026-08-15",
  "tabs": [
    { "author": "Nome do Autor", "image": "assets/01.png" }
  ]
}
```

Sempre exatamente 4 tabs, cada uma só com o nome do autor. `type` (`links-ondas`
ou `hyperlinks`) decide o tema visual e o CTA final. Edições `hyperlinks` podem
ter um campo opcional `"theme"` — o texto que aparece como `{tema aqui}` na
abertura (parâmetro que emergiu do design no Paper).

A validação recusa rodar se faltar tab, faltar autor, ou se alguma imagem
apontada não existir no disco.

Hoje o `edition.json` é editado à mão; o form de criação é a etapa 8 do plano e
vai viver como painel dentro do próprio Remotion Studio.

## Compositions

| Composition | Formato | Serve |
|---|---|---|
| `Stories-<tipo>-<num>` | 1080×1920, 8s | Instagram Stories, Twitter/X, BlueSky |
| `Feed-<tipo>-<num>` | 1080×1350, 8s | Instagram feed (4:5) |
| `CarouselSlide-<tipo>-<num>` | 1456×1040, 6 stills | carrossel do Substack (14:10) |

Uma composition vertical só cobre Stories + Twitter + BlueSky: as três aceitam
9:16 nativo, sem crop nem barra preta. O carrossel sai como 6 PNGs numerados
(`--sequence`), não como recorte do vídeo.

## Próximo passo

1. Revisar o `Stories` no Studio (`npm run studio`) — timing das cenas e
   entradas são ajustáveis em `settings.json` (`timing`) e nas cenas em
   `src/compositions/stories/`.
2. Etapa 6: adaptar o layout aprovado pro `Feed` (4:5).
3. Etapa 7: `CarouselSlide` (6 stills, 14:10 horizontal) — o Paper ainda não
   tem artboards desse formato; explorar lá primeiro se quiser layout próprio.
4. Etapa 8: form de criação como painel dentro do Remotion Studio.

`src/compositions/PreDesignPlaceholder.tsx` segue vivo só como andaime do
`Feed` e do `CarouselSlide`; morre nas etapas 6 e 7.

O fundo usa um shader WebGL (`@paper-design/shaders-react`, o mesmo do Paper);
o render headless precisa do OpenGL "angle", já configurado em
`remotion.config.ts`.
