// @ts-check
/**
 * Baixa a og:image de um link — a imagem que aparece quando ele é
 * compartilhado — pra dentro de packages/content/assets, de onde o Remotion serve arquivos.
 *
 *   node scripts/fetch-og.mjs <url> <destino relativo a packages/content/assets/, sem extensão>
 *   node scripts/fetch-og.mjs https://exemplo.com/post caiunarede/onde-da-pra-conversar
 *
 * Imprime o caminho final (com a extensão que o servidor indicar), que é o
 * que vai em `link.image` da composition. Baixar em vez de apontar pra URL
 * deixa o render independente do site estar no ar.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { assetsDir } from "./lib/root.mjs";

const [url, target] = process.argv.slice(2);
if (!url || !target) {
  console.error("uso: node scripts/fetch-og.mjs <url> <destino sem extensão>");
  process.exit(1);
}

const page = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 (compatible; crayola-og)" } });
if (!page.ok) throw new Error(`${url}: HTTP ${page.status}`);
const html = await page.text();

// og:image, ou twitter:image como reserva; atributos em qualquer ordem.
const metas = html.match(/<meta\b[^>]*>/gi) ?? [];
const attr = (tag, name) => tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, "i"))?.[1];
const found = ["og:image", "og:image:url", "twitter:image"]
  .map((key) => metas.find((tag) => (attr(tag, "property") ?? attr(tag, "name")) === key))
  .find(Boolean);
const src = found && attr(found, "content");
if (!src) throw new Error(`${url}: nenhuma og:image na página`);

const imageUrl = new URL(src.replaceAll("&amp;", "&"), page.url);
const image = await fetch(imageUrl);
if (!image.ok) throw new Error(`${imageUrl}: HTTP ${image.status}`);
const type = image.headers.get("content-type") ?? "";
const ext = { "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif" }[type.split(";")[0]] ?? ".jpg";

const relative = `${target}${ext}`;
const out = join(assetsDir, relative);
await mkdir(dirname(out), { recursive: true });
await writeFile(out, Buffer.from(await image.arrayBuffer()));
console.log(relative);
