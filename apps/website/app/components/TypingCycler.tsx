"use client";

// The cycling domain in the manifesto's opening line.
//
// Three things the raw <TypeAnimation> could not do on its own:
//   1. It types forever. Auto-playing motion that runs past five seconds needs
//      a pause/stop control, so the whole thing is wrapped in a Base UI Toggle.
//   2. Under prefers-reduced-motion it must not type at all — it renders the
//      first domain as plain text instead.
//   3. A character-by-character mutation is noise for a screen reader, so the
//      animation is aria-hidden and the sentence gets one static reading.
import { useState, useSyncExternalStore } from "react";
import { Toggle } from "@base-ui/react/toggle";
import { TypeAnimation } from "react-type-animation";

const DOMAINS = ["insta", "tiktok", "x"];
const HOLD_MS = 2000;

const SEQUENCE = DOMAINS.flatMap((domain) => [domain, HOLD_MS]);

const MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeToMotionPreference(onChange: () => void) {
  const query = window.matchMedia(MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

const getMotionPreference = () => window.matchMedia(MOTION_QUERY).matches;
const getServerMotionPreference = () => false;

function PlayIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      <path d="M2 1.2 8.4 5 2 8.8Z" fill="currentColor" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      <rect x="2" y="1.4" width="2.2" height="7.2" rx="0.6" fill="currentColor" />
      <rect x="5.8" y="1.4" width="2.2" height="7.2" rx="0.6" fill="currentColor" />
    </svg>
  );
}

export default function TypingCycler() {
  const reduceMotion = useSyncExternalStore(
    subscribeToMotionPreference,
    getMotionPreference,
    getServerMotionPreference,
  );
  // null = follow the OS preference. Once the reader touches the toggle their
  // choice wins in both directions, including opting back into the animation
  // on a machine that asks for reduced motion.
  // null means "no explicit choice yet", so the media query still decides.
  const [choice, setChoice] = useState<boolean | null>(null);
  const playing = choice ?? !reduceMotion;
  const paused = !playing;

  return (
    // Plain inline, not inline-flex: at text-3xl on a narrow screen an
    // unbreakable "https://tiktok ⏸" unit overflows the column.
    <span>
      <span className="font-space-mono bg-sun px-1">
        https://
        {/* data-md="skip" keeps the half-typed word out of "copiar tudo" —
            the sr-only span below is what gets serialized instead. */}
        <span aria-hidden="true" data-md="skip">
          {playing ? (
            <TypeAnimation
              sequence={SEQUENCE}
              repeat={Infinity}
              cursor={true}
              speed={60}
              deletionSpeed={80}
            />
          ) : (
            DOMAINS[0]
          )}
        </span>
      </span>

      {/* One static reading of what the animation is cycling through. */}
      <span className="sr-only">
        {`${DOMAINS.slice(0, -1).join(", ")} ou ${DOMAINS.at(-1)}`}
      </span>
      {/* The sentence's full stop lives here so the control sits after it
          rather than between the domain and the period. */}
      .
      <Toggle
        pressed={paused}
        onPressedChange={(pressed) => setChoice(!pressed)}
        aria-label={
          paused ? "Retomar a animação do domínio" : "Pausar a animação do domínio"
        }
        data-md="skip"
        className="ml-1.5 inline-flex align-middle size-5 items-center justify-center rounded-full border border-brand-black/20 text-brand-black/50 opacity-60 cursor-pointer [touch-action:manipulation] transition-[opacity,color,background-color] hover:bg-brand-black/5 hover:text-brand-black hover:opacity-100 focus-visible:outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-sun-dark focus-visible:ring-offset-1"
      >
        {paused ? <PlayIcon /> : <PauseIcon />}
      </Toggle>
    </span>
  );
}
