// @ts-check
/**
 * Sobe o Remotion Studio junto com o watch de /content, para que o form da
 * composition `Editor` tenha efeito imediato: gravou o `edition.json`, o índice
 * é regenerado e as compositions da edição aparecem no seletor.
 *
 * Um supervisor pequeno em vez de `&` no npm script — assim Ctrl-C derruba os
 * dois processos, sem deixar watch órfão.
 */
import { spawn } from "node:child_process";
import { root } from "./lib/editions.mjs";

/** @type {import("node:child_process").ChildProcess[]} */
const children = [];
let shuttingDown = false;

const start = (command, args) => {
  const child = spawn(command, args, { stdio: "inherit", cwd: root });
  children.push(child);

  child.on("exit", (code, signal) => {
    if (shuttingDown) return;
    shutdown(signal ? 1 : (code ?? 0));
  });

  return child;
};

const shutdown = (code) => {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (child.exitCode === null && child.signalCode === null) child.kill("SIGTERM");
  }
  process.exit(code);
};

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => shutdown(0));
}

start(process.execPath, ["scripts/watch-editions.mjs"]);
start("npx", ["remotion", "studio"]);
