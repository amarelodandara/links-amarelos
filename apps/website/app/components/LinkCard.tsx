import Image from "next/image";

// The site's card for anything that leaves it: a link from the newsletter,
// a podcast episode, a page elsewhere. A yellow tab on top carries where it
// came from and, when the card can be dismissed, a close button; the body
// is the link itself, ending in a pill that says what you will do there.
//
// Interaction states use the link-*/close-* variants from globals.css, so
// /playground/link-card can show them all side by side.
type LinkCardProps = {
  href: string;
  title: string;
  /** The line under the title, e.g. "leia no substack". */
  source: string;
  /** The verb in the pill, e.g. "ler". */
  action: string;
  /** Tab label, e.g. "links amarelos #3". */
  tag?: string;
  /** Shows the close button in the tab. */
  onClose?: () => void;
  closeLabel?: string;
  /** Called as the link is followed, before the new tab opens. */
  onVisit?: () => void;
  className?: string;
};

export default function LinkCard({
  href,
  title,
  source,
  action,
  tag,
  onClose,
  closeLabel = "fechar",
  onVisit,
  className = "",
}: LinkCardProps) {
  return (
    <div className={`flex w-3xs flex-col bg-sun-lighter ${className}`}>
      {(tag || onClose) && (
        <div className="flex h-7 items-center justify-between border border-sun bg-sun pl-2">
          <p className="font-mono text-xs text-black">{tag}</p>
          {onClose && (
            <button
              type="button"
              aria-label={closeLabel}
              onClick={onClose}
              className="flex h-full w-7 items-center justify-center border border-sun-lighter outline-none close-focus:ring-2 close-focus:ring-code close-focus:ring-inset"
            >
              <Image
                src="/icons/link-card-close.svg"
                width={6}
                height={6}
                alt=""
                unoptimized
              />
            </button>
          )}
        </div>
      )}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onVisit}
        className="flex flex-col items-end gap-2 border border-sun px-3 py-2 outline-none link-focus:ring-2 link-focus:ring-code link-focus:ring-inset"
      >
        <span className="flex w-full flex-col">
          <span className="font-sans text-base leading-6 font-medium text-brand-black">
            {title}
          </span>
          <span className="font-mono text-sm leading-5 lowercase text-brand-black/70">
            {source}
          </span>
        </span>
        <span className="flex items-center gap-1.5 rounded-full bg-black px-3 py-0.5">
          <span className="font-mono text-sm leading-6 text-white">
            {action}
          </span>
          <span
            aria-hidden
            className="font-space-mono text-base leading-6 text-white/70"
          >
            ↗
          </span>
        </span>
        <span className="sr-only">(abre em uma nova aba)</span>
      </a>
    </div>
  );
}
