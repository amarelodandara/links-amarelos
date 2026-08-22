'use client';

import { useState, useEffect, useRef } from 'react';
import LinksLogotype from './icons/LinksLogotype';
import HyperlinksLogo from './icons/HyperlinksLogo';
import OndasLogotype from './icons/OndasLogotype';

const INITIAL_DELAY = 2000;
const STEP_INTERVAL = 3000;  // between each logo in a cycle
const REST_INTERVAL = 60000; // pause between cycles
const ANIM_MS = 600;

const MOTION_QUERY = "(prefers-reduced-motion: reduce)";

// `interactive` only controls the cursor: in the nav the odometer sits inside a
// <Link> and should read as clickable, in the footer it is decoration and a
// pointer cursor there promises a click that does nothing.
export default function LogoOdometer({ interactive = false }: { interactive?: boolean }) {
  const [stripIdx, setStripIdx] = useState(3);
  const [withTransition, setWithTransition] = useState(true);
  const stepRef = useRef(0);
  const reduceMotionRef = useRef(false);
  const isAnimatingRef = useRef(false);
  const isCyclingRef = useRef(false);
  // undefined rather than null: clearTimeout accepts it, and both are equally
  // a no-op before the first schedule.
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function advance() {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;

    const next = (stepRef.current + 1) % 3;
    stepRef.current = next;

    if (next === 0) {
      setWithTransition(true);
      setStripIdx(0);
      setTimeout(() => {
        setWithTransition(false);
        setStripIdx(3);
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            setWithTransition(true);
            isAnimatingRef.current = false;
          })
        );
      }, ANIM_MS + 50);
    } else {
      setWithTransition(true);
      setStripIdx(3 - next);
      setTimeout(() => {
        isAnimatingRef.current = false;
      }, ANIM_MS);
    }
  }

  function scheduleStep(remaining: number) {
    if (remaining <= 0) {
      isCyclingRef.current = false;
      timerRef.current = setTimeout(startCycle, REST_INTERVAL);
      return;
    }
    advance();
    timerRef.current = setTimeout(() => scheduleStep(remaining - 1), STEP_INTERVAL);
  }

  function startCycle() {
    isCyclingRef.current = true;
    scheduleStep(3);
  }

  useEffect(() => {
    // Purely decorative loop — it never starts when the OS asks for reduced
    // motion, and it stops if that preference is turned on mid-session.
    const query = window.matchMedia(MOTION_QUERY);

    const apply = () => {
      reduceMotionRef.current = query.matches;
      clearTimeout(timerRef.current);
      if (query.matches) {
        isCyclingRef.current = false;
        return;
      }
      timerRef.current = setTimeout(startCycle, INITIAL_DELAY);
    };

    apply();
    query.addEventListener("change", apply);
    return () => {
      query.removeEventListener("change", apply);
      clearTimeout(timerRef.current);
    };
  }, []);

  function handleMouseEnter() {
    if (reduceMotionRef.current || isCyclingRef.current) return;
    clearTimeout(timerRef.current);
    startCycle();
  }

  return (
    <div
      className={`h-4 md:h-5 overflow-hidden min-w-[120px] md:min-w-[160px] ${
        interactive ? "cursor-pointer" : ""
      }`}
      onMouseEnter={handleMouseEnter}
    >
      <div
        style={{
          transform: `translateY(${-(stripIdx * 25)}%)`,
          transition: withTransition
            ? `transform ${ANIM_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`
            : 'none',
        }}
      >
        <div className="h-4 md:h-5 flex items-center"><LinksLogotype className="h-4 md:h-5 w-auto" /></div>
        <div className="h-4 md:h-5 flex items-center"><OndasLogotype className="h-4 md:h-5 w-auto" /></div>
        <div className="h-4 md:h-5 flex items-center"><HyperlinksLogo className="h-4 md:h-5 w-auto" /></div>
        <div className="h-4 md:h-5 flex items-center"><LinksLogotype className="h-4 md:h-5 w-auto" /></div>
      </div>
    </div>
  );
}
