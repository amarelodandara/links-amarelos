# Glossário

O vocabulário do projeto. Docs, skills, código e conversa usam só estes termos,
sempre neste sentido.

## Do lado da marca

**Marca**: Links Amarelos. O guarda-chuva que reúne todos os segmentos. O
site é linksamarelos.com.

**Segmento**: cada linha dentro da marca.
- `links`: a newsletter **links amarelos**.
- `ondas`: o podcast **ondas amarelas**.
- `hyperlinks`: publicação de ensaios. Segmento futuro, ainda não documentado.

**links + ondas**: apelido do par. A newsletter e o podcast compartilham o
mesmo conteúdo e saem juntos, por isso costumam ser tratados como um só.

**Edição / episódio**: um lançamento numerado. Edição é o nome do lado da
newsletter, episódio do lado do podcast. Em links + ondas os dois são um
lançamento só, com o mesmo número.

O site (`links-amarelos/app/data/links.ts`) modela o par como uma "series" com
duas "media". Aqui o modelo é o deste glossário; o do site é só detalhe de
implementação de lá.

## Do lado do crayola

**Peça**: um asset que o crayola produz. Exemplos: o vídeo de stories, o
carrossel do Substack, um post.

**Template**: o design reutilizável por trás de uma peça. Exemplo: CaiuNaRede.

**Formato**: a especificação de tela de uma plataforma, ou seja tamanho,
duração e se é still ou vídeo.

**Kit**: todas as peças feitas para um lançamento.

**Átomo**: um trecho do conteúdo que se sustenta sozinho e pode virar peça
(capa, bloco, citação, link, trecho do episódio, e digo mais). Lista completa
em `catalogo.md`.

## Evite

- "Conteúdo" para falar de uma peça do crayola. Conteúdo é o que a marca
  publica; peça é o que o crayola gera pra divulgar.
- "Publicação" ou "tipo" no lugar de segmento. O código ainda usa `type`
  (`links-ondas` | `hyperlinks`); vale como segmento, e o nome vai ser
  alinhado depois.
- Confundir a marca com a newsletter. As duas se chamam links amarelos; quando
  o contexto não deixar claro, diga "a marca" ou "a newsletter".
