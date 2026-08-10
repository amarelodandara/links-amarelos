# Estúdio de Teasers

Ferramenta local que gera os assets de divulgação de cada edição: teasers em
vídeo pras redes sociais e o carrossel estático do Substack. Tudo via
[Remotion](https://remotion.dev). Sem relação de código com `linksamarelos.com`.

Plano completo: `plano-teaser-studio.md`.

## Estado atual

Bootstrap pronto (etapas 1 e 2 da ordem de construção). **A implementação dos
componentes visuais está pausada de propósito**, esperando a exploração no
Paper — ver [Próximo passo](#próximo-passo).

O que já funciona:

| | |
|---|---|
| Estrutura `/content` + `/outputs` | ✅ |
| Schema e validação do `edition.json` | ✅ |
| 3 compositions nas resoluções certas | ✅ (com placeholder no lugar do design) |
| Render de vídeo e de stills | ✅ testado ponta a ponta |
| MCP do Paper conectado | ✅ `.mcp.json` |
| Design real das peças | ⏸ aguardando Paper |
| `settings.json` (tokens/cores) | ⏸ nasce depois do Paper |
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
/src
  schema/edition.ts          # schema do edition.json
  settings.provisional.ts    # resoluções e duração — vira settings.json pós-Paper
  compositions/              # só o placeholder por enquanto
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
ou `hyperlinks`) decide tema e CTA final — não existe campo separado de tema.

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

1. Jogue as logos em `/brand` (ver `brand/README.md`).
2. Abra o arquivo no **Paper Desktop** — isso sobe o MCP sozinho na porta 29979.
   Confira com `/mcp` aqui dentro do Claude Code; deve listar `paper`.
3. Explore à vontade as direções visuais das 4 peças (Stories, Feed, Social,
   Carrossel), sem pressa e sem se preocupar com o que é implementável.
4. Quando estiver satisfeita, é só avisar: o HTML+CSS aprovado vem do Paper via
   MCP, o `settings.json` nasce dos tokens que sobraram do design, e aí os
   componentes Remotion são implementados de verdade.

`src/compositions/PreDesignPlaceholder.tsx` é andaime — existe só pra provar que
os dados e as imagens carregam nas proporções certas. Ele é descartado na etapa 5.
