---
name: destaque
description: Gera o destaque (Reels 9:16) de um lançamento links + ondas — trecho do episódio com o mp3 player, as ondas da voz e a legenda palavra por palavra — a partir dos tempos que a Dandara passa, e diz onde e como postar. Use quando ela pedir destaque, reel, trecho do episódio, corte do podcast ou a peça de terça.
---

> Caminhos relativos a `apps/crayola/` (o crayola no monorepo). Rode os comandos a partir de lá.

# destaque

Peça de D+ (terças, ver `docs/ciclo.md`): um trecho falado do episódio, em
vídeo 9:16, com legenda. Leva pra ouvir o episódio inteiro.

Antes de começar, leia `docs/glossario.md`, a seção **destaque** de
`docs/catalogo.md` e `docs/input.md`.

## Regra de texto

A legenda é o que a Dandara falou, palavra por palavra: nunca resumida,
reescrita nem "melhorada". O agente não procura nem sugere trechos: ela passa
os tempos. O rascunho da edição só serve pra conferir a grafia de nomes,
títulos e termos.

## Passos

### 1. Lançamento e pasta

Descubra `N`. A pasta é `input/links+ondas-N/`. Normalize os nomes dos
arquivos ("Normalização dos nomes" em `docs/input.md`) e confira:

| Arquivo | Checagem |
|---|---|
| `ondas-amarelas-N.mp3` | existe |
| `capa-episodio.png` | existe, 2000×2000 |
| `links amarelos N.md` | se não existir, avise que a grafia não vai ser conferida e siga |

### 2. Trechos

Peça os tempos de cada destaque (início–fim, `mm:ss`). Não sugira trechos.

### 3. Transcrição

Pra cada trecho:

```bash
node scripts/transcribe.mjs N <início> <fim>
```

Grava `outputs/links+ondas-N/_trabalho/destaque-<início>.json` (palavras com
tempo). Tudo que é de trabalho fica em `_trabalho/`; a raiz de
`outputs/links+ondas-N/` é só o que vai pro ar. Na
primeira vez o script instala o whisper.cpp e baixa o modelo (~1,5 GB).

### 4. Revisão da legenda

Mostre o texto de cada trecho e liste, com o tempo aproximado:

- palavras que parecem erro de transcrição (sem sugerir o que ela disse);
- nomes e termos cuja grafia difere do rascunho;
- se o trecho começa ou termina no meio da frase.

Aplique só as correções que ela der, palavra por palavra, sobre o `.json`, e
grave `outputs/links+ondas-N/_trabalho/destaque-<início>.legenda.json` (mesmo formato).
Uma palavra corrigida que vira várias (`divirge` → `ir e vir`) divide o tempo
da original. Se ela mudar início ou fim, transcreva de novo.

Sem `.legenda.json` aprovado, não renderize.

### 5. CTAs

Pergunte (AskUserQuestion, `multiSelect: true`) onde o episódio está:
Substack, Spotify, YouTube. Vão no fim do vídeo, na ordem fixa.

### 6. Render

```bash
node scripts/render-destaque.mjs N <início> substack,spotify
```

Grava `outputs/links+ondas-N/destaque-<início>.mp4`. Pra conferir o layout
antes do vídeo inteiro, `--frame=<n>` gera só um still (em `_trabalho/`). Abra o vídeo
(`open`) pra Dandara ver.

### 7. Entregar

Mostre os arquivos e, logo depois, o guia de postagem abaixo, preenchido.

## Guia de postagem (o que imprimir no fim)

**Quando**: terça, um destaque por semana (`docs/ciclo.md`). Janela de maior
alcance no Instagram: 11h–13h ou 19h–21h.

1. **Instagram, Reels** — `destaque-<início>.mp4`
   - Legenda do post escrita pela Dandara; o que importa nas primeiras ~125
     letras. Link não clica: mande pra bio.
   - Capa do Reel: escolha no app um frame com o player inteiro (o grid
     recorta em 3:4, o player cabe).
   - Deixe "Compartilhar no feed" ligado.
   - Não troque o áudio por música do Instagram: a voz é a peça.
   - No máximo 3 a 5 hashtags, ou nenhuma.
   - Fique por perto na primeira hora e responda os comentários.
2. **Stories** — compartilhe o Reel nos stories com sticker de link pro
   episódio.
3. **TikTok e YouTube Shorts** — ainda não existem as contas
   (`docs/divulgacao.md`). Quando existirem, o mesmo arquivo serve.

Feche lembrando: nada é publicado sem aprovação dela, e a legenda do post é
dela.
