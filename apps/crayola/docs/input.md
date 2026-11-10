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
| `ondas-amarelas-N.mp3` | áudio final do episódio (export do Audacity) | Dandara |

## Normalização dos nomes

A Dandara joga os arquivos na pasta com o nome que vierem. Toda skill, antes
de ler a pasta, normaliza os nomes pros da tabela acima:

| Se o arquivo é… | Vira |
|---|---|
| `.md` com o texto da edição (subtítulo `minha seleção de …`, os blocos h3) | `links amarelos N.md` |
| imagem quadrada (`.png`, `.jpg`, `.webp`) | `capa-episodio.png` (converte com `sips -s format png` se não for PNG) |
| áudio (`.mp3`, `.wav`, `.m4a`) | `ondas-amarelas-N.mp3` (converte com `npx remotion ffmpeg` se não for MP3) |

- Renomeie só quando a identificação não deixar dúvida. Se houver dois
  candidatos pro mesmo papel (duas imagens quadradas, dois áudios), ou um
  arquivo que não se encaixa em nenhum, pergunte.
- Arquivo já com o nome certo fica como está.
- Diga o que foi renomeado ou convertido (`antes → depois`).
- Normalizar não é editar: o conteúdo dos arquivos não muda.

## O que cada peça tira dela

### anúncio

| Dado | De onde sai | Regra |
|---|---|---|
| `#N` | nome da pasta | — |
| segunda linha | primeira linha do rascunho depois do frontmatter | cópia literal; tem que começar com `minha seleção de`, senão a skill para e pede pra Dandara acrescentar no rascunho |
| mês | o `<mês>` da segunda linha | a skill mostra e pede confirmação de que é o mês da seleção (ver `edicao.md`) |
| capa | `capa-episodio.png` | — |
| CTAs | perguntado na hora: Substack, Spotify, YouTube (um ou mais) | não é arquivo |

### destaque

| Dado | De onde sai | Regra |
|---|---|---|
| trechos | início e fim de cada destaque, passados pela Dandara na hora | o agente não procura nem sugere trechos |
| áudio do trecho | `ondas-amarelas-N.mp3`, recortado nos tempos dados | — |
| legenda | transcrição do trecho, com o tempo de cada palavra | é o que foi falado, palavra por palavra; nunca resumida |
| grafia | `links amarelos N.md` | nomes, títulos e termos são conferidos no rascunho pra escrever certo; a fala continua mandando no conteúdo |
| revisão | Dandara | nada é renderizado antes de ela aprovar a legenda |
