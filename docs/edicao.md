# Anatomia de um lançamento links + ondas

Um lançamento = edição da newsletter (links amarelos #N) + episódio do podcast
(ondas amarelas #N), mesmo número, mesmo dia. Termos em `glossario.md`.

Fontes: nota de processo `~/Documents/dandara/Notes/escrevendo uma issue da
newsletter.md`, nota `(Pitch) produzindo um episódio do podcast.md`, o rascunho
`~/Documents/dandara/Inbox/links amarelos 10.md` e os posts publicados no
Substack.

## Onde vive

- Substack: `amarelodandara.substack.com`, publicação "links amarelos", autoria
  "amarelo dandara". Feed: `amarelodandara.substack.com/feed`.
- Edição e episódio são **dois posts separados** no Substack, publicados no
  mesmo sábado com minutos de diferença: `/p/links-amarelos-N` e
  `/p/ondas-amarelas-N`.
- O podcast é hospedado no Substack e distribuído pro Spotify a partir de lá.
  Show no Spotify: `open.spotify.com/show/043Gs7eyY2KOlotEWSTSxB`.

## Ritmo

Mensal, lançamento no sábado. A descrição do show promete "último sábado de
cada mês", mas as datas reais variam (#7 04/abr, #8 30/mai, #9 22/ago,
#10 17/out de 2026).

## A edição (newsletter)

Nasce no vault do Obsidian (`~/Documents/dandara`), num arquivo
`links amarelos N.md`: em `Inbox/` enquanto está em produção, em `Notes/`
depois. Os links aparecem como wikilinks (`[[Watch Dogs 2]]`), cada um uma nota
do vault; viram hyperlinks inline no Substack, na pós-produção.

### O rascunho é a fonte antes do lançamento

O teaser sai na quinta (D-2), quando o post do Substack **ainda não existe**.
Qualquer peça feita antes de D0 lê o arquivo do Obsidian. Depois de D0 a
fonte passa a ser o feed do Substack (ver `ciclo.md`).

Como achar a URL de cada wikilink:

- A maioria aponta pra uma nota com frontmatter `url:` (às vezes `URL:`),
  `author:` (lista de wikilinks) e `tags: [link]`. Ex.: `Message to
  Scientology.md`, `Onde dá pra conversar..md`.
- **Sempre haverá links sem URL**: nota sem frontmatter (ex.: `Mr. Robot.md`,
  texto copiado da Wikipedia), nota de outro tipo (ex.: `Watch Dogs 2.md`, só
  com `cover:`), ou wikilink sem nota (ex.: `[[Projeto Chanology]]`). Nesses
  casos, liste os links sem URL e pergunte. Nunca invente nem chute uma URL.
- Wikilinks de pessoa (`[[Katie Edwards]]`, `[[Natália Silva]]`) são autoria,
  não link da edição.
- `![[nota#^bloco]]` é citação embutida (epígrafe), não link.
- `[[caminho/nota|apelido]]`: o texto que aparece é o apelido.
- Links em markdown comum (`[texto](https://…)`) já trazem a URL.

Processo: fechamento (segunda da semana de produção) → curadoria → escrita →
edição → pós-produção (imagens, créditos, conferência dos links) →
compartilhamento.

Estrutura fixa, de cima pra baixo:

| Parte | Formato | Exemplo (#10) |
|---|---|---|
| Título | `links amarelos #N` | links amarelos #10 |
| Subtítulo | `minha seleção de <mês>: <palavras de interesse>` | minha seleção de outubro: você sabe. |
| Introdução | texto fixo com uma piadinha situacional no meio | "Em tempos ideais eu, uma designer relutantemente desocupada, me sento com um lanchinho…" |
| CTA do podcast | texto fixo, link pro Spotify | "E as ondas amarelas são a oportunidade ouvir outra versão dessa conversa, corre lá…" |
| Teaser | `no mês de <mês> temos: item ✦ item ✦ …` (quantidade varia) | Anonymous ✦ Scientologia ✦ não temos heróis, não temos vilões ✦ o sistema inhackiável da democracia |
| Corpo | 3 blocos de argumento e recomendação, cada um com um título h3 em minúsculas; o terceiro amarra o tema | "não existe hack pra democracia" … |
| e digo mais | 1 ou 2 links fora do assunto, em lista | The Train Window Archive; o restaurante michelin do Rafa Pasquini |

### Guarda-corpo: o mês

O `<mês>` do subtítulo e do teaser é **o mês da seleção**, ou seja o mês a
que a edição pertence, mesmo quando ela sai em outra data. O subtítulo sempre
começa com "minha". Já houve deslize nos dois (#9 saiu em 22/ago como
"minha seleção de setembro"; #10 saiu sem o "minha"). Antes de gerar qualquer
coisa com mês, confirme qual é o mês da seleção e confira que título,
subtítulo e teaser concordam.

### Os itens do "temos" não são os itens das peças

A linha "no mês de … temos" (e o texto do post do episódio) não define o que
entra em peça nenhuma. Os itens de um teaser são escolhidos à parte; não
derive um do outro.

### Links no texto

Os links ficam no meio do texto, nunca numa lista à parte (exceto em "e digo
mais"). Tudo em minúsculas nos títulos. Há CTAs de inscrição espalhados, às
vezes com piada do momento ("o segundo botão mais fácil de apertar do momento…").

## O episódio (podcast)

- O texto da edição é a base da gravação: o episódio é "outra versão dessa
  conversa", não leitura literal.
- Todas as vozes são da Dandara. Às vezes há voice-overs, gravados à parte
  (as "Voz A / Voz B" da nota de processo são gravações, não pessoas).
- Gravado e editado no Audacity: limpeza, compressão, trilha com auto-duck, música
  na abertura e no encerramento. Arquivo final em mp3 (o #10 tem ~15 min).
- Post do Substack: título `ondas amarelas #N`, mesmo subtítulo da edição, o
  mesmo texto de abertura e teaser, e a descrição do show.

## Capas

- **Capa da edição**: horizontal (~2000×1050). Estrutura fixa feita no Figma;
  muda só a imagem, colada dentro de uma máscara.
- **Capa do episódio**: quadrada (2000×2000). Mesma estrutura fixa com
  `#N`, "ondas amarelas de links amarelos" e o selo "por amarelo dandara";
  muda só a imagem.
- Edição e episódio usam a mesma imagem.

## Divulgação hoje

| Quando | Peça | Onde | Como é feita |
|---|---|---|---|
| Quinta (D-2) | teaser com conteúdos escolhidos da edição | Instagram stories e feed | crayola |
| Sábado (D0) | anúncio "no ar agora!" (4:5, capa do episódio + título + leia/ouça) | Instagram | Paper, colando a capa num layout fixo |

## Depois do lançamento

As peças de D+ (trecho, citação, carrossel, fio de links, link do mês, e digo
mais) estão em `catalogo.md`, e o calendário em `ciclo.md`.
