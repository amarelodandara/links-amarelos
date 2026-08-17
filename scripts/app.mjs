// @ts-check
/**
 * Sobe o app de 3 colunas: servidor local (gravação + render), watch de
 * /content e o Vite da interface. Ctrl-C derruba os três.
 *
 * Mesmo padrão de supervisor do scripts/studio.mjs — sem `&` no npm script, pra
 * não deixar processo órfão.
 */
import { spawn } from "node:child_process";
import { root } from "./lib/editions.mjs";

const UI_PORT = process.env.APP_PORT ?? "3020";

/** @type {import("node:child_process").ChildProcess[]} */
const children = [];
let shuttingDown = false;

const shutdown = (code) => {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (child.exitCode === null && child.signalCode === null) child.kill("SIGTERM");
  }
  process.exit(code);
};

const start = (command, args) => {
  const child = spawn(command, args, { stdio: "inherit", cwd: root });
  children.push(child);
  child.on("exit", (code, signal) => {
    if (shuttingDown) return;
    shutdown(signal ? 1 : (code ?? 0));
  });
  return child;
};

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => shutdown(0));
}

start(process.execPath, ["scripts/server.mjs"]);
start(process.execPath, ["scripts/watch-editions.mjs"]);
start("npx", ["vite", "--port", UI_PORT]);
