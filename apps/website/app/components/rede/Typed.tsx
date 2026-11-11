"use client";

import { useContext, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import { PreviewCard } from "@base-ui/react/preview-card";
import type { Recommendation, Run } from "./graph";
import { RedeContext } from "./context";
import { ABOUT_ID } from "./graph";
import Glitch from "./Glitch";
import type { GlitchConfig } from "./Glitch";
import { DEFAULT_MARKS, FRAME } from "./hubDials";
import type { Marks } from "./hubDials";

/** Time per character, in ms. */
const CHAR_MS = 22;
/** Pause before the first character, in ms. */
const START_MS = 400;
const CARET = "▍";

const MOTION = "(prefers-reduced-motion: reduce)";
function subscribeMotion(onChange: () => void): () => void {
  const query = window.matchMedia(MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
const prefersReduced = () => window.matchMedia(MOTION).matches;

/** A hover window with one recommendation, styled like the scene's windows. */
function Recommend({
  rec,
  className,
  glitch,
  children,
}: {
  rec: Recommendation;
  className: string;
  glitch: GlitchConfig;
  children: string;
}) {
  const { portal } = useContext(RedeContext);
  // Hover or keyboard focus: the word glitches under its text.
  const [active, setActive] = useState(false);
  return (
    <PreviewCard.Root>
      <PreviewCard.Trigger
        href={rec.href}
        target="_blank"
        rel="noreferrer"
        delay={150}
        closeDelay={200}
        onPointerEnter={() => setActive(true)}
        onPointerLeave={() => setActive(false)}
        onFocus={() => setActive(true)}
        onBlur={() => setActive(false)}
        className={`relative isolate ${className}`}
      >
        <Glitch active={active} config={glitch} />
        {children}
      </PreviewCard.Trigger>
      <PreviewCard.Portal container={portal}>
        <PreviewCard.Positioner side="top" sideOffset={10} collisionPadding={16} className="z-40">
          <PreviewCard.Popup
            className={`${FRAME} flex w-64 origin-(--transform-origin) flex-col gap-2 p-4 transition-[opacity,scale] duration-150 ease-out data-ending-style:scale-97 data-ending-style:opacity-0 data-starting-style:scale-97 data-starting-style:opacity-0 motion-reduce:transition-none`}
          >
            <p className="font-geist-mono text-[10px] uppercase tracking-widest opacity-70">
              recomendação · {rec.kind}
            </p>
            <p className="font-sans text-xl leading-tight">{rec.title}</p>
            {rec.by && <p className="font-sans text-sm opacity-80">{rec.by}</p>}
            {rec.href && (
              <a
                href={rec.href}
                target="_blank"
                rel="noreferrer"
                className="self-start font-geist-mono text-xs underline underline-offset-2"
              >
                abrir →
              </a>
            )}
          </PreviewCard.Popup>
        </PreviewCard.Positioner>
      </PreviewCard.Portal>
    </PreviewCard.Root>
  );
}

function RunText({ run, text, live, marks }: { run: Run; text: string; live: boolean; marks: Marks }) {
  const { revealed, toggleReveal } = useContext(RedeContext);
  // Not typed yet: render nothing, or a marked word's padding and marker show up early.
  if (text.length === 0) return null;
  // Only the live copy gets controls; the hidden copies just hold space or speak.
  if (run.action?.kind === "author") {
    // The name in a box, a + attached to its left that opens the about window.
    const open = revealed.has(ABOUT_ID);
    const plus = (
      <span aria-hidden="true" className={`inline-block transition-transform duration-150 ${open ? "rotate-45" : ""}`}>
        +
      </span>
    );
    const square = `grid w-[1.4em] shrink-0 place-items-center border-r-0 leading-none ${marks.authorBox} ${marks.authorPlus}`;
    return (
      <span className="inline-flex items-stretch align-baseline whitespace-nowrap">
        {live ? (
          <button
            type="button"
            aria-expanded={open}
            aria-label={open ? "Fechar sobre" : "Abrir sobre"}
            onClick={() => toggleReveal(ABOUT_ID)}
            className={`${square} cursor-pointer`}
          >
            {plus}
          </button>
        ) : (
          <span className={square}>{plus}</span>
        )}
        <span className={`${marks.authorBox} ${marks.authorPad} ${marks.authorFill}`}>{text}</span>
      </span>
    );
  }
  if (live && run.action?.kind === "recommend") {
    return (
      <Recommend rec={run.action.rec} className={marks.highlight} glitch={marks.glitch}>
        {text}
      </Recommend>
    );
  }
  // While typing, marked words already look marked.
  if (run.action?.kind === "recommend") return <span className={marks.highlight}>{text}</span>;
  if (run.italic) return <em>{text}</em>;
  if (run.redacted) return <span className="font-redacted">{text}</span>;
  return <>{text}</>;
}

type TypedProps = {
  runs: readonly Run[];
  className?: string;
  style?: CSSProperties;
  /** Time per character, in ms; 0 types it all at once. */
  charMs?: number;
  /** Pause before the first character, in ms. */
  startMs?: number;
  caret?: boolean;
  caretChar?: string;
  /** Classes for marked words and the caret. */
  marks?: Marks;
  /** Called once the last character is in. */
  onDone?: () => void;
};

/**
 * Text that types itself out. A hidden full copy holds the final size, so the
 * window never grows as it types; the typed copy sits on top of it. Screen
 * readers get the whole text at once, and reduced motion skips the typing.
 * Links and hover windows in the text wake up once it's all typed.
 */
export default function Typed({
  runs,
  className,
  style,
  charMs = CHAR_MS,
  startMs = START_MS,
  caret = true,
  caretChar = CARET,
  marks = DEFAULT_MARKS,
  onDone,
}: TypedProps) {
  const total = runs.reduce((n, r) => n + r.text.length, 0);
  const [count, setCount] = useState(0);
  const reduced = useSyncExternalStore(subscribeMotion, prefersReduced, () => false);
  const instant = reduced || charMs <= 0;
  const shown = instant ? total : count;
  const done = shown >= total;

  useEffect(() => {
    if (instant) return;
    let tick: ReturnType<typeof setInterval> | undefined;
    const start = setTimeout(() => {
      tick = setInterval(() => {
        setCount((n) => {
          if (n + 1 >= total) clearInterval(tick);
          return Math.min(total, n + 1);
        });
      }, charMs);
    }, startMs);
    return () => {
      clearTimeout(start);
      clearInterval(tick);
    };
  }, [total, instant, charMs, startMs]);

  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);
  useEffect(() => {
    if (done) onDoneRef.current?.();
  }, [done]);

  // Where each run starts in the whole text.
  const starts = runs.map((_, i) => runs.slice(0, i).reduce((n, r) => n + r.text.length, 0));
  const typed = runs.map((run, i) => (
    <RunText key={i} run={run} live={done} marks={marks} text={run.text.slice(0, Math.max(0, shown - (starts[i] ?? 0)))} />
  ));
  const full = runs.map((run, i) => <RunText key={i} run={run} live={false} marks={marks} text={run.text} />);

  return (
    <p className={`grid ${className ?? ""}`} style={style}>
      {!done && <span className="sr-only">{full}</span>}
      <span aria-hidden="true" className="invisible col-start-1 row-start-1">
        {full}
      </span>
      <span aria-hidden={done ? undefined : true} className="col-start-1 row-start-1">
        {typed}
        {/* Zero width, so the caret never wraps the text past its final size. */}
        {caret && (
          <span aria-hidden="true" className={`inline-block w-0 ${marks.caret} ${done ? "invisible" : ""}`}>
            {caretChar}
          </span>
        )}
      </span>
    </p>
  );
}
