"use client";

import { useEffect, useState } from "react";
import { PAGES } from "../../lib/pages";
import { NODES } from "./graph";

/**
 * The boot log: one terminal line per thing the network loads, typed out over
 * the HUD, then gone. Built only from data (routes, hosts, status codes), so
 * it carries no copy of its own. Any key or click skips it.
 *
 * Not mounted anywhere: the home opens straight on the map. Kept for a 404
 * or similar route.
 */

type BootLine = { at: string; text: string };

const host = (url: string): string => url.replace(/^https?:\/\//, "").replace(/[?#].*$/, "");

function bootLines(): BootLine[] {
  const targets = [
    "linksamarelos.com",
    ...PAGES.map((p) => `linksamarelos.com${p.href}`),
    ...NODES.flatMap((n) => (n.kind === "edition" ? n.ctas.map((c) => host(c.href)) : [])),
    ...NODES.flatMap((n) => (n.kind === "social" ? [host(n.href)] : [])),
  ];
  return [...new Set(targets)].map((t, i) => ({
    at: `[${(0.0371 * (i + 1) + 0.0123 * ((i * 7) % 5)).toFixed(6).padStart(10, " ")}]`,
    text: `GET ${t}`,
  }));
}

const LINES = bootLines();
const LINE_MS = 70;
const HOLD_MS = 350;

type BootProps = { onDone: () => void };

export default function Boot({ onDone }: BootProps) {
  const [shown, setShown] = useState(0);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const total = LINES.length * LINE_MS + HOLD_MS;
    const tick = setInterval(() => setShown((n) => Math.min(LINES.length, n + 1)), LINE_MS);
    const leave = setTimeout(() => setLeaving(true), total);
    const done = setTimeout(onDone, total + 300);
    const skip = () => onDone();
    window.addEventListener("keydown", skip);
    window.addEventListener("pointerdown", skip);
    return () => {
      clearInterval(tick);
      clearTimeout(leave);
      clearTimeout(done);
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
    };
  }, [onDone]);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-50 bg-pen p-6 font-geist-mono text-sm leading-relaxed text-paint transition-opacity duration-300 md:p-10"
      style={{ opacity: leaving ? 0 : 1 }}
    >
      <p>_ linksamarelos.com</p>
      <div className="mt-4">
        {LINES.slice(0, shown).map((line) => (
          <p key={line.text} className="break-all">
            <span className="opacity-60">{line.at}</span> {line.text} <span className="text-sun">200</span>
          </p>
        ))}
      </div>
      <p className="mt-4 animate-pulse">_</p>
    </div>
  );
}
