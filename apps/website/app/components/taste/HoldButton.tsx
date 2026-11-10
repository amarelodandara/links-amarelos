"use client";

import type { KeyboardEvent, PointerEvent } from "react";
import { useEffect, useRef } from "react";
import { Button as BaseButton } from "@base-ui/react/button";

const HOLD_MS = 900;
// Letting go drains the charge slower than it filled, so an interrupted hold
// eases back to rest instead of snapping.
const DRAIN_MS = 1400;

type HoldButtonProps = {
  children: string;
  disabled?: boolean;
  /** Fired once each time a hold reaches the end. */
  onComplete: () => void;
  /** Raw 0 → 1 charge, every frame it changes. */
  onProgress: (progress: number) => void;
};

/** A hold-to-confirm button. Pointer and keyboard (Space / Enter) both charge
 *  it; the charge lives in a ref and reaches the page through `onProgress`
 *  and the `--hold` custom property, never React state, so holding does not
 *  re-render anything. */
export default function HoldButton({
  children,
  disabled = false,
  onComplete,
  onProgress,
}: HoldButtonProps) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const progressRef = useRef(0);
  const holdingRef = useRef(false);
  const rafRef = useRef(0);
  const lastRef = useRef(0);

  // Callbacks change identity every parent render; the loop reads the latest.
  const onCompleteRef = useRef(onComplete);
  const onProgressRef = useRef(onProgress);
  useEffect(() => {
    onCompleteRef.current = onComplete;
    onProgressRef.current = onProgress;
  });

  // Kicks the charge loop if it is idle. Filled in by the effect below, which
  // owns the loop so the frame function can schedule itself.
  const wakeRef = useRef<() => void>(() => {});

  useEffect(() => {
    function tick(now: number) {
      const dt = lastRef.current ? now - lastRef.current : 16;
      lastRef.current = now;

      let progress = progressRef.current;
      if (holdingRef.current) {
        progress = Math.min(1, progress + dt / HOLD_MS);
        if (progress >= 1) {
          // One hold, one link: the charge must be released and pressed again.
          holdingRef.current = false;
          onCompleteRef.current();
        }
      } else {
        progress = Math.max(0, progress - dt / DRAIN_MS);
      }

      progressRef.current = progress;
      buttonRef.current?.style.setProperty("--hold", String(progress));
      onProgressRef.current(progress);

      if (holdingRef.current || progress > 0) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = 0;
        lastRef.current = 0;
      }
    }

    wakeRef.current = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const setHolding = (holding: boolean) => {
    holdingRef.current = holding;
    wakeRef.current();
  };

  useEffect(() => {
    if (disabled) holdingRef.current = false;
  }, [disabled]);

  const onPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (disabled || event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setHolding(true);
  };
  const release = () => setHolding(false);

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== " " && event.key !== "Enter") return;
    // Enter would also fire a click; the hold is the only way to confirm.
    event.preventDefault();
    if (disabled || event.repeat) return;
    setHolding(true);
  };
  const onKeyUp = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === " " || event.key === "Enter") release();
  };

  return (
    <BaseButton
      ref={buttonRef}
      disabled={disabled}
      focusableWhenDisabled
      onPointerDown={onPointerDown}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
      onBlur={release}
      onContextMenu={(event) => event.preventDefault()}
      aria-description="segure para confirmar"
      data-hold-button=""
      className="group relative shrink-0 overflow-hidden whitespace-nowrap rounded-full bg-brand-black px-7 py-3.5 font-geist-pixel-square text-brand-white select-none touch-none [-webkit-touch-callout:none] outline-none focus-visible:ring-2 focus-visible:ring-code focus-visible:ring-offset-2 focus-visible:ring-offset-sun-lighter transition-[scale,opacity] duration-150 ease-out active:scale-[0.97] data-disabled:opacity-40 data-disabled:active:scale-100"
    >
      {/* The charge: sun fill sweeping in from the left. scaleX, not width,
          so it stays on the compositor. */}
      <span
        aria-hidden
        className="absolute inset-0 origin-left bg-(--sun) [transform:scaleX(var(--hold,0))]"
      />
      <span className="relative">{children}</span>
      {/* Dark copy of the label, revealed by the same charge, so the text
          stays legible on top of the fill. */}
      <span
        aria-hidden
        className="absolute inset-0 flex items-center justify-center text-brand-black [clip-path:inset(0_calc((1-var(--hold,0))*100%)_0_0)]"
      >
        {children}
      </span>
    </BaseButton>
  );
}
