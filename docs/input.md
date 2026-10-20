# A pasta input

Tudo que as skills precisam pra gerar o kit de um lançamento fica numa pasta
só, dentro do repo. A Dandara monta a pasta assim que a edição está escrita;
as skills leem só dela e nunca andam pelo vault do Obsidian.

Isso deixa o kit inteiro gerável antes de D0: as peças ficam prontas e
agendadas, e no sábado de manhã não há nada pra decidir.

## Onde e como se chama

```
input/links+ondas-N/
```

`N` é o número do lançamento, sem zeros à esquerda (`links+ondas-10`). O nome
usa `-` no lugar de `#` porque `#` quebra caminho de arquivo em URL (o
Remotion carrega assets por URL).

## O que vai dentro

Cada arquivo entra na lista quando uma peça passa a precisar dele.

| Arquivo | O que é | Quem coloca |
|---|---|---|
| `links amarelos N.md` | cópia do rascunho da edição, como está no Obsidian | Dandara |
| `capa-episodio.png` | capa do episódio, 2000×2000, exportada do Figma | Dandara |

## O que cada peça tira dela

### anúncio

| Dado | De onde sai | Regra |
|---|---|---|
| `#N` | nome da pasta | — |
| segunda linha | primeira linha do rascunho depois do frontmatter | cópia literal; tem que começar com `minha seleção de`, senão a skill para e pede pra Dandara acrescentar no rascunho |
| mês | o `<mês>` da segunda linha | a skill mostra e pede confirmação de que é o mês da seleção (ver `edicao.md`) |
| capa | `capa-episodio.png` | — |
| CTAs | perguntado na hora: Substack, Spotify, YouTube (um ou mais) | não é arquivo |
