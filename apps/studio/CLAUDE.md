# Crayola

Máquina de peças da marca **Links Amarelos**. Gera o que divulga cada edição
nas redes, no site e no Substack. Não tem interface: o trabalho roda por
skills (receitas) do Claude Code, que leem o conteúdo da edição e renderizam
as peças via Remotion.

## Regra inegociável: nenhum texto é escrito por IA

Todo texto que aparece numa peça ou num post vem da Dandara. Ou ela escreve
na hora de criar a peça, ou o texto sai literalmente da escrita dela (a
edição, o episódio). Nunca escreva, reescreva, resuma, parafraseie, "melhore"
ou complete texto por ela ou como ela: legenda, título, chamada, descrição,
fio, nada.

- Citação e trecho são cópia literal do texto ou da fala, sem edição.
- Pode apontar candidatos (frases, momentos) tirados literalmente do material
  pra ela escolher; a escolha é dela.
- Se uma peça precisa de um texto que não existe, pare e peça. Não deixe
  placeholder com sugestão de texto.

## Antes de gerar qualquer coisa

1. Leia `docs/glossario.md` e use os termos de lá: marca, segmento,
   edição/episódio, peça, template, formato, kit. Não troque um pelo outro.
2. Leia `docs/marca.md` pra saber o que é a marca e quais segmentos ela tem.
3. Não invente fatos sobre a marca. Se faltar algo, pergunte e depois
   registre a resposta em `docs/`, pra ninguém ter que explicar de novo.

## Skills de terceiros

`social` e `video` (em `.agents/skills/`, de coreyhaines31/marketingskills,
MIT) são referência de método: reaproveitamento, clipes, roteiro, calendário.
Elas leem `.agents/product-marketing.md`, que manda pra `docs/`. Em voz,
idioma e termos, `docs/` sempre vence os exemplos delas.

## Estilo

A fonte da verdade visual (cores, tipografia, logos) é o site, em
`~/Projects/links-amarelos`. O crayola segue o site; quando os dois
divergirem, quem vale é o site.

## Escopo atual

Só **links + ondas**. Hyperlinks existe no código, mas está fora de escopo até
segunda ordem: não gere nem altere nada dele.

## Motor

```bash
npm run sync          # valida /content e regenera o índice de edições
npm run render <CompositionId> outputs/<arquivo>
npm run render:all [<segmento>/<numero-slug>]   # kit completo de uma edição
npm run typecheck
```
