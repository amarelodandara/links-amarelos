"use client";

import type { CSSProperties, MouseEvent, ReactNode } from "react";
import Image from "next/image";
import { Logo, PRESETS } from "@links/brand/logo";
import type { LogoConfig } from "@links/brand/logo";
import SubstackIcon from "../icons/SubstackIcon";
import SpotifyIcon from "../icons/SpotifyIcon";
import { PLATFORM_NAME, nodeHref, nodeTitle } from "./graph";
import type { RedeNode } from "./graph";

type StationProps = {
  node: RedeNode;
  selected: boolean;
  onSelect: (id: string) => void;
  onFocusVisible: (id: string) => void;
  register: (id: string, el: HTMLAnchorElement | null) => void;
};

const MASTER = PRESETS.find((p) => p.id === "master-logo") ?? PRESETS[0];
const HUB_LOGO: LogoConfig = { ...MASTER.config, backdrop: false };

/** Pixel-font name tag under a station, like a metro station label. */
function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="mt-3 block w-max max-w-72 mx-auto rounded-sm border-2 border-(--rede-ink) bg-(--rede-station) px-2.5 py-1.5 text-center font-geist-pixel-square text-xl leading-tight text-(--rede-ink)">
      {children}
    </span>
  );
}

function Body({ node }: { node: RedeNode }) {
  switch (node.kind) {
    case "hub":
      return (
        <span className="rede-station-body grid size-60 place-items-center rounded-full border-[6px] border-(--rede-station) bg-(--rede-ink)">
          <Logo config={HUB_LOGO} size={190} />
        </span>
      );
    case "page":
      return (
        <>
          <span className="rede-station-body mx-auto grid size-28 place-items-center rounded-md border-[6px] border-(--rede-line-paginas) bg-(--rede-station) font-geist-pixel-square text-5xl text-(--rede-ink)">
            {node.page.label.slice(0, 1)}
          </span>
          <Tag>{node.page.label}</Tag>
        </>
      );
    case "edition": {
      const style: CSSProperties = node.upcoming ? { borderStyle: "dashed" } : {};
      return (
        <>
          <span
            className="rede-station-body relative mx-auto block size-44 rounded-md border-[6px] border-(--rede-line-edicoes) bg-(--rede-station)"
            style={style}
          >
            {node.covers.map((src, i) => (
              <Image
                key={src}
                src={src}
                alt=""
                width={240}
                height={240}
                className="absolute inset-2 size-[calc(100%-1rem)] rounded-sm object-cover shadow-md"
                style={{
                  rotate: node.covers.length > 1 ? `${i === 0 ? -6 : 6}deg` : "0deg",
                  opacity: node.upcoming ? 0.7 : 1,
                }}
              />
            ))}
          </span>
          {node.names.map((name) => (
            <Tag key={name}>{name}</Tag>
          ))}
        </>
      );
    }
    case "social": {
      const Icon = node.platform === "substack" ? SubstackIcon : SpotifyIcon;
      return (
        <>
          <span className="rede-station-body mx-auto grid size-28 place-items-center rounded-full border-[6px] border-(--rede-line-redes) bg-(--rede-station)">
            <Icon className="size-12" />
          </span>
          <Tag>{PLATFORM_NAME[node.platform].name}</Tag>
        </>
      );
    }
  }
}

/**
 * One station: a real link to where it leads (so it crawls, middle-clicks and
 * opens in a new tab), but a plain click selects it and opens the panel.
 */
export default function Station({ node, selected, onSelect, onFocusVisible, register }: StationProps) {
  const external = !nodeHref(node).startsWith("/");

  function onClick(e: MouseEvent<HTMLAnchorElement>) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    onSelect(node.id);
  }

  return (
    <a
      ref={(el) => register(node.id, el)}
      href={nodeHref(node)}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      aria-label={nodeTitle(node)}
      aria-current={selected ? "true" : undefined}
      data-selected={selected ? "" : undefined}
      className="rede-station block cursor-pointer [touch-action:manipulation]"
      style={{ left: node.at.x, top: node.at.y }}
      onClick={onClick}
      onFocus={(e) => {
        if (e.currentTarget.matches(":focus-visible")) onFocusVisible(node.id);
      }}
      draggable={false}
    >
      <Body node={node} />
    </a>
  );
}
