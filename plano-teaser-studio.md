# Plano de implementação — Estúdio de Teasers (Links Amarelos / Ondas Amarelas / Hyperlinks)

> Documento de handoff para o Claude Code. Reúne todas as decisões tomadas no
> refinamento do pitch, organizadas para virar tarefas de implementação.

## 1. O que é

Ferramenta interna, local, de um repositório próprio no GitHub (privado), que
gera de forma programática (via **Remotion**) os assets de divulgação de cada
edição da newsletter/podcast: vídeos curtos (teasers) para redes sociais e um
carrossel de imagens estáticas para o Substack.

Não tem relação de código com o `linksamarelos.com` — é livre para tomar suas
próprias decisões de stack.

## 2. Estrutura de conteúdo

Dois tipos de conteúdo, cada um com numeração de edição independente:

- **`links-ondas`** — combo Links Amarelos (newsletter) + Ondas Amarelas
  (podcast), mesmo conteúdo em dois formatos, sempre lançados juntos.
  Tema **amarelo**.
- **`hyperlinks`** — podcast longo, separado. Tema **azul**. CTA final aponta
  pro Spotify (não pro Substack — não existe post longo lá pra esse formato).

Estrutura de pastas sugerida:

```
/content
  /links-ondas
    /042-nome-da-edicao
      edition.json        # dados da edição (ver seção 3)
      /assets              # imagens/gifs que ela solta manualmente
  /hyperlinks
    /017-nome-da-edicao
      edition.json
      /assets
/outputs                   # gitignored — sobe pro Google Drive dedicado
  /links-ondas/042-.../
  /hyperlinks/017-.../
```

O programa **não deve rodar** se a pasta `/assets` da edição estiver vazia ou
com menos imagens do que os 4 teasers exigem.

## 3. Modelo de dados por edição (`edition.json`)

Confirmado por ela como batendo com a intenção. Campos necessários:

```json
{
  "editionNumber": 42,
  "type": "links-ondas",       // ou "hyperlinks"
  "airDate": "2026-08-15",
  "tabs": [
    { "author": "Nome do Autor", "image": "assets/01.png" },
    { "author": "Nome do Autor 2", "image": "assets/02.png" },
    { "author": "Nome do Autor 3", "image": "assets/03.png" },
    { "author": "Nome do Autor 4", "image": "assets/04.png" }
  ]
}
```

- Sempre **4 tabs** — mesmo que a edição tenha mais links, ela escolhe
  manualmente os 4 mais visualmente interessantes.
- Cada tab mostra **só o nome do autor** como string — nenhum outro dado
  (nem título do conteúdo). É proposital: informação parcial pra gerar
  curiosidade.
- `type` decide tema (logo, cor) e CTA final (Substack vs. Spotify)
  automaticamente — não é um campo separado de "tema".

### Origem dos dados (form de criação)

Ela não quer editar esse JSON na mão. Precisa de um **form simples** (rodando
localmente, dentro do próprio projeto) onde ela:
1. Sobe a imagem de cada tab,
2. Digita o nome do autor correspondente,
3. O form escreve o `edition.json` + copia as imagens pra `/assets`.

**Decisão:** o form vive na mesma tela em que ela está vendo a timeline do
vídeo — editar os dados (imagem, nome do autor) e ver o efeito na composição
acontece no mesmo lugar, ao vivo, sem trocar de contexto.

#### Correção (verificada no Remotion 4.0.507)

A redação anterior desta seção dizia que o form seria um "painel lateral
customizado" do Studio, via `@remotion/studio`. **Isso não existe.** Não há API
de registro de painel, aba ou plugin no Studio — `@remotion/studio` expõe um
conjunto de funções para _interagir_ com o Studio, não para estendê-lo com
superfícies de UI próprias. O que existe de fato:

| Recurso | Serve pra |
|---|---|
| `schema` na `<Composition>` | Studio gera um form automático a partir do schema Zod (inputs, dropdown de enum, arrays com add/remove, date picker, `zColor`, `zTextarea`) |
| `writeStaticFile` / `deleteStaticFile` / `getStaticFiles` / `watchStaticFile` | ler e gravar arquivos dentro da publicDir — que neste projeto é `/content` |
| `saveDefaultProps` / `focusDefaultPropsPath` | gravar valores de volta no `defaultProps` do arquivo raiz |
| `visualControl` | expor uma constante do código como controle editável ao vivo, com save de volta pro fonte |
| `play` / `pause` / `seek` / `goToComposition` / `restartStudio` | dirigir o player e o Studio por código |

Duas consequências práticas:

1. **UI própria só roda dentro de uma composition.** Sem API de painel, o form
   precisa ser uma composition que renderiza um form de verdade (aparece na
   área do canvas, ao lado da timeline) — o que ainda atende a intenção
   original de editar e ver o resultado na mesma tela. Confirmado que os
   atalhos de teclado do Studio são ignorados enquanto um `<input>` ou
   `<textarea>` tem foco, então digitar no form não dispara play/pause.
   **Isso virou o caminho secundário** — ver a seção 3.3.
2. **O form automático de schema grava no lugar errado.** Ele salva em
   `defaultProps` no `Root.tsx` — mas a fonte da verdade aqui é o
   `edition.json`, e o `Root.tsx` é gerado a partir dele pelo `npm run sync`.
   Edições feitas pelo form de schema seriam sobrescritas no próximo sync. Por
   isso a gravação usa `writeStaticFile`, que escreve direto no `edition.json`
   e nos assets (cria as pastas que faltarem e recusa escrever fora da
   publicDir).

### 3.3 App de 3 colunas — o shell definitivo

Depois de usar a composition `Editor`, ficou claro que o Studio traz junto um
monte de coisa que não serve pra este fluxo: timeline, scrubbing, seletor de
composition, inspector. O trabalho real é sempre a mesma sequência de três
passos, e o pedido virou esse: **input → preview → export**, uma coluna por
passo.

Dois limites do Studio decidem a arquitetura:

- não existe opção de esconder timeline ou sidebar (`setMaxTimelineTracks`
  limita faixas, nada esconde painel);
- não existe API cliente pra disparar um render — `@remotion/studio` expõe
  `play`/`pause`/`seek`/`goToComposition` e operações de arquivo, nada que
  comece um export.

Ou seja: a coluna de export não pode existir dentro de uma composition. O app
tem que ser o shell.

Forma final (`npm run app`):

| Coluna | Como funciona |
|---|---|
| 1 · Input | O mesmo `EditionForm` do Studio, gravando por HTTP no servidor local |
| 2 · Preview | `@remotion/player` rodando o mesmo componente do render — WYSIWYG, sem timeline, alternando entre as 3 peças |
| 3 · Export | Dispara o mesmo `remotion render` da CLI no servidor local, com progresso por peça |

Decisões que sustentam isso:

- **O render fica na CLI, não em `@remotion/renderer` programático.** Além de
  menos código, a CLI lê o `remotion.config.ts` — onde mora o OpenGL "angle"
  que o shader do fundo precisa. O arquivo que sai do app é igual ao do
  `npm run render`.
- **O form é um só**, hospedado nos dois shells; só o transporte de gravação
  muda (`EditionWriter`). As regras de ordem das gravações moram em
  `edition-io.ts`.
- **O Studio continua existindo** pra debugar composition com timeline e
  scrubbing — é o único lugar onde isso existe.

### 3.1 Config global (`settings.json`) — separado do `edition.json`

Vale distinguir dois arquivos de config diferentes:
- **`edition.json`** — dados que mudam a cada edição (autor, imagens, data,
  tipo). Já especificado acima.
- **`settings.json`** — constantes do projeto que não mudam por edição:
  resoluções de cada composition, duração do vídeo em segundos, cores/tokens
  de cada tema, quais logos usar e como elas se "empilham". Esse é o arquivo
  que deve nascer **depois** da etapa de exploração visual no Paper (seção
  4.1) — porque é lá que parâmetros novos tendem a aparecer ou sumir (ex:
  ela pode descobrir que precisa de um token de "espaçamento entre tabs" que
  não tinha previsto, ou perceber que um parâmetro pensado antes não faz
  sentido visualmente).

## 3.2 Etapa de exploração visual (Paper Design + MCP)

Antes de qualquer trabalho de implementação (schema definitivo, componentes
Remotion), o Claude Code deve preparar o terreno pra exploração visual:

1. Configurar o **MCP server do Paper Design** conectado ao Claude Code
   nesse repositório.
2. Deixar pronto o que for necessário pra ela começar a rascunhar direto no
   Paper (ex: já ter os assets de marca — logos de cada tema — disponíveis
   pra usar nos rascunhos, se ela tiver esses arquivos).
3. **Pausar a implementação técnica aqui.** Ela explora livremente no Paper
   várias direções visuais pra cada composition (Stories, Feed, Social,
   Carrossel) até se sentir satisfeita.
4. Só depois disso o Claude Code volta: puxa o HTML+CSS aprovado via MCP,
   monta o `settings.json` (seção 3.1) com os tokens/parâmetros que emergiram
   do design final, e aí sim implementa os componentes Remotion.

Isso muda a ordem da seção 11 (Ordem sugerida de construção) — reflita lá.

## 4. Composições Remotion (por formato)

Cada formato é uma **Composition** separada, todas lendo o mesmo
`edition.json`:

| Composition | Uso |
|---|---|
| `Stories` | Instagram Stories |
| `Feed` | Instagram feed |
| `Social` | Twitter / BlueSky (mesma composição pode servir pros dois, a confirmar se a proporção é igual) |
| `CarouselSlide` | as 6 imagens estáticas do carrossel do Substack (renderizada como stills, não vídeo) |

**Resoluções pesquisadas (2026), viáveis como padrão do projeto:**

| Plataforma | Formato | Resolução recomendada | Limite técnico de duração |
|---|---|---|---|
| Instagram Stories | 9:16 vertical | 1080×1920 | até 60s por clipe (acima disso quebra em partes) |
| Instagram Feed | 4:5 vertical (o formato que Instagram mais favorece no feed) | 1080×1350 | até 60 min (não é o limitante) |
| Twitter/X | 9:16 vertical **ou** 16:9 (1920×1080) — ambos nativamente suportados | recomendo reaproveitar o vertical 1080×1920 pra não precisar de uma 4ª composição | até 140s (contas free) |
| BlueSky | exibe no formato nativo do arquivo (não força crop) — 9:16 ou 16:9 funcionam | recomendo também reaproveitar o vertical 1080×1920 | até 3 min, mas arquivo limitado a 100MB |

**Recomendação prática:** dá pra usar a **mesma composition vertical
(1080×1920)** pra Stories, Twitter e BlueSky — as três aceitam nativamente
9:16 sem cortar nem adicionar barra preta. Isso elimina uma composition
inteira do trabalho (era a dúvida em aberto sobre Twitter/BlueSky
compartilharem ou não a mesma peça). Só o **Feed do Instagram** pede uma
proporção própria (4:5), porque lá o vertical completo (9:16) fica cortado.

### Saída em vídeo (não gif)

Confirmado: formato final é **vídeo curto** (mp4/H.264), não `.gif` literal
— Instagram não aceita gif nativo em feed/stories. Nenhuma das plataformas
acima é o fator limitante de duração (todas aceitam bem mais que o
necessário) — o limite real é estético, do território de "gif curto" que
ela quer.

**Decisão sugerida:** constante do projeto em **8 segundos** (intro + 4 tabs
rápidas + CTA, sem parecer apressado). Como é só uma constante em
`settings.json` (ver seção 3.1), ajustar depois de ver o primeiro preview no
Remotion Studio é trivial — não precisa fechar isso com certeza absoluta
agora.

### Estrutura de tempo dentro do vídeo

1. Abertura: texto fixo **"essa semana em"** + logo do tema (troca conforme
   `type` da edição).
2. 4 cenas de tab (metáfora de aba de navegador), cada uma mostrando a
   imagem + nome do autor.
3. Encerramento: data de lançamento + CTA (Substack ou Spotify, conforme
   `type`).

### Sistema de tema (logo)

- O texto "essa semana em" é fixo entre os temas; só a **logo** trocada
  depois dele muda (Links Amarelos/Ondas Amarelas vs. Hyperlinks).
- Existe também uma forma definida de "empilhar" as duas logos juntas — o
  gatilho exato pra isso acontecer fica pra decidir no momento da
  implementação do componente de logo, já com acesso aos arquivos e regras
  definidas na exploração do Paper (seção 3.2).

## 5. Carrossel do Substack

6 imagens estáticas, na mesma linha visual do vídeo:
1. Capa — momento "essa semana em [logo]"
2. Tab 1
3. Tab 2
4. Tab 3
5. Tab 4
6. CTA final (data + onde conferir)

Renderizadas como **stills de uma composição Remotion própria**
(`CarouselSlide`), não como recorte/screenshot do vídeo — isso dá liberdade
de layout/timing específico pra versão estática.

**Resolução:** ela já tem a especificação certa do Substack —
**14:10, horizontal** (ex: 1456×1040 ou 1400×1000). Isso é bem diferente da
proporção do Feed do Instagram (4:5, vertical), então a ideia de reaproveitar
o mesmo layout entre Feed e carrossel não se aplica — o `CarouselSlide`
precisa do próprio layout pensado pra um formato horizontal.

## 6. Paper Design + Claude Code (MCP)

Fluxo de trabalho pretendido:
1. Ela explora várias direções visuais no **Paper Design**.
2. Quando estiver satisfeita, usa o **MCP do Paper** conectado ao Claude Code
   pra puxar o HTML+CSS direto de lá.
3. Claude Code transforma isso em componentes Remotion — sem ela precisar
   reconstruir manualmente nem descrever detalhes visuais em texto/imagem.

Implicação prática: o setup do Claude Code pra esse projeto deve ter o MCP
server do Figma/Paper configurado desde o início (não é uma etapa "depois",
é parte do fluxo de criação de cada componente visual).

## 7. Preview e render (fluxo de trabalho local)

- **Preview:** `npx remotion studio` — abre um player no navegador com
  hot-reload e timeline scrubável, com seletor de composições na lateral.
  Ela pode abrir só a composição `Stories`, iterar visualmente à vontade
  (isso não gera vídeo, é só playback), e só seguir pras outras composições
  quando estiver satisfeita.
- **Render granular:** `npx remotion render Stories` renderiza só uma
  composição. Um script (`render-all.js` ou similar) percorre todas as
  composições de uma edição quando ela quiser o pacote completo.
- Tempo de render estimado (máquina razoável, clipe curto e composição
  simples): ~15s–2min por variante, ~3–8min pro pacote completo de uma
  edição.

## 8. Armazenamento dos outputs

- Assets gerados (`/outputs`) ficam **fora do controle de versão**
  (`.gitignore`) — só código e `edition.json` são versionados.
- Ela sobe manualmente o resultado renderizado pro **Google Drive dedicado**
  de conteúdos — sem necessidade de Git LFS ou sincronização automática por
  enquanto.
- Nome da pasta de output já serve como arquivo histórico organizado por
  número de edição (resolve a preocupação de organização sem trabalho
  extra).

## 9. Fora de escopo (confirmado)

- Emails de agradecimento pros artistas mencionados.
- Qualquer acoplamento com o código/deploy do `linksamarelos.com`.
- Automação de disparo (watch-on-folder, CI, etc.) — disparo é manual, local.

## 10. Ideia estacionada (não é desse pitch, mas anotada)

- Puxar do RSS feed do Substack os números de edição já publicados, pra
  avisar automaticamente se ela for reutilizar um número por engano. Isso é
  uma feature do site principal (`linksamarelos.com`), não do estúdio —
  revisitar depois.

## 11. Ordem sugerida de construção

1. Bootstrap do repo (Remotion + estrutura de pastas `/content`, `/outputs`).
2. **Configurar MCP do Paper Design** e deixar tudo pronto pra exploração
   visual (seção 3.2) — logos e outros assets de marca disponíveis se ela
   tiver.
3. **Pausa pra exploração visual dela no Paper.** Nenhuma implementação de
   componente Remotion começa antes disso.
4. Com o design aprovado: montar o `settings.json` (seção 3.1) com os
   tokens/parâmetros que emergiram do Paper, e o schema do `edition.json`
   (seção 3) + exemplo de edição fake pra testar.
5. Puxar o HTML+CSS do Paper via MCP e implementar a Composition `Stories`
   sozinha, com dados mockados — validar timing, tema/logo, tipografia via
   preview no Remotion Studio.
6. Replicar pras outras composições de vídeo (Feed; Twitter/BlueSky
   reaproveitando a composition vertical, seção 4).
7. Composition `CarouselSlide` (stills, seção 5).
8. Form de criação como **composition `Editor`** dentro do Remotion Studio
   (seção 3 e sua correção), gravando `edition.json` e os assets via
   `writeStaticFile`, com efeito ao vivo nas compositions da edição.
9. Script de render em lote + validação de que assets obrigatórios existem
   antes de rodar.
