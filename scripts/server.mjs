// @ts-check
/**
 * Servidor local do app de 3 colunas (input → preview → export).
 *
 * Existe porque as duas pontas do fluxo precisam de Node: gravar arquivos em
 * /content e renderizar. O preview não passa por aqui — roda no navegador com
 * @remotion/player, no mesmo componente que o render usa.
 *
 * Sem framework de propósito: são cinco rotas e o `node:http` dá conta.
 */
import { createServer } from "node:http";
import { spawn, spawnSync } from "node:child_process";
import { createReadStream, existsSync, mkdirSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { collectEditions, contentDir, root } from "./lib/editions.mjs";

const PORT = Number(process.env.APP_API_PORT ?? 3010);

const MIME = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".json": "application/json",
};

/** As 3 peças de uma edição, e como cada uma é renderizada. */
const PIECES = {
  stories: {
    label: "Stories / Twitter / BlueSky",
    composition: (id) => `Stories-${id}`,
    output: "stories.mp4",
    extraArgs: [],
  },
  feed: {
    label: "Instagram Feed",
    composition: (id) => `Feed-${id}`,
    output: "feed.mp4",
    extraArgs: [],
  },
  carousel: {
    label: "Carrossel Substack",
    composition: (id) => `CarouselSlide-${id}`,
    output: "carrossel",
    extraArgs: ["--sequence", "--image-format=png"],
  },
};

/** @type {Map<string, any>} */
const jobs = new Map();

const json = (res, status, body) => {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
};

const readBody = (req) =>
  new Promise((resolvePromise, reject) => {
    /** @type {Buffer[]} */
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolvePromise(Buffer.concat(chunks)));
    req.on("error", reject);
  });

/**
 * Resolve um caminho relativo dentro de /content, recusando qualquer coisa que
 * escape da pasta — mesma proteção que o servidor do Studio faz.
 */
const safeContentPath = (relativePath) => {
  const absolute = resolve(contentDir, relativePath);
  if (relative(contentDir, absolute).startsWith("..")) {
    throw new Error(`Caminho fora de /content: ${relativePath}`);
  }
  return absolute;
};

const editionCompositionId = (edition) =>
  `${edition.type}-${String(edition.editionNumber).padStart(3, "0")}`;

/** Mantém editions.generated.ts fresco antes de renderizar. */
const syncEditions = () => {
  const res = spawnSync(process.execPath, ["scripts/sync-editions.mjs"], {
    cwd: root,
    encoding: "utf8",
  });
  if (res.status !== 0) {
    throw new Error(res.stderr?.trim() || "sync falhou");
  }
};

const runPiece = ({ job, step, compositionId, outputPath, extraArgs }) =>
  new Promise((resolvePromise) => {
    const args = ["remotion", "render", compositionId, outputPath, ...extraArgs];
    const child = spawn("npx", args, { cwd: root });

    step.status = "running";

    // A CLI imprime "Rendered 12/240" e depois "Encoded 151/240". Dá progresso
    // bom o suficiente sem reimplementar o pipeline com @remotion/renderer —
    // que, além do código extra, não leria o remotion.config.ts (onde mora o
    // OpenGL "angle" que o shader do fundo precisa).
    const readProgress = (chunk) => {
      const text = chunk.toString();
      const rendered = [...text.matchAll(/Rendered (\d+)\/(\d+)/g)].pop();
      const encoded = [...text.matchAll(/Encoded (\d+)\/(\d+)/g)].pop();
      const match = encoded ?? rendered;
      if (match) {
        step.progress = Number(match[1]) / Number(match[2]);
        step.phase = encoded ? "encoding" : "rendering";
      }
    };

    child.stdout.on("data", readProgress);
    child.stderr.on("data", (chunk) => {
      readProgress(chunk);
      step.log = `${step.log ?? ""}${chunk.toString()}`.slice(-4000);
    });

    child.on("close", (code) => {
      if (code === 0) {
        step.status = "done";
        step.progress = 1;
      } else {
        step.status = "error";
        step.error = `remotion render saiu com código ${code}`;
        job.error = step.error;
      }
      resolvePromise();
    });
  });

const startRender = async (job, entry, pieces) => {
  try {
    syncEditions();
    const compositionId = editionCompositionId(entry.edition);
    const outDir = join(root, "outputs", entry.dir);
    mkdirSync(outDir, { recursive: true });

    for (const step of job.steps) {
      const piece = PIECES[step.piece];
      await runPiece({
        job,
        step,
        compositionId: piece.composition(compositionId),
        outputPath: join(outDir, piece.output),
        extraArgs: piece.extraArgs,
      });
      if (job.error) break;
    }
  } catch (err) {
    job.error = err instanceof Error ? err.message : String(err);
    for (const step of job.steps) {
      if (step.status === "pending") step.status = "skipped";
    }
  } finally {
    job.done = true;
    job.outputDir = `outputs/${entry.dir}`;
    void pieces;
  }
};

const serveContentFile = (res, relativePath) => {
  let absolute;
  try {
    absolute = safeContentPath(relativePath);
  } catch {
    return json(res, 400, { error: "caminho inválido" });
  }

  if (!existsSync(absolute) || !statSync(absolute).isFile()) {
    return json(res, 404, { error: "não encontrado" });
  }

  res.writeHead(200, {
    "content-type": MIME[extname(absolute).toLowerCase()] ?? "application/octet-stream",
    // O preview troca de imagem a cada gravação; cache atrapalharia.
    "cache-control": "no-store",
  });
  createReadStream(absolute).pipe(res);
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  const { pathname } = url;

  try {
    if (pathname === "/api/state") {
      const { entries, errors } = collectEditions();
      return json(res, 200, { editions: entries, errors });
    }

    if (pathname === "/api/file" && req.method === "POST") {
      const filePath = url.searchParams.get("path");
      if (!filePath) return json(res, 400, { error: "falta o parâmetro path" });

      const absolute = safeContentPath(filePath);
      mkdirSync(join(absolute, ".."), { recursive: true });
      writeFileSync(absolute, await readBody(req));
      return json(res, 200, { ok: true });
    }

    if (pathname === "/api/file" && req.method === "DELETE") {
      const filePath = url.searchParams.get("path");
      if (!filePath) return json(res, 400, { error: "falta o parâmetro path" });

      const absolute = safeContentPath(filePath);
      if (existsSync(absolute)) unlinkSync(absolute);
      return json(res, 200, { ok: true });
    }

    if (pathname === "/api/render" && req.method === "POST") {
      const { dir, pieces } = JSON.parse((await readBody(req)).toString() || "{}");
      const { entries } = collectEditions();
      const entry = entries.find((e) => e.dir === dir);

      if (!entry) return json(res, 400, { error: `edição "${dir}" não encontrada` });

      const selected = (Array.isArray(pieces) ? pieces : []).filter((p) => p in PIECES);
      if (selected.length === 0) return json(res, 400, { error: "nenhuma peça marcada" });

      const id = randomUUID();
      const job = {
        id,
        dir,
        done: false,
        error: null,
        steps: selected.map((piece) => ({
          piece,
          label: PIECES[piece].label,
          status: "pending",
          progress: 0,
        })),
      };
      jobs.set(id, job);
      void startRender(job, entry, selected);
      return json(res, 200, { id });
    }

    if (pathname.startsWith("/api/render/")) {
      const job = jobs.get(pathname.slice("/api/render/".length));
      if (!job) return json(res, 404, { error: "job não encontrado" });
      return json(res, 200, job);
    }

    if (pathname.startsWith("/content/")) {
      return serveContentFile(res, decodeURIComponent(pathname.slice("/content/".length)));
    }

    return json(res, 404, { error: "rota não encontrada" });
  } catch (err) {
    return json(res, 500, { error: err instanceof Error ? err.message : String(err) });
  }
});

server.listen(PORT, () => {
  console.log(`[api] http://localhost:${PORT}`);
});
