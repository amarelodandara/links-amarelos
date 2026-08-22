"use client";

import { useState } from "react";
import Button from "../components/Button";
import SectionPill from "../components/SectionPill";
import CheckIcon from "../components/icons/CheckIcon";
import LockIcon from "../components/icons/LockIcon";

export default function PlansToggle() {
  const [anual, setAnual] = useState(false);

  return (
    <section className="border-y-2 border-sun-light grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-sun-light">
      <div className="bg-sun flex flex-col">
        <div className="p-8 flex flex-col gap-6 flex-1">
          <div
            aria-hidden="true"
            className="invisible flex items-center gap-0.5 self-end rounded-full border border-transparent p-0.5 font-space-mono text-xs"
          >
            <span className="rounded-full px-3 py-1">mensal</span>
          </div>
          <div className="space-y-2">
            <SectionPill>Membro</SectionPill>
            <h2 className="lowercase font-unbounded text-2xl tracking-tight">
              Canárinho
            </h2>
          </div>
          <div>
            <p className="font-unbounded text-4xl">Grátis</p>
            <p className="font-space-mono text-sm">para sempre</p>
          </div>
          <p className="font-manrope text-sm leading-relaxed">
            Aproveite a curadoria clássica
          </p>
          <ul className="space-y-2 flex-1">
            <li className="flex items-start gap-2">
              <CheckIcon className="size-4 mt-0.5 shrink-0 text-brand-black" />
              <span className="font-manrope w-4/5">
                <span className="font-semibold">links amarelos</span> a
                curadoria mensal que você lê
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckIcon className="size-4 mt-0.5 shrink-0 text-brand-black" />
              <span className="font-manrope w-4/5">
                <span className="font-semibold">ondas amarelas</span> a
                curadoria mensal que você ouve
              </span>
            </li>
          </ul>
          <div className="flex flex-col items-start gap-2 self-start">
            <Button
              variant="primary"
              href="https://amarelodandara.substack.com"
              className="text-sm text-center"
            >
              Assinar grátis
            </Button>
            <p className="flex items-center gap-1 font-manrope text-xs text-brand-black/60">
              <LockIcon className="size-3" />
              assinatura segura, gerenciada pelo Substack
            </p>
          </div>
        </div>
      </div>

      <div className="bg-code text-white flex flex-col">
        <div className="p-8 flex flex-col gap-6 flex-1">
          <div
            role="group"
            aria-label="Período de cobrança"
            className="flex items-center gap-0.5 self-end rounded-full border border-white/30 p-0.5 font-space-mono text-xs"
          >
            <button
              type="button"
              onClick={() => setAnual(false)}
              aria-pressed={!anual}
              className={`lowercase rounded-full px-3 py-1 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${
                !anual ? "bg-white text-code" : "text-white/70 hover:text-white"
              }`}
            >
              mensal
            </button>
            <button
              type="button"
              onClick={() => setAnual(true)}
              aria-pressed={anual}
              className={`lowercase rounded-full px-3 py-1 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${
                anual ? "bg-white text-code" : "text-white/70 hover:text-white"
              }`}
            >
              anual
            </button>
          </div>
          <div className="space-y-2">
            <SectionPill tone="dark">Membro</SectionPill>
            <h2 className="lowercase font-unbounded text-2xl tracking-tight">
              Ouro
            </h2>
          </div>
          <div>
            <p className="font-unbounded text-4xl leading-none">
              {anual ? (
                <>
                  R$ 90
                  <sup className="font-space-mono text-xs font-normal align-super ml-1 text-code-light">
                    3 meses saem de graça!
                  </sup>
                </>
              ) : (
                "R$ 10"
              )}
            </p>
            <p className="font-space-mono text-sm mt-1">
              {anual ? "por ano" : "por mês"}
            </p>
          </div>
          <p className="font-manrope text-sm leading-relaxed">
            Mergulhe em links amarelos
          </p>
          <ul className="space-y-2 flex-1">
            <li className="flex items-start gap-2">
              <CheckIcon className="size-4 mt-0.5 shrink-0 text-code-light" />
              <span className="font-manrope w-4/5">
                <span className="font-semibold">links amarelos</span> a
                curadoria mensal que você lê
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckIcon className="size-4 mt-0.5 shrink-0 text-code-light" />
              <span className="font-manrope w-4/5">
                <span className="font-semibold">ondas amarelas</span> a
                curadoria mensal que você ouve
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckIcon className="size-4 mt-0.5 shrink-0 text-code-light" />
              <span className="font-manrope w-4/5">
                <span className="font-semibold">hyperlinks amarelos</span>{" "}
                ensaios profundos de assuntos amarelissímos
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckIcon className="size-4 mt-0.5 shrink-0 text-code-light" />
              <span className="font-manrope w-4/5">
                seu nome no painel de apoiadores e no final de todo episódio
              </span>
            </li>
          </ul>
          <div className="flex flex-col items-start gap-2 self-start">
            <Button
              variant="primary-inverted"
              href="https://amarelodandara.substack.com/subscribe"
              className="text-sm text-center"
            >
              {anual ? "Assinar por R$ 90/ano" : "Assinar por R$ 10/mês"}
            </Button>
            <p className="flex items-center gap-1 font-manrope text-xs text-white/60">
              <LockIcon className="size-3" />
              assinatura segura, gerenciada pelo Substack
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
