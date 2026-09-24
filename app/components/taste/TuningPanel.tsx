"use client";

import { useState } from "react";
import { Button } from "@base-ui/react/button";
import { Slider } from "@base-ui/react/slider";
import type { FieldTuning } from "./field";
import type { ViewTuning } from "./scene";
import type { Tuning } from "./tuning";
import { TUNING_DEFAULTS, writeTuning } from "./tuning";

// Dev-only knobs for the taste field. Every change swaps the tuning on the
// live sim and scene, so the sheet reshapes under links already on it.
// "copy" puts both objects on the clipboard, ready to paste over
// FIELD_DEFAULTS and VIEW_DEFAULTS.

type Range = { min: number; max: number; step: number };
type Knob =
  | (Range & { of: "field"; key: keyof FieldTuning })
  | (Range & { of: "view"; key: keyof ViewTuning });

const field = (
  key: keyof FieldTuning,
  min: number,
  max: number,
  step: number,
): Knob => ({ of: "field", key, min, max, step });
const view = (
  key: keyof ViewTuning,
  min: number,
  max: number,
  step: number,
): Knob => ({ of: "view", key, min, max, step });

const GROUPS: { title: string; knobs: Knob[] }[] = [
  {
    title: "camera",
    knobs: [
      view("cameraDistance", 1, 12, 0.1),
      view("cameraElevation", 5, 89, 1),
      view("cameraAim", -30, 30, 0.5),
      view("fovLandscape", 15, 90, 1),
      view("fovPortrait", 15, 100, 1),
    ],
  },
  {
    title: "grid",
    knobs: [
      view("gridCell", 0.05, 1, 0.01),
      view("lineWidth", 0.3, 4, 0.1),
      view("lineOpacity", 0, 1, 0.05),
      view("fogNear", 0, 15, 0.1),
      view("fogFar", 1, 30, 0.1),
    ],
  },
  {
    title: "sheet",
    knobs: [
      field("wellSigma", 0.05, 1, 0.01),
      field("linkMass", 0, 0.8, 0.01),
      field("sagPerLink", 0, 0.2, 0.005),
      field("sagSigma", 0.2, 3, 0.05),
      field("centerZ", 1, 4, 0.05),
      field("maxLinkDepth", 0.05, 1.5, 0.01),
    ],
  },
  {
    title: "links",
    knobs: [
      field("linkRadius", 0.02, 0.2, 0.005),
      field("spawnSpreadX", 0, 3, 0.05),
      field("spawnSpreadZ", 0, 2, 0.05),
      field("spacing", 2, 6, 0.1),
    ],
  },
  {
    title: "motion",
    knobs: [
      field("gravity", 1, 30, 0.5),
      field("bounce", 0, 0.9, 0.01),
      field("minBounceSpeed", 0, 5, 0.1),
      field("slopePull", 0, 30, 0.5),
      field("slideDamping", 0, 10, 0.1),
      field("settleSpeed", 0.005, 0.2, 0.005),
      field("settleSeconds", 0.05, 2, 0.05),
      field("maxSlideSeconds", 0.5, 8, 0.1),
    ],
  },
  {
    title: "ripples",
    knobs: [
      field("rippleAmp", 0, 0.2, 0.005),
      field("rippleSpeed", 0.2, 5, 0.05),
      field("rippleWidth", 0.05, 1, 0.01),
      field("rippleWavelength", 0.05, 1, 0.01),
      field("rippleLife", 0.2, 4, 0.05),
    ],
  },
  {
    title: "collapse",
    knobs: [
      field("collapseSeconds", 0.5, 8, 0.1),
      field("collapseEase", 0.5, 5, 0.1),
      field("funnelDepth", 0, 3, 0.05),
      field("funnelSigmaStart", 0.1, 2, 0.05),
      field("funnelSigmaShrink", 0, 1.5, 0.01),
      field("wellNarrowing", 0, 0.9, 0.01),
      field("swirl", 0, 3, 0.05),
      field("dissipateSeconds", 0.2, 4, 0.05),
      field("dissipateDrop", 0, 3, 0.05),
    ],
  },
];

function valueOf(tune: Tuning, knob: Knob): number {
  return knob.of === "field" ? tune.field[knob.key] : tune.view[knob.key];
}

function withValue(tune: Tuning, knob: Knob, value: number): Tuning {
  return knob.of === "field"
    ? { ...tune, field: { ...tune.field, [knob.key]: value } }
    : { ...tune, view: { ...tune.view, [knob.key]: value } };
}

function block(name: string, values: FieldTuning | ViewTuning): string {
  const lines = Object.entries(values).map(
    ([key, value]) => `  ${key}: ${value},`,
  );
  return `export const ${name} = {\n${lines.join("\n")}\n};`;
}

function snippet(tune: Tuning): string {
  return `${block("FIELD_DEFAULTS", tune.field)}\n\n${block("VIEW_DEFAULTS", tune.view)}`;
}

type TuningPanelProps = {
  tune: Tuning;
  onChange: (tune: Tuning) => void;
  onDrop: () => void;
  onRestart: () => void;
};

/** Loaded client-only (TasteSection imports it with `ssr: false`), since
 *  its values come from storage. */
export default function TuningPanel({
  tune,
  onChange,
  onDrop,
  onRestart,
}: TuningPanelProps) {
  const [open, setOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  const set = (next: Tuning) => {
    writeTuning(next);
    onChange(next);
  };

  const changed = GROUPS.flatMap((group) => group.knobs).filter(
    (knob) => valueOf(tune, knob) !== valueOf(TUNING_DEFAULTS, knob),
  ).length;

  const copy = () => {
    void navigator.clipboard.writeText(snippet(tune)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    });
  };

  const action =
    "rounded border border-brand-black/30 px-2 py-0.5 hover:bg-sun-light";

  return (
    <aside className="fixed right-3 bottom-3 z-[1000] w-72 rounded-md border border-brand-black bg-sun-lighter font-space-mono text-[11px] text-brand-black shadow-lg">
      <div className="flex items-center justify-between gap-2 border-b border-brand-black/20 px-3 py-2">
        <Button className="font-bold" onClick={() => setOpen((o) => !o)}>
          {open ? "▾" : "▸"} field {changed > 0 && `· ${changed} changed`}
        </Button>
        <div className="flex gap-1">
          <Button className={action} onClick={onDrop}>
            drop
          </Button>
          <Button className={action} onClick={onRestart}>
            restart
          </Button>
        </div>
      </div>

      {open && (
        <>
          <div className="max-h-[60svh] overflow-y-auto px-3 pb-2">
            {GROUPS.map((group) => (
              <fieldset key={group.title} className="mt-2">
                <legend className="mb-1 uppercase opacity-50">
                  {group.title}
                </legend>
                {group.knobs.map((knob) => (
                  <Slider.Root
                    key={knob.key}
                    value={valueOf(tune, knob)}
                    min={knob.min}
                    max={knob.max}
                    step={knob.step}
                    onValueChange={(value) => set(withValue(tune, knob, value))}
                    className="mb-1.5 grid grid-cols-[1fr_auto] items-center gap-x-2"
                  >
                    <Slider.Label
                      className={
                        valueOf(tune, knob) === valueOf(TUNING_DEFAULTS, knob)
                          ? ""
                          : "font-bold"
                      }
                    >
                      {knob.key}
                    </Slider.Label>
                    <Button
                      className="tabular-nums hover:underline"
                      title="reset to default"
                      onClick={() =>
                        set(
                          withValue(tune, knob, valueOf(TUNING_DEFAULTS, knob)),
                        )
                      }
                    >
                      {valueOf(tune, knob)}
                    </Button>
                    <Slider.Control className="col-span-2 flex h-4 touch-none items-center">
                      <Slider.Track className="h-1 w-full rounded bg-brand-black/15">
                        <Slider.Indicator className="rounded bg-sun-dark" />
                        <Slider.Thumb className="size-3 rounded-full border border-brand-black bg-sun focus-visible:outline-2" />
                      </Slider.Track>
                    </Slider.Control>
                  </Slider.Root>
                ))}
              </fieldset>
            ))}
          </div>
          <div className="flex justify-between gap-1 border-t border-brand-black/20 px-3 py-2">
            <Button className={action} onClick={() => set(TUNING_DEFAULTS)}>
              reset all
            </Button>
            <Button className={action} onClick={copy}>
              {copied ? "copied" : "copy values"}
            </Button>
          </div>
        </>
      )}
    </aside>
  );
}
