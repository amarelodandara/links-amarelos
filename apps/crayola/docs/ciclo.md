# Ciclo de vida de um lançamento links + ondas

Do fechamento da curadoria até a divulgação depois do lançamento: o que é
conteúdo, o que é peça, onde cada coisa é feita e onde é publicada. Termos em
`glossario.md`, detalhes de cada parte em `edicao.md`.

Legenda: **conteúdo** é o que a marca publica (a edição e o episódio).
**Peça** é o que divulga o conteúdo. Itens com `?` ainda não estão confirmados.

## Mapa: onde nasce, onde vai parar

```mermaid
flowchart LR
  subgraph FEITO["onde é feito"]
    direction TB
    OBS["Obsidian<br/>rascunho links amarelos N.md"]
    AUD["Audacity<br/>gravação + edição"]
    FIG["Figma<br/>capas (template fixo)"]
    CRA["crayola<br/>Remotion"]
    PAP["crayola<br/>anúncio (template fixo)"]
  end

  subgraph CONTEUDO["conteúdo"]
    direction TB
    ED["edição<br/>links amarelos #N"]
    EP["episódio<br/>ondas amarelas #N (mp3)"]
    CE["capa da edição<br/>~2000×1050"]
    CP["capa do episódio<br/>2000×2000"]
  end

  subgraph PECAS["peças"]
    direction TB
    TS["teaser stories<br/>vídeo 9:16"]
    TF["teaser feed<br/>6 stills 1:1"]
    TX["teaser X/Bluesky<br/>vídeo 1:1"]
    TC["carrossel Substack<br/>6 stills 14:10 ?"]
    AN["anúncio 'no ar agora!'<br/>4:5 + 9:16"]
    CR["caiu na rede<br/>post de um link ?"]
  end

  subgraph ONDE["onde é publicado"]
    direction TB
    SUB["Substack<br/>post + e-mail"]
    SPO["Spotify<br/>via feed do Substack"]
    IG["Instagram<br/>stories + feed"]
    XB["X / Bluesky<br/>@nydndr (pessoal)"]
    SITE["linksamarelos.com<br/>página do episódio (novo)"]
    NOVO["novos: YouTube · TikTok<br/>Threads · Substack Notes<br/>(peças a definir)"]
  end

  OBS --> ED
  AUD --> EP
  FIG --> CE & CP
  ED -. base da gravação .-> AUD
  ED -. conteúdos escolhidos .-> CRA
  CRA --> TS & TF & TX & TC & CR
  CP --> PAP --> AN

  ED --> SUB
  CE --> SUB
  EP --> SUB --> SPO
  CP --> SUB
  TS & TF & AN --> IG
  CR -.-> IG
  TX -.-> XB
  TC -.-> SUB
  SUB -. feed RSS .-> SITE
```

## Linha do tempo

```mermaid
flowchart LR
  S["<b>segunda</b><br/>semana de produção<br/>fechamento das caixas de entrada"]
  P["<b>segunda → quarta</b><br/>curadoria · escrita · edição<br/>gravação · capas"]
  Q["<b>quinta · D-2</b><br/>teaser no Instagram<br/>stories + feed"]
  L["<b>sábado · D0</b><br/>ondas amarelas #N no Substack → Spotify<br/>links amarelos #N no Substack → e-mail<br/>anúncio 'no ar agora!' no Instagram"]
  D["<b>D+ · 3 semanas</b><br/>ter: destaque · qui: resumo, curadoria ou link do mês<br/>sáb: citação ou fechamento · ver calendário"]
  S --> P --> Q --> L --> D
```

As datas entre segunda e quinta não estão confirmadas: a nota de processo só
fixa o fechamento na segunda e a ordem dos passos.

## Inventário

| Item | Tipo | Feito em | Formato | Publicado em | Quando | Estado |
|---|---|---|---|---|---|---|
| edição links amarelos #N | conteúdo | Obsidian → Substack | texto + imagens | Substack (post + e-mail) | D0 | ativo |
| episódio ondas amarelas #N | conteúdo | Audacity | mp3, ~15 min | Substack → Spotify | D0, minutos antes da edição | ativo |
| capa da edição | conteúdo | Figma, imagem na máscara | ~2000×1050 | Substack | D0 | ativo |
| capa do episódio | conteúdo | Figma, imagem na máscara | 2000×2000 | Substack, Spotify | D0 | ativo |
| teaser stories | peça | crayola | vídeo 1080×1920 | Instagram stories | D-2 | ativo |
| teaser feed | peça | crayola | 6 stills 1080×1080 | Instagram feed | D-2 | ativo |
| teaser X/Bluesky | peça | crayola | vídeo 1080×1080 | X, Bluesky (@nydndr) | D-2 | gerado, ainda não postado |
| carrossel Substack | peça | crayola | 6 stills 1456×1040 | Substack ? | ? | gerado, uso não confirmado |
| anúncio "no ar agora!" | peça | crayola | stills 1080×1350 (4:5) e 1080×1920 (9:16) | Instagram, Threads, X | D0 | ativo |
| caiu na rede, é link! | peça | crayola | vídeo 1080×1350 | Instagram ? | ? | protótipo, um link da #10 |
| página do episódio no site | conteúdo | site, a partir do feed RSS do Substack | página com os links | linksamarelos.com | depois de D0 | decidido, não existe ainda |
| peças de D+ | peça | crayola (a construir) | ver `catalogo.md` | ver `catalogo.md` | D+ | aprovadas, não existem |

## Plataformas

Decidido em 2026-10-19. As peças de cada plataforma ainda não estão definidas;
a coluna "candidatas" é ponto de partida, não decisão.

| Plataforma | Papel | Peças candidatas | Estado |
|---|---|---|---|
| Substack | casa da edição e do episódio, e-mail | edição, episódio, capas | ativo |
| Spotify | podcast, via feed do Substack | episódio | ativo |
| Instagram | divulgação principal | teasers, anúncio | ativo |
| YouTube | episódio completo + Shorts | episódio em vídeo (capa, waveform, legenda), trechos | novo |
| Substack Notes | divulgação dentro do Substack | citação, link, capa | novo |
| Threads | divulgação em texto, junto do Instagram | citação, link | novo |
| X | divulgação, perfil pessoal @nydndr | teaser 1:1, fio de links, citação | ativo, ainda sem peças |
| Bluesky | divulgação, perfil pessoal @nydndr | teaser 1:1, fio de links, citação | ativo, ainda sem peças |
| TikTok | vídeo curto | trechos do podcast | novo |
| linksamarelos.com | página de cada episódio com os links | gerada do feed do Substack | novo |

Fora por enquanto: WhatsApp, Are.na, LinkedIn, Pinterest. Contas de cada
plataforma em `divulgacao.md`.

## Calendário-base

Aprovado em 2026-10-19. D0 = sábado. Tudo agendado a partir de um lote gerado
no D0 (ver `divulgacao.md`). Peças em `catalogo.md`.

| Quando | O quê |
|---|---|
| qui · D-2 | teaser: IG stories + feed, X, Bluesky, Threads |
| sáb · D0 | anúncio no IG; restack no Notes; post com link no Threads, X e Bluesky; episódio completo no YouTube; página no site |
| semana 1 | ter: destaque 1 · qui: resumo + curadoria · sáb: citação 1 |
| semana 2 | ter: destaque 2 · qui: link do mês 1 · sáb: citação 2 |
| semana 3 | ter: destaque 3 · qui: link do mês 2 · sáb: fechamento |
| semana 4 | sem peças: produção da próxima edição |

Uns 12 a 15 posts por lançamento.

**Distribuição do podcast**: o feed do Substack pode alimentar Apple Podcasts,
Amazon e outros, mas hoje o episódio só chega no Spotify. Ligar os outros é
configuração no Substack, não peça do crayola.

**Página no site**: o feed `amarelodandara.substack.com/feed` traz o HTML
completo de cada post (`content:encoded`), com todos os links inline. A
página de cada episódio no linksamarelos.com pode sair dele depois do
lançamento, sem digitar os links de novo.

## O que alimenta o quê

```mermaid
flowchart TB
  R["rascunho no Obsidian"] --> ED["edição"]
  ED --> EP["episódio<br/>(outra versão da conversa)"]
  ED --> T4["conteúdos escolhidos<br/>(não os do &quot;temos&quot;)"] --> TEASER["teasers D-2"]
  IMG["imagem escolhida"] --> CE["capa da edição"] & CP["capa do episódio"]
  CP --> AN["anúncio D0"]
  ED -. um link .-> CR["caiu na rede ?"]
  ED -. citação ? .-> CIT["card de citação"]
  EP -. trecho ? .-> REEL["reel"]
```

Uma imagem por lançamento alimenta as duas capas e, por elas, o anúncio. O
texto alimenta o episódio, os teasers e, no futuro, as peças de D+.
