import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");

// O fundo usa um shader WebGL (@paper-design/shaders-react) — o Chromium
// headless do render precisa de aceleração via ANGLE pra rasterizá-lo.
Config.setChromiumOpenGlRenderer("angle");

/**
 * Desliga a edição interativa do canvas do Studio (selecionar/arrastar elemento
 * no preview e gravar o CSS de volta no fonte).
 *
 * Dois motivos: um arrasto acidental sobre a composition `Editor` injeta estilo
 * no meio do form, e sobre as peças de vídeo mexe no design que veio aprovado do
 * Paper — nos dois casos é edição de código por acidente. Aconteceu uma vez
 * durante a implementação, com um `translate` parasita no EditionEditor.
 *
 * Se um dia quiser posicionar elemento arrastando no preview, é só voltar pra
 * `true` — nada mais depende disso.
 */
Config.setInteractivityEnabled(false);
Config.setCodec("h264");
Config.setOverwriteOutput(true);

// Imagens das tabs vêm de /content — servidas como arquivos estáticos.
Config.setPublicDir("./content");
