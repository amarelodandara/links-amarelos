import Button from "./Button";

export type TimelineItem = {
  ano: string;
  titulo: string;
  desc: string;
  href?: string;
  cta?: string;
};

function TimelineContent({ item }: { item: TimelineItem }) {
  const isInternal = item.href?.startsWith("/");
  return (
    <div className="space-y-1.5 min-w-0">
      <p className="font-space-mono text-xs text-brand-black/50">{item.ano}</p>
      <p className="font-manrope font-semibold text-brand-black leading-snug">
        {item.titulo}
      </p>
      <p className="font-manrope text-sm text-brand-black/70 leading-relaxed">
        {item.desc}
      </p>
      {item.href && (
        <Button
          variant={isInternal ? "primary" : "ghost"}
          href={item.href}
          className="text-xs mt-2"
        >
          {item.cta}
        </Button>
      )}
    </div>
  );
}

export default function Timeline({ items }: { items: readonly TimelineItem[] }) {
  return (
    <div className="relative flex flex-col md:flex-row md:justify-start">
      {/* Track: vertical on the left on mobile, horizontal through the middle on desktop */}
      <div className="absolute left-1.5 top-0 bottom-0 w-0.5 md:left-0 md:right-0 md:top-1/2 md:bottom-auto md:w-auto md:h-0.5 bg-sun-light" />

      {items.map((item, i) => {
        const above = i % 2 === 1;
        return (
          <div key={item.ano} className="relative flex md:flex-col">
            {/* Mobile: dot + content in a single vertical row */}
            <div className="flex md:hidden gap-4 pb-10">
              <div className="size-3 rounded-full bg-sun-lighter shrink-0 mt-1.5 z-10" />
              <TimelineContent item={item} />
            </div>

            {/* Desktop: alternating zig-zag around the horizontal line */}
            <div className="hidden md:contents">
              <div
                className={`min-h-36 flex items-end pb-10 ${above ? "" : "invisible"}`}
              >
                {above && <TimelineContent item={item} />}
              </div>
              <div className="absolute left-0 top-1/2 -translate-y-1/2 size-3 rounded-full bg-sun-lighter z-10" />
              <div
                className={`min-h-36 flex items-start pt-10 ${above ? "invisible" : ""}`}
              >
                {!above && <TimelineContent item={item} />}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
