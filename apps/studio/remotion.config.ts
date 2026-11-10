import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");

// O fundo usa um shader WebGL (@paper-design/shaders-react) — o Chromium
// headless do render precisa de aceleração via ANGLE pra rasterizá-lo.
Config.setChromiumOpenGlRenderer("angle");

// Desliga a edição interativa do canvas do Studio: um arrasto acidental grava
// CSS de volta no fonte e mexe no design que veio aprovado do Paper.
Config.setInteractivityEnabled(false);
Config.setCodec("h264");
Config.setOverwriteOutput(true);

// Imagens das tabs e outras mídias vêm de @links/content — servidas como
// arquivos estáticos. Relativo a apps/studio, de onde o remotion roda.
Config.setPublicDir("../../packages/content/assets");
