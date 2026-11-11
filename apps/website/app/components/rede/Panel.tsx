"use client";

import type { RefObject } from "react";
import Image from "next/image";
import { Dialog } from "@base-ui/react/dialog";
import Button from "../Button";
import ExternalLinkPill from "../ExternalLinkPill";
import CountdownOdometer from "../CountdownOdometer";
import type { RedeNode } from "./graph";

type PanelProps = {
  /** The station shown; kept after closing so the exit animation has content. */
  node: RedeNode | null;
  open: boolean;
  onClose: () => void;
  /** Where focus goes back to on close: the station that opened the panel. */
  returnFocus: () => HTMLElement | null;
  /** The network root: the panel renders inside it so the theme roles apply. */
  container: RefObject<HTMLElement | null>;
};

const TITLE = "font-serif text-3xl leading-tight text-(--rede-panel-ink)";
const BODY = "font-serif text-lg leading-snug text-(--rede-panel-ink)";
const KICKER = "font-geist-mono text-xs uppercase tracking-widest text-(--rede-panel-ink) opacity-70";

function Content({ node }: { node: RedeNode }) {
  switch (node.kind) {
    case "hub":
      return (
        <>
          <Dialog.Title className={TITLE}>{node.label}</Dialog.Title>
          <Dialog.Description className={BODY}>{node.blurb}</Dialog.Description>
        </>
      );
    case "page":
      return (
        <>
          <p className={KICKER}>{node.page.href}</p>
          <Dialog.Title className={TITLE}>{node.page.label}</Dialog.Title>
          <Dialog.Description className={BODY}>{node.page.tagline}</Dialog.Description>
          <Button variant="primary" href={node.page.href} className="mt-2 self-start text-sm">
            {node.page.label} →
          </Button>
        </>
      );
    case "edition":
      return (
        <>
          {node.upcoming && (
            <p className={`${KICKER} flex items-center justify-between gap-4`}>
              <span>Próximas edições</span>
              <CountdownOdometer />
            </p>
          )}
          <div className="flex gap-3">
            {node.covers.map((src) => (
              <Image
                key={src}
                src={src}
                alt=""
                width={400}
                height={400}
                className="size-28 rounded-sm border-2 border-(--rede-panel-ink) object-cover"
              />
            ))}
          </div>
          <Dialog.Title className={TITLE}>
            {node.names.map((name) => (
              <span key={name} className="block">
                {name}
              </span>
            ))}
          </Dialog.Title>
          {node.blurb.length > 0 && (
            <Dialog.Description className={BODY}>
              {node.blurb.map((run, i) =>
                run.redacted ? (
                  <span key={i} className="font-redacted">
                    {run.text}
                  </span>
                ) : (
                  <span key={i}>{run.text}</span>
                ),
              )}
            </Dialog.Description>
          )}
          {node.ctas.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {node.ctas.map((cta) => (
                <ExternalLinkPill key={cta.platform} platform={cta.platform} href={cta.href} className="flex bg-paint" />
              ))}
            </div>
          )}
        </>
      );
    case "social":
      return (
        <>
          <Dialog.Title className={TITLE}>{node.platform === "substack" ? "Substack" : "Spotify"}</Dialog.Title>
          <ExternalLinkPill platform={node.platform} href={node.href} className="flex self-start bg-paint" />
        </>
      );
  }
}

/** The detail panel: the HUD's front layer, opened by selecting a station. Non-modal, so the network stays usable. */
export default function Panel({ node, open, onClose, returnFocus, container }: PanelProps) {
  return (
    <Dialog.Root
      open={open}
      modal={false}
      disablePointerDismissal
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <Dialog.Portal container={container}>
        <Dialog.Popup
          finalFocus={() => returnFocus() ?? true}
          className="rede-panel flex flex-col gap-4 rounded-lg border-[3px] border-(--rede-panel-ink) bg-(--rede-panel) p-6 shadow-[8px_8px_0_0_var(--rede-panel-ink)]"
        >
          {node && <Content node={node} />}
          <Dialog.Close
            aria-label="Fechar"
            className="absolute right-3 top-3 grid size-9 place-items-center rounded-md border-2 border-(--rede-panel-ink) font-geist-mono text-sm text-(--rede-panel-ink) hover:bg-(--rede-panel-ink) hover:text-(--rede-panel) focus-visible:outline-2 focus-visible:outline-(--rede-accent)"
          >
            esc
          </Dialog.Close>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
