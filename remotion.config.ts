import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");

// O fundo usa um shader WebGL (@paper-design/shaders-react) — o Chromium
// headless do render precisa de aceleração via ANGLE pra rasterizá-lo.
Config.setChromiumOpenGlRenderer("angle");
Config.setCodec("h264");
Config.setOverwriteOutput(true);

// Imagens das tabs vêm de /content — servidas como arquivos estáticos.
Config.setPublicDir("./content");
