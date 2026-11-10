// @ts-check
/**
 * Gera src/design/tokens.generated.css a partir do settings.json.
 *
 * A paleta já era o settings.json — as peças de vídeo leem de lá em TS. Os
 * componentes de interface precisam dela em CSS (o Base UI expõe estado por
 * data-attribute, e style inline não alcança), então em vez de repetir os hex
 * num arquivo à mão, o mesmo JSON vira custom property.
 *
 * Roda no `npm run sync`, antes do sync-editions — este não depende de /content
 * e não deve falhar junto quando a pasta está vazia.
 */
import { writeFileSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const settings = JSON.parse(readFileSync(resolve(root, "settings.json"), "utf8"));

/** `sunDark` → `--sun-dark`. */
const varName = (key) => `--${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;

const brand = Object.entries(settings.colors).map(
  ([key, value]) => `  ${varName(key)}: ${String(value).toLowerCase()};`,
);

const css = `/*
 * GERADO por scripts/gen-tokens.mjs — não editar à mão.
 * A fonte é a seção "colors" do settings.json.
 *
 * --background e --foreground são os papéis semânticos: o que a interface usa
 * quando quer "o fundo" e "o texto", sem escolher um nome de marca.
 */
:root {
  --background: #ffffff;
${brand.join("\n")}
  --foreground: var(--brand-black);
}
`;

writeFileSync(resolve(root, "src/design/tokens.generated.css"), css);
console.log(
  `tokens.generated.css atualizado — ${brand.length} cor(es) do settings.json.`,
);
