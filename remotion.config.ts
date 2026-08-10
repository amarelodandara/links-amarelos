import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setCodec("h264");
Config.setOverwriteOutput(true);

// Imagens das tabs vêm de /content — servidas como arquivos estáticos.
Config.setPublicDir("./content");
