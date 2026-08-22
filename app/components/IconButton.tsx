"use client";

import type { ReactNode } from "react";
import { Tooltip } from "@base-ui/react/tooltip";

// Icon-only controls have no visible text, so `label` does double duty: it is
// the accessible name and the tooltip copy. These used to be bare <button>s
// carrying only a `title` attribute, which is not an accessible name, is not
// reachable from the keyboard, and never appears on touch.
type IconButtonProps = {
  label: string;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
  /** The icon. Decorative — `label` is what gets announced. */
  children: ReactNode;
};

export default function IconButton({
  label,
  onClick,
  className = "",
  disabled = false,
  children,
}: IconButtonProps) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        className={className}
      >
        <span aria-hidden="true" className="flex">
          {children}
        </span>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Positioner side="top" sideOffset={8}>
          <Tooltip.Popup className="rounded-sm border border-sun-light bg-white px-2 py-1 font-space-mono text-xs lowercase text-stone-900 shadow-sm">
            {label}
            <Tooltip.Arrow className="size-2 -mt-1 rotate-45 border-b border-r border-sun-light bg-white" />
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
