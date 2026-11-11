"use client";

import { useContext } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import Button from "../Button";
import ExternalLinkPill from "../ExternalLinkPill";
import CountdownOdometer from "../CountdownOdometer";
import { nodeTitle } from "./graph";
import type { RedeNode, Run } from "./graph";
import type { Layer } from "./scene";
import Typed from "./Typed";
import { RedeContext } from "./context";
import { FRAME, HubLookContext } from "./hubDials";

const TITLE = "font-sans text-3xl leading-tight text-(--rede-window-ink) outline-none";
const BODY = "font-sans text-lg leading-snug text-(--rede-window-ink)";
const KICKER = "font-geist-mono text-xs uppercase tracking-widest text-(--rede-window-ink) opacity-70";

function HubIntro({ runs }: { runs: readonly Run[] }) {
  const { spawn } = useContext(RedeContext);
  const look = useContext(HubLookContext);
  return (
    <Typed
      key={look?.replay ?? 0}
      runs={runs}
      className={look?.text ?? BODY}
      marks={look?.marks}
      charMs={look?.typing.charMs}
      startMs={look?.typing.startMs}
      caret={look?.typing.caret}
      caretChar={look?.typing.caretChar}
      onDone={() => spawn("newsletter")}
    />
  );
}

function Content({ node, titleId }: { node: RedeNode; titleId: string }) {
  const title = (children: ReactNode) => (
    <h2 id={titleId} tabIndex={-1} className={TITLE}>
      {children}
    </h2>
  );
  switch (node.kind) {
    case "hub":
      return (
        <>
          <h2 id={titleId} tabIndex={-1} className="sr-only">
            {node.label}
          </h2>
          <HubIntro runs={node.intro} />
        </>
      );
    case "page":
      return (
        <>
          {title(node.page.label)}
          <p className={BODY}>{node.page.tagline}</p>
          {node.author && (
            <div className="flex flex-col gap-2 border-t-[1.5px] border-(--rede-window-ink) pt-4">
              <p className={KICKER}>{node.author.name}</p>
              {node.author.lines.map((line) => (
                <p key={line} className="font-sans text-base leading-snug">
                  {line}
                </p>
              ))}
              <p className="flex gap-4 font-geist-mono text-xs">
                {node.author.links.map((l) => (
                  <a key={l.href} href={l.href} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                    {l.label}
                  </a>
                ))}
              </p>
            </div>
          )}
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
                className="size-28 rounded-sm border-2 border-(--rede-window-ink) object-cover"
                style={{ opacity: node.upcoming ? 0.7 : 1 }}
              />
            ))}
          </div>
          {title(
            node.names.map((name) => (
              <span key={name} className="block">
                {name}
              </span>
            )),
          )}
          {node.blurb.length > 0 && (
            <p className={BODY}>
              {node.blurb.map((run, i) =>
                run.redacted ? (
                  <span key={i} className="font-redacted">
                    {run.text}
                  </span>
                ) : (
                  <span key={i}>{run.text}</span>
                ),
              )}
            </p>
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
          {title(nodeTitle(node))}
          <ExternalLinkPill platform={node.platform} href={node.href} className="flex self-start bg-paint" />
        </>
      );
  }
}

type WindowProps = {
  node: RedeNode;
  layer: Layer;
  onOpen: (id: string) => void;
  register: (id: string, el: HTMLElement | null) => void;
};

/**
 * One floating window. The scene writes its transform every frame; React only
 * decides what it holds. Out of focus, its content is inert and the whole
 * window is one button that brings it to the center.
 */
export default function Window({ node, layer, onOpen, register }: WindowProps) {
  const focused = layer === "focus";
  const titleId = `janela-${node.id}`;
  const look = useContext(HubLookContext);
  const hub = node.kind === "hub" && look !== null;
  return (
    <article
      ref={(el) => register(node.id, el)}
      aria-labelledby={titleId}
      data-layer={layer}
      className={`rede-window max-w-[calc(100vw-48px)] overflow-hidden ${hub ? look.frame : `${FRAME} w-100`}`}
    >
      <div inert={!focused} className={`flex flex-col ${hub ? look.body : "gap-4 p-6"}`}>
        <Content node={node} titleId={titleId} />
      </div>
      {!focused && (
        <button
          type="button"
          aria-label={`Abrir ${nodeTitle(node)}`}
          onClick={() => onOpen(node.id)}
          className="rede-window-open absolute inset-0 cursor-pointer"
        />
      )}
    </article>
  );
}
