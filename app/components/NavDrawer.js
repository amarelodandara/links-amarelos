"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Popover } from "@base-ui/react/popover";

const pages = [
  {
    href: "/sobre",
    label: "Sobre",
    tagline: "Conheça a história por trás dos links",
  },
  {
    href: "/manifesto",
    label: "Manifesto",
    tagline: "Os quatro princípios que guiam tudo",
  },
  {
    href: "/apoio",
    label: "Apoio",
    tagline: "Faça parte da comunidade",
  },
  {
    href: "/realizacoes",
    label: "Realizações",
    tagline: "Descubra o que o apoio ajuda a realizar",
  },
];

export default function NavDrawer({
  strokeWidth = 1.5,
  strokeColor = "currentColor",
  size = 20,
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);

  const pad = size * 0.1;
  const x1 = pad;
  const x2 = size - pad;
  const yTop = size * 0.25;
  const yMid = size * 0.5;
  const yBot = size * 0.75;
  const gap = size * 0.25;

  const cls = (name) => `hb-line ${name}${open ? " open" : ""}`;

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        ref={triggerRef}
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        className="flex justify-center items-center size-9 cursor-pointer"
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          fill="none"
          className="text-(--sun-dark)"
          style={{ "--hb-gap": `${gap}px` }}
        >
          <line
            className={cls("hb-top")}
            x1={x1} y1={yTop} x2={x2} y2={yTop}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <line
            className={cls("hb-mid")}
            x1={x1} y1={yMid} x2={x2} y2={yMid}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <line
            className={cls("hb-bot")}
            x1={x1} y1={yBot} x2={x2} y2={yBot}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        </svg>
      </Popover.Trigger>

      <Popover.Portal>
        {/* Anchored to the whole <nav> so the panel keeps spanning its full width */}
        <Popover.Positioner
          anchor={() => triggerRef.current?.closest("nav") ?? null}
          side="bottom"
          align="start"
          sideOffset={0}
          className="z-50"
        >
          <Popover.Popup className="w-[var(--anchor-width)] border-b border-(--sun) bg-sun-light transition-[opacity,transform] duration-300 data-[starting-style]:opacity-0 data-[starting-style]:-translate-y-1 data-[ending-style]:opacity-0 data-[ending-style]:-translate-y-1">
            <nav className="flex flex-col">
              {pages.map(({ href, label, tagline }) => (
                <Popover.Close
                  key={href}
                  nativeButton={false}
                  render={
                    <Link
                      href={href}
                      className="flex px-6 py-3 font-manrope items-center gap-2 [&:not(:last-child)]:border-b border-(--sun) hover:bg-(--sun) group text-brand-black md:text-(--sun-dark)"
                    >
                      <span className="font-semibold lowercase text-lg tracking-tight group-hover:text-white transition-colors">
                        {label}
                      </span>
                      <span className="group-hover:text-white transition-colors mt-0.5 lowercase">
                        {tagline}
                      </span>
                    </Link>
                  }
                />
              ))}
            </nav>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
