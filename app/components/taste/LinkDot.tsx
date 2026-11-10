"use client";

import { Popover } from "@base-ui/react/popover";
import type { Link } from "../../data/links";
import { editionsOf } from "../../data/links";
import LinkCard from "../LinkCard";

type LinkDotProps = {
  link: Link;
  open: boolean;
  /** False while the view closes in on the field — the dots are moving too
   *  fast to aim at. */
  interactive: boolean;
  onOpenChange: (open: boolean) => void;
  onVisit: () => void;
  /** TasteSection moves the dot every frame by writing its transform. */
  dotRef: (element: HTMLButtonElement | null) => void;
};

const hostname = (url: string) => new URL(url).hostname.replace(/^www\./, "");

// What the card says you will do at the other end, by where the link goes.
// Anywhere not listed gets its bare hostname.
const DESTINATIONS = [
  { hosts: ["youtube.com", "youtu.be"], source: "assista no youtube", action: "ver" },
  { hosts: ["tiktok.com"], source: "assista no tiktok", action: "ver" },
  { hosts: ["substack.com"], source: "leia no substack", action: "ler" },
  { hosts: ["open.spotify.com"], source: "ouça no spotify", action: "ouvir" },
  { hosts: ["itch.io"], source: "jogue no itch.io", action: "jogar" },
  { hosts: ["x.com"], source: "veja no x", action: "ver" },
] satisfies { hosts: string[]; source: string; action: string }[];

function destinationOf(url: string): { source: string; action: string } {
  const host = hostname(url);
  const match = DESTINATIONS.find((destination) =>
    destination.hosts.some((h) => host === h || host.endsWith(`.${h}`)),
  );
  return match
    ? { source: match.source, action: match.action }
    : { source: host, action: "abrir" };
}

/** One link on the field: an invisible hit target over its WebGL sphere
 *  (which turns blue once visited), and the card that grows out of it. The circle only opens the card; the card is
 *  what opens the link, so a stray tap on the field never leaves the page. */
export default function LinkDot({
  link,
  open,
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
        className={`absolute top-0 left-0 size-8 rounded-full outline-none will-change-transform focus-visible:ring-2 focus-visible:ring-code focus-visible:ring-offset-2 ${
          interactive ? "cursor-pointer" : "!pointer-events-none"
        }`}
      />
      <Popover.Portal>
        <Popover.Positioner
          side="top"
          sideOffset={10}
          collisionPadding={12}
          className="z-30"
        >
          <Popover.Popup
            aria-label={link.title}
            // Cards also open on their own when a link lands, often while
            // the hold button is being pressed again. Moving focus then
            // would blur the button and cancel that hold, so focus only
            // follows a card someone opened or closed from the keyboard.
            initialFocus={(type) => type === "keyboard"}
            finalFocus={(type) => type === "keyboard"}
            className="origin-(--transform-origin) outline-none transition-[scale,opacity] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] data-ending-style:scale-50 data-ending-style:opacity-0 data-ending-style:duration-150 data-ending-style:ease-out data-starting-style:scale-50 data-starting-style:opacity-0"
          >
            <LinkCard
              href={link.url}
              title={link.title}
              tag={
                editions.length > 0
                  ? editions
                      .map((edition) => `links amarelos #${edition.number}`)
                      .join(" · ")
                  : undefined
              }
              {...destinationOf(link.url)}
              onVisit={onVisit}
              onClose={() => onOpenChange(false)}
              closeLabel="pular este link"
            />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
