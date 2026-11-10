"use client";

import type { ComponentProps, ReactNode } from "react";
import { useState } from "react";
import LinkCard from "../../components/LinkCard";

// LinkCard on its own: every shape its content can take, every interaction
// state pinned on screen, and every surface it may sit on. Edit
// app/components/LinkCard.tsx and this page follows.
//
// Interaction states are forced with data-preview (see the link-*/close-*
// variants in globals.css); a state with no style yet looks like rest.

type CardProps = ComponentProps<typeof LinkCard>;

const BASE = {
  href: "https://amarelodandara.substack.com/links-amarelos-3",
  title: "maestros, saltos e seriedade",
  source: "leia no substack",
  action: "ler",
} satisfies CardProps;

const TAG = "links amarelos #3";

const CONTENT: { label: string; note: string; props: CardProps }[] = [
  {
    label: "tag + close",
    note: "taste section, link from an edition",
    props: { ...BASE, tag: TAG, onClose: () => undefined },
  },
  {
    label: "close only",
    note: "taste section, link in no edition yet",
    props: { ...BASE, onClose: () => undefined },
  },
  {
    label: "tag only",
    note: "not dismissable, e.g. a list on a page",
    props: { ...BASE, tag: TAG },
  },
  {
    label: "no tab",
    note: "neither tag nor close",
    props: BASE,
  },
];

const STRESS: { label: string; props: CardProps }[] = [
  {
    label: "shortest title",
    props: {
      ...BASE,
      title: "GNX",
      source: "assista no tiktok",
      action: "ver",
      onClose: () => undefined,
    },
  },
  {
    label: "title wraps",
    props: {
      ...BASE,
      title:
        "tem gente cruzando a europa de bike e contando tudo num canal pequeno",
      source: "assista no youtube",
      action: "ver",
      tag: TAG,
      onClose: () => undefined,
    },
  },
  {
    label: "several editions",
    props: {
      ...BASE,
      tag: "links amarelos #3 · links amarelos #7 · links amarelos #12",
      onClose: () => undefined,
    },
  },
  {
    label: "unknown site: bare hostname",
    props: {
      ...BASE,
      title: "fabulação crítica",
      source: "queriasergrande.substack.com",
      action: "abrir",
      onClose: () => undefined,
    },
  },
];

const ACTIONS = [
  { source: "leia no substack", action: "ler" },
  { source: "assista no youtube", action: "ver" },
  { source: "ouça no spotify", action: "ouvir" },
  { source: "jogue no itch.io", action: "jogar" },
  { source: "pudding.cool", action: "abrir" },
];

const STATES: { preview: string; label: string; styled: boolean }[] = [
  { preview: "", label: "rest", styled: true },
  { preview: "link-hover", label: "link · hover", styled: false },
  { preview: "link-active", label: "link · pressed", styled: false },
  { preview: "link-focus", label: "link · keyboard focus", styled: true },
  { preview: "close-hover", label: "close · hover", styled: false },
  { preview: "close-active", label: "close · pressed", styled: false },
  { preview: "close-focus", label: "close · keyboard focus", styled: true },
];

const SURFACES = [
  { label: "sun-lighter · taste stage", className: "bg-sun-lighter" },
  { label: "sun-light · page body", className: "bg-sun-light" },
  { label: "brand-white", className: "bg-brand-white" },
  { label: "sun", className: "bg-sun" },
  { label: "brand-black", className: "bg-brand-black" },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-stone-700">{title}</h2>
      <div className="flex flex-wrap gap-6">{children}</div>
    </section>
  );
}

function Tile({
  label,
  note,
  children,
}: {
  label: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <figure className="space-y-2">
      <figcaption>
        <p className="text-[11px] font-semibold text-stone-800">{label}</p>
        {note && <p className="text-[10px] text-stone-500">{note}</p>}
      </figcaption>
      {children}
    </figure>
  );
}

export default function LinkCardPlayground() {
  const [closed, setClosed] = useState(0);
  const [visits, setVisits] = useState(0);

  return (
    <main className="min-h-screen space-y-10 bg-brand-white px-6 py-12 font-mono">
      <div className="space-y-1">
        <h1 className="font-sans text-2xl font-semibold text-stone-900">
          LinkCard
        </h1>
        <p className="text-sm text-stone-600">
          app/components/LinkCard.tsx, isolated. Edit the component; this page
          follows.
        </p>
      </div>

      <Section title="Live: hover, press, tab to it">
        <Tile
          label="interactive"
          note={`close pressed ${closed}× · link followed ${visits}×`}
        >
          <LinkCard
            {...BASE}
            tag={TAG}
            onClose={() => setClosed((n) => n + 1)}
            onVisit={() => setVisits((n) => n + 1)}
          />
        </Tile>
      </Section>

      <Section title="Interaction states (pinned)">
        {STATES.map(({ preview, label, styled }) => (
          <Tile
            key={label}
            label={label}
            note={styled ? undefined : "no style yet: looks like rest"}
          >
            <div data-preview={preview}>
              <LinkCard {...BASE} tag={TAG} onClose={() => undefined} />
            </div>
          </Tile>
        ))}
      </Section>

      <Section title="Tab: what shows up top">
        {CONTENT.map(({ label, note, props }) => (
          <Tile key={label} label={label} note={note}>
            <LinkCard {...props} />
          </Tile>
        ))}
      </Section>

      <Section title="Content at the edges">
        {STRESS.map(({ label, props }) => (
          <Tile key={label} label={label}>
            <LinkCard {...props} />
          </Tile>
        ))}
      </Section>

      <Section title="Actions">
        {ACTIONS.map(({ source, action }) => (
          <Tile key={action} label={action}>
            <LinkCard {...BASE} source={source} action={action} />
          </Tile>
        ))}
      </Section>

      <Section title="Surfaces">
        {SURFACES.map(({ label, className }) => (
          <Tile key={label} label={label}>
            <div className={`p-6 ${className}`}>
              <LinkCard {...BASE} tag={TAG} onClose={() => undefined} />
            </div>
          </Tile>
        ))}
      </Section>
    </main>
  );
}
