# Estúdio de Teasers

Ferramenta local que gera os assets de divulgação de cada edição: teasers em
vídeo pras redes sociais e o carrossel estático do Substack. Tudo via
[Remotion](https://remotion.dev). Sem relação de código com `linksamarelos.com`.

Plano completo: `plano-teaser-studio.md`.

## Estado atual

Etapas 1–5 e 8 da ordem de construção prontas: o design aprovado no Paper virou
`settings.json` + componentes Remotion, a composition `Stories` está
implementada com o visual final dos dois temas, e o fluxo de trabalho já é o app
de 3 colunas — ver [O app](#o-app-input--preview--export) e
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
| Form de criação | ✅ etapa 8 — no app e no Studio |
| App de 3 colunas (input → preview → export) | ✅ `npm run app` |
| `Feed` e `CarouselSlide` com design final | ⏸ etapas 6 e 7 (ainda placeholder) |

## Comandos

```bash
npm run app           # o fluxo em 3 colunas: input → preview → export
npm run studio        # Studio + watch de /content (timeline, scrubbing, debug)
npm run render Stories-links-ondas-042 outputs/stories.mp4
npm run render:all links-ondas/042-edicao-de-exemplo   # pacote completo
npm run render:all    # todas as edições
npm run sync          # revalida /content e regenera o índice de edições
npm run watch         # só o watch, sem o Studio
npm run typecheck
```

`sync` roda sozinho antes de `app`, `studio` e `render`. Tanto o `app` quanto o
`studio` sobem vários processos sob um supervisor pequeno
(`scripts/app.mjs`, `scripts/studio.mjs`), pra que Ctrl-C derrube todos.

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
/app                         # o app de 3 colunas (input → preview → export)
vite.config.ts               # serve /app; /api e /content vão pro servidor local
/src
  schema/edition.ts          # schema do edition.json
  settings.ts                # acesso tipado ao settings.json
  design/                    # tema, fundo dithered, textura, fontes, marcas SVG
  compositions/stories/      # Stories com o design final (abertura, tabs, CTA)
  editor/                    # EditionForm (compartilhado) + a composition Editor
  editions.generated.ts      # gerado por npm run sync, não editar
/scripts
  lib/editions.mjs           # varredura e validação de /content (compartilhada)
  sync-editions.mjs          # valida /content, gera o índice — falha se inválido
  watch-editions.mjs         # regenera o índice a cada mudança em /content
  server.mjs                 # servidor local do app: grava arquivos, dispara render
  app.mjs                    # sobe servidor + watch + Vite
  studio.mjs                 # sobe watch + Studio juntos
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

Dá pra editar esse arquivo à mão, mas o caminho normal é o app.

## O app: input → preview → export

`npm run app` e abra `http://localhost:3020`. São três colunas, uma por passo:

1. **Input** — o form da edição: tipo, número, nome, data, tema (só Hyperlinks)
   e as 4 tabs com nome do autor e imagem. Grava o `edition.json` e copia as
   imagens pra `/assets`.
2. **Preview** — o mesmo componente que o render usa, então é WYSIWYG de
   verdade. Alterna entre Stories, Feed e Carrossel; o carrossel navega slide a
   slide. Sem timeline.
3. **Export** — renderiza o pacote completo em `/outputs`, com barra de
   progresso por peça. Os checkboxes servem pra não esperar o render de uma peça
   que você não vai usar naquela rodada.

Por dentro: o app sobe três processos (`scripts/app.mjs`) — o servidor local
que grava arquivos e dispara renders, o watch de `/content`, e o Vite da
interface. O export chama a mesma CLI do `npm run render`, então o arquivo que
sai do app é igual ao da linha de comando.

O Remotion Studio continua valendo (`npm run studio`) pra quando algo estiver
estranho no meio do vídeo: é o único lugar com timeline e scrubbing frame a
frame. A composition `Editor` de lá hospeda o mesmo form do app.

Detalhes que valem saber:

- **A pasta sai do número + nome** (`042-nome-da-edicao`) e é definida na
  criação. Editando uma edição que já existe, o nome aparece só como referência:
  trocar número ou nome ali mexe apenas no conteúdo do `edition.json`, a pasta
  fica com o slug original. (Renomear pasta é possível — o servidor do app pode
  mover arquivo — mas ainda não está implementado.)
- **As imagens vão antes do `edition.json`**, de propósito — o watch revalida a
  cada gravação, e um `edition.json` apontando pra imagem que ainda não existe
  apareceria como edição inválida no meio do caminho.
- **As pendências só aparecem depois da primeira tentativa de gravar**, pra que
  um form em branco não abra com uma parede de erros.
- Trocar a extensão da imagem de uma tab (png → jpg) apaga o arquivo antigo, pra
  não deixar órfão em `/assets`.
- O Editor é ferramenta, não peça de saída: o `render:all` percorre as edições
  por id, então ele nunca entra no pacote renderizado.

A edição interativa do canvas do Studio (arrastar elemento no preview e gravar o
CSS de volta no fonte) está **desligada** em `remotion.config.ts` — um arrasto
acidental injetava estilo no fonte, tanto no form quanto nas peças de vídeo. Se
quiser esse comportamento de volta, é `Config.setInteractivityEnabled(true)`.

## Compositions

| Composition | Formato | Serve |
|---|---|---|
| `Editor` | 1000×1400 | ferramenta: form das edições, não renderiza saída |
| `Stories-<tipo>-<num>` | 1080×1920, 8s | Instagram Stories, Twitter/X, BlueSky |
| `Feed-<tipo>-<num>` | 1080×1350, 8s | Instagram feed (4:5) |
| `CarouselSlide-<tipo>-<num>` | 1456×1040, 6 stills | carrossel do Substack (14:10) |

Uma composition vertical só cobre Stories + Twitter + BlueSky: as três aceitam
9:16 nativo, sem crop nem barra preta. O carrossel sai como 6 PNGs numerados
(`--sequence`), não como recorte do vídeo — os arquivos saem como
`carrossel/element-0.png` … `element-5.png`, na ordem capa, 4 tabs, CTA.

## Próximo passo

1. Revisar o `Stories` no Studio (`npm run studio`) — timing das cenas e
   entradas são ajustáveis em `settings.json` (`timing`) e nas cenas em
   `src/compositions/stories/`.
2. Rodar uma edição de verdade pelo `Editor`, pra ver se falta algum campo.
3. Etapa 6: adaptar o layout aprovado pro `Feed` (4:5).
4. Etapa 7: `CarouselSlide` (6 stills, 14:10 horizontal) — o Paper ainda não
   tem artboards desse formato; explorar lá primeiro se quiser layout próprio.

`src/compositions/PreDesignPlaceholder.tsx` segue vivo só como andaime do
`Feed` e do `CarouselSlide`; morre nas etapas 6 e 7.

O fundo usa um shader WebGL (`@paper-design/shaders-react`, o mesmo do Paper);
o render headless precisa do OpenGL "angle", já configurado em
`remotion.config.ts`.

O Studio avisa que o Remotion 4.0.507 espera `zod` 4.4.3 e o projeto tem 3.25.76.
É só aviso — nada aqui usa `@remotion/zod-types`. Só vale resolver (`npx remotion
add zod`) se um dia quiser o form automático de schema do Studio, que depende
dele.
