"use client";

import { Popover } from "@base-ui/react/popover";
import type { Link } from "../../data/links";
import { editionsOf } from "../../data/links";

type LinkDotProps = {
  link: Link;
  open: boolean;
  visited: boolean;
  /** False while the field collapses — the dots are on their way out. */
  interactive: boolean;
  onOpenChange: (open: boolean) => void;
  onVisit: () => void;
  /** TasteSection moves the dot every frame by writing its transform. */
  dotRef: (element: HTMLButtonElement | null) => void;
};

const hostname = (url: string) => new URL(url).hostname.replace(/^www\./, "");

/** One link on the field: a yellow circle that turns blue once visited, and
 *  the card that grows out of it. The circle only opens the card; the card is
 *  what opens the link, so a stray tap on the field never leaves the page. */
export default function LinkDot({
  link,
  open,
  visited,
  interactive,
  onOpenChange,
  onVisit,
  dotRef,
}: LinkDotProps) {
  const editions = editionsOf(link);

  return (
    <Popover.Root
      open={open && interactive}
      onOpenChange={(next, details) => {
        // Pressing the hold button again is not a request to dismiss the
        // card that just introduced itself — often the press that released
        // this very link is still going.
        if (
          !next &&
          details.reason === "outside-press" &&
          details.event.target instanceof Element &&
          details.event.target.closest("[data-hold-button]")
        ) {
          return;
        }
        onOpenChange(next);
      }}
    >
      <Popover.Trigger
        ref={dotRef}
        openOnHover
        delay={120}
        closeDelay={200}
        disabled={!interactive}
        aria-label={link.title}
        // Positioned from the top-left of the stage; TasteSection writes
        // translate, scale, opacity, z-index and pointer-events every frame.
        // Starts off-canvas so there is no flash at 0,0 before the first one.
        style={{ transform: "translate(-100px, -100px)" }}
        className={`absolute top-0 left-0 size-8 rounded-full border-2 border-brand-black outline-none will-change-transform transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-code focus-visible:ring-offset-2 ${
          visited ? "bg-code" : "bg-(--sun)"
        } ${interactive ? "cursor-pointer" : "!pointer-events-none"}`}
      />
      <Popover.Portal>
        <Popover.Positioner
          side="top"
          sideOffset={10}
          collisionPadding={12}
          className="z-30"
        >
          <Popover.Popup
            // Cards also open on their own when a link lands, often while
            // the hold button is being pressed again. Moving focus then
            // would blur the button and cancel that hold, so focus only
            // follows a card someone opened or closed from the keyboard.
            initialFocus={(type) => type === "keyboard"}
            finalFocus={(type) => type === "keyboard"}
            className="relative w-64 origin-(--transform-origin) rounded-2xl border border-brand-black bg-brand-white text-brand-black shadow-[0.25rem_0.25rem_0] shadow-brand-black/15 outline-none transition-[scale,opacity] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] data-ending-style:scale-50 data-ending-style:opacity-0 data-ending-style:duration-150 data-ending-style:ease-out data-starting-style:scale-50 data-starting-style:opacity-0">
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onVisit}
              className="block rounded-2xl p-4 pr-10 outline-none hover:bg-sun-lighter focus-visible:ring-2 focus-visible:ring-code"
            >
              <Popover.Title className="font-manrope text-lg font-bold leading-snug tracking-tight">
                {link.title}
              </Popover.Title>
              {link.authors.length > 0 && (
                <p className="mt-1 font-manrope text-sm">
                  por {link.authors.join(", ")}
                </p>
              )}
              <p className="mt-3 flex items-center justify-between gap-2 font-space-mono text-xs lowercase text-brand-black/70">
                <span className="truncate">{hostname(link.url)}</span>
                <span aria-hidden>↗</span>
              </p>
              {editions.length > 0 && (
                <p className="mt-2 border-t border-brand-black/15 pt-2 font-space-mono text-xs lowercase text-brand-black/70">
                  {editions
                    .map((edition) => `links amarelos #${edition.number}`)
                    .join(" · ")}
                </p>
              )}
            </a>
            <Popover.Close
              aria-label="pular este link"
              className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full text-brand-black/60 outline-none hover:bg-brand-black/10 hover:text-brand-black focus-visible:ring-2 focus-visible:ring-code"
            >
              <svg aria-hidden viewBox="0 0 12 12" className="size-3">
                <path
                  d="M2 2l8 8M10 2l-8 8"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </Popover.Close>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
