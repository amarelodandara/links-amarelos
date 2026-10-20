---
name: anuncio
description: Gera o anúncio "no ar agora!" (D0) de um lançamento links + ondas — still 4:5 pro feed e 9:16 pros stories — a partir de input/links+ondas-N/, e diz onde postar cada um, quando e com que cuidados. Use quando a Dandara pedir o anúncio, "no ar agora", a peça de D0 ou o kit de lançamento do #N.
---

# anúncio ("no ar agora!")

Peça de D0: avisa que a edição e o episódio saíram. Roda assim que a edição
está escrita, bem antes de D0, pra tudo ficar agendado.

Antes de começar, leia `docs/glossario.md`, a seção **anúncio** de
`docs/catalogo.md` e `docs/input.md`.

## Regra de texto

O único texto variável da peça é o subtítulo da edição, copiado literalmente
do rascunho. Nunca escreva, ajuste ou complete o subtítulo, nem legenda de
post. Se algo estiver errado, pare e peça pra Dandara corrigir no rascunho.

## Passos

### 1. Lançamento e pasta

Descubra `N` (pelo pedido ou perguntando). A pasta é `input/links+ondas-N/`.
Ela precisa ter:

| Arquivo | Checagem |
|---|---|
| `links amarelos N.md` | existe |
| `capa-episodio.png` | existe e tem 2000×2000 (`sips -g pixelWidth -g pixelHeight`) |

Se faltar algo, liste o que falta e pare. Não procure no vault do Obsidian.

### 2. Subtítulo

É a primeira linha não vazia do rascunho depois do frontmatter (`---` … `---`).

- Tem que começar com `minha seleção de `. Se não começar (ou não existir),
  pare: mostre a linha encontrada e peça pra Dandara colocar o subtítulo no
  rascunho. Não corrija.
- Mostre o subtítulo e o mês que está nele e pergunte (AskUserQuestion) se
  esse é o mês da seleção (ver "Guarda-corpo: o mês" em `docs/edicao.md`).
  Se não for, pare e peça a correção no rascunho.

### 3. CTAs

Pergunte com AskUserQuestion, `multiSelect: true`: **onde o #N sai?**
Substack, Spotify, YouTube. Pelo menos um.

Se YouTube for marcado, confira em `docs/divulgacao.md` se o canal já existe;
se não existir, avise que o ícone vai apontar pra um canal que ainda não
existe e confirme.

### 4. Render

Grave um arquivo de props por layout em `outputs/links+ondas-N/`
(`anuncio-feed.json` e `anuncio-stories.json`), mudando só o `layout`:

```json
{
  "layout": "feed",
  "subtitle": "<subtítulo literal>",
  "cover": "links+ondas-N/capa-episodio.png",
  "ctas": ["substack", "spotify"]
}
```

E renderize. A capa vem de `input/`, por isso o `--public-dir`:

```bash
npx remotion still AnuncioFeed "outputs/links+ondas-N/anuncio-feed.png" \
  --public-dir=input --props="outputs/links+ondas-N/anuncio-feed.json"
npx remotion still AnuncioStories "outputs/links+ondas-N/anuncio-stories.png" \
  --public-dir=input --props="outputs/links+ondas-N/anuncio-stories.json"
```

Abra os dois PNGs (Read) e confira: capa inteira, subtítulo sem cortar, só
os ícones escolhidos, na ordem Substack, Spotify, YouTube.

### 5. Entregar

Mostre os dois arquivos e, logo em seguida, o guia de postagem abaixo,
preenchido com `N` e os CTAs escolhidos. Tire as linhas das plataformas que
não entram.

## Guia de postagem (o que imprimir no fim)

Links do lançamento:
- edição: `https://amarelodandara.substack.com/p/links-amarelos-N`
- episódio: `https://amarelodandara.substack.com/p/ondas-amarelas-N`
- Spotify: `https://open.spotify.com/show/043Gs7eyY2KOlotEWSTSxB` (o link do
  episódio só existe depois que ele sai)

**Quando**: sábado (D0), só **depois** que o episódio estiver no ar. Poste
tudo no mesmo dia, espaçando as plataformas em vez de disparar tudo junto.
Primeiro o Instagram (11h–13h é a janela de maior alcance), depois o resto.

Imprima como lista de conferência, nesta ordem:

1. **Instagram, feed** — `anuncio-feed.png`
   - Antes: confira pra onde aponta o link da bio (`docs/perfis.md`); no feed
     o ícone não é clicável, o clique sai pela bio.
   - Legenda escrita pela Dandara. O que importa vem nas primeiras ~125
     letras, antes do "mais". Link na legenda não clica: mande pra bio.
   - No máximo 3 a 5 hashtags, ou nenhuma.
   - Texto alternativo: preencha (Configurações avançadas).
   - Fique por perto na primeira hora e responda os comentários.
2. **Instagram, stories** — `anuncio-stories.png`
   - Logo depois do feed.
   - Sticker de link apontando pro episódio, logo abaixo da faixa
     (1556–1652px). Não cubra o texto nem os ícones.
   - Nada no topo (0–200px) nem no rodapé (abaixo de ~1650px): é onde fica a
     interface.
3. **Threads** — `anuncio-feed.png`
   - Texto da Dandara (até 500 caracteres) + o link.
   - No máximo 1 tag de tópico.
4. **X (@nydndr)** — `anuncio-feed.png`
   - Perfil pessoal: tom de pessoa falando do próprio trabalho.
   - Link **na primeira resposta**, não no post: link no corpo derruba o
     alcance.
   - Espaçe pelo menos 1h de outro post seu.
   - Fique 30 min pra responder quem comentar.
5. **Bluesky (@nydndr)** — sem imagem
   - Post com o link do Substack: o cartão já mostra a capa da edição. Um
     post não leva imagem e cartão juntos.
6. **Substack Notes** — sem imagem
   - Restack dos posts da edição e do episódio, com comentário da Dandara.
7. **YouTube** (se marcado) — sem peça aqui; o episódio completo é outra peça.

Feche lembrando: nenhum post é publicado sem aprovação dela, e todo texto de
legenda é dela.
