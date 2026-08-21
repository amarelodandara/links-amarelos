"use client";

// Page-level actions: copy-as-markdown and share.
//
// Feedback is the button itself collapsing into a check — no toast. The only
// thing kept from that is a visually-hidden live region, so the outcome is
// still announced to screen readers rather than being purely visual.
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Button } from "@base-ui/react/button";

// Easing curves from the emil-design-eng guidance: the CSS built-ins are too
// weak to read as intentional. ease-in-out for the on-screen morph, ease-out
// for the check entering.
const EASE_IN_OUT = "cubic-bezier(0.77,0,0.175,1)";
const EASE_OUT = "cubic-bezier(0.23,1,0.32,1)";

const MORPH_MS = 220; // under the 300ms ceiling for UI motion
const SUCCESS_HOLD_MS = 2000; // "a couple of seconds" before reverting
const BUTTON_H = 28; // h-7 — the collapsed circle is exactly this wide

// Soft brand-yellow tint rather than a neutral black wash, which greyed the
// surface down without any hue in it. Small utility controls stay on mono —
// the pixel face is reserved for the primary/secondary CTAs in Button.jsx.
const BUTTON_CLASS =
  "group relative inline-flex h-7 items-center justify-start overflow-hidden rounded-full " +
  "border border-sun-dark/35 bg-sun/15 font-geist-mono text-xs lowercase text-brand-black cursor-pointer " +
  "[touch-action:manipulation] transition-[width,transform,background-color] " +
  "hover:bg-sun/35 active:scale-[0.97] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun-dark/60 focus-visible:ring-offset-1 " +
  "data-[success=true]:bg-sun/60";

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

// matchMedia is an external store, so subscribe to it properly rather than
// mirroring it into state from an effect.
const MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeToMotionPreference(onChange) {
  const query = window.matchMedia(MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

const getMotionPreference = () => window.matchMedia(MOTION_QUERY).matches;
const getServerMotionPreference = () => false;

function CheckIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3.5 8.5 6.5 11.5 12.5 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Collapses leftward into a circle with a check on success, then reverts.
 *
 * The natural width is measured once and pinned on a wrapper so the shrinking
 * button never shoves its neighbour sideways. Wrapper and button are both
 * start-aligned, so the left edge stays put and the pill closes in on its icon
 * instead of pulling toward a centre point.
 */
function ActionButton({ label, icon, onAction, successLabel }) {
  const [succeeded, setSucceeded] = useState(false);
  const [status, setStatus] = useState("");
  const [width, setWidth] = useState(null);
  const buttonRef = useRef(null);
  const timerRef = useRef(null);
  // Read during render and stays live if the OS setting changes mid-session.
  const reduceMotion = useSyncExternalStore(
    subscribeToMotionPreference,
    getMotionPreference,
    getServerMotionPreference,
  );

  useIsomorphicLayoutEffect(() => {
    if (buttonRef.current) {
      setWidth(buttonRef.current.getBoundingClientRect().width);
    }
  }, [label]);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const handleClick = useCallback(async () => {
    const { ok, message } = await onAction();
    setStatus(message ?? "");
    if (!ok) return;

    setSucceeded(true);
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setSucceeded(false);
      setStatus("");
    }, SUCCESS_HOLD_MS);
  }, [onAction]);

  // Reduced motion keeps the state change (the check still appears) but drops
  // the collapse, which is pure movement.
  const collapsed = succeeded && !reduceMotion;

  return (
    <span
      className="inline-flex justify-start"
      style={width ? { width } : undefined}
    >
      <Button
        ref={buttonRef}
        onClick={handleClick}
        data-success={succeeded ? "true" : "false"}
        aria-label={succeeded ? successLabel : undefined}
        className={BUTTON_CLASS}
        style={{
          width: width == null ? undefined : collapsed ? BUTTON_H : width,
          transitionDuration: `${MORPH_MS}ms`,
          transitionTimingFunction: EASE_IN_OUT,
        }}
      >
        {/* Label blurs out rather than hard-cutting, so the two states read as
            one object morphing instead of two swapping. */}
        <span className="flex shrink-0 items-center gap-2 px-3 whitespace-nowrap transition-[opacity,filter] duration-150 ease-out group-data-[success=true]:opacity-0 group-data-[success=true]:blur-[2px]">
          {icon}
          {label}
        </span>

        {/* Pinned to the collapsed circle's box at the left edge, so the check
            lands where the icon was. Starts at 0.9, never 0 — nothing in the
            real world appears out of nothing. */}
        <span
          className="absolute inset-y-0 left-0 flex items-center justify-center opacity-0 scale-90 transition-[opacity,transform] duration-200 group-data-[success=true]:opacity-100 group-data-[success=true]:scale-100"
          style={{ width: BUTTON_H, transitionTimingFunction: EASE_OUT }}
          aria-hidden="true"
        >
          <CheckIcon />
        </span>
      </Button>

      {/* Replaces the toast: the outcome is announced, nothing is drawn. */}
      <span role="status" aria-live="polite" className="sr-only">
        {status}
      </span>
    </span>
  );
}

// Serializes one element's inline content, keeping links as markdown.
function inlineToMarkdown(node) {
  let out = "";
  for (const child of node.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      out += child.textContent;
    } else if (child.nodeName === "A") {
      out += `[${child.textContent.trim()}](${child.href})`;
    } else {
      out += inlineToMarkdown(child);
    }
  }
  return out;
}

function collapse(text) {
  return text.replace(/\s+/g, " ").trim();
}

// Reads the rendered prose rather than duplicating the copy, so the markdown
// cannot drift out of sync with what the page actually says.
function buildMarkdown(targetId, title) {
  const root = document.getElementById(targetId);
  if (!root) return null;

  const blocks = [`# ${title}`];
  for (const el of root.querySelectorAll("h2, p")) {
    const text = collapse(inlineToMarkdown(el));
    if (!text) continue;
    blocks.push(el.tagName === "H2" ? `## ${text}` : text);
  }
  blocks.push(`---\n\n${window.location.href}`);
  return blocks.join("\n\n");
}

function CopyMarkdownButton({ targetId, title }) {
  const copy = useCallback(async () => {
    const markdown = buildMarkdown(targetId, title);
    if (!markdown) return { ok: false, message: "não achei o texto pra copiar" };

    try {
      await navigator.clipboard.writeText(markdown);
      return { ok: true, message: "manifesto copiado como markdown" };
    } catch {
      return { ok: false, message: "não deu pra copiar" };
    }
  }, [targetId, title]);

  return (
    <ActionButton
      label="copiar tudo"
      successLabel="copiado"
      onAction={copy}
      icon={
        <svg
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
          className="shrink-0"
        >
          <path
            d="M5.5 2h5L13 4.5V13a1 1 0 0 1-1 1H5.5a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M3 5v8.5A1.5 1.5 0 0 0 4.5 15H11"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      }
    />
  );
}

function ShareTrigger({ title }) {
  const share = useCallback(async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return { ok: true, message: "compartilhado" };
      } catch (error) {
        // Dismissing the sheet is not a failure — don't fall through to a copy,
        // and don't flash a success state for something the user cancelled.
        if (error?.name === "AbortError") return { ok: false, message: "" };
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      return { ok: true, message: "link copiado" };
    } catch {
      return { ok: false, message: "não deu pra copiar" };
    }
  }, [title]);

  return (
    <ActionButton
      label="compartilhar"
      successLabel="compartilhado"
      onAction={share}
      icon={
        <svg
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
          className="shrink-0"
        >
          <path
            d="M8 10.5V2m0 0L5 5m3-3 3 3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M3 9v3.5A1.5 1.5 0 0 0 4.5 14h7a1.5 1.5 0 0 0 1.5-1.5V9"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      }
    />
  );
}

export default function PageActions({ title, markdownTargetId }) {
  return (
    <div className="flex items-center gap-2">
      {markdownTargetId && (
        <CopyMarkdownButton targetId={markdownTargetId} title={title} />
      )}
      <ShareTrigger title={title} />
    </div>
  );
}
