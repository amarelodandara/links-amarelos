"use client";

import { Accordion as BaseAccordion } from "@base-ui/react/accordion";

/**
 * Wraps sibling <Accordion> items so arrow keys move focus between triggers.
 * Renders as whatever element you pass via `render` (defaults to a <div>).
 */
export function AccordionGroup({ children, multiple = true, ...props }) {
  return (
    <BaseAccordion.Root multiple={multiple} {...props}>
      {children}
    </BaseAccordion.Root>
  );
}

export default function Accordion({
  numero,
  nome,
  explainer,
  children,
  emptyMessage = "conteúdo a caminho",
}) {
  const hasContent = Boolean(children);

  return (
    <BaseAccordion.Item>
      <BaseAccordion.Header render={<h2 />}>
        <BaseAccordion.Trigger
          className="group/trigger relative w-full bg-sun-light flex items-start gap-4 px-6 pt-5 cursor-pointer text-left overflow-hidden transition-[max-height] duration-500 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] max-h-[3.75rem] data-[panel-open]:max-h-56 data-[panel-open]:pb-6"
        >
          <div
            className="absolute inset-0 bg-[url('/bg-texture-cutting-pad.svg')] bg-cover pointer-events-none transition-opacity duration-300 pointer-coarse:hidden opacity-0 group-[&:not([data-panel-open]):hover]/trigger:opacity-100"
          />
          <span className="relative font-space-mono text-xs shrink-0 w-6 mt-1 text-sun-dark transition-colors duration-300 pointer-fine:group-[&:not([data-panel-open]):hover]/trigger:text-white">
            {numero}
          </span>

          <div className="relative flex-1 min-w-0 flex flex-col overflow-hidden">
            <span className="block font-unbounded text-xl sm:text-2xl md:text-4xl lg:text-5xl tracking-tight leading-none text-brand-dark whitespace-nowrap [mask-image:linear-gradient(to_right,black_75%,transparent_100%)] md:[mask-image:none]">
              {nome}
            </span>
            <p className="font-manrope mt-2 leading-snug hidden md:block">
              {explainer}
            </p>
          </div>

          <span className="relative text-sun-dark font-space-mono text-xl shrink-0 transition-[transform,color] duration-300 mt-0.5 group-data-[panel-open]/trigger:rotate-45 pointer-fine:group-[&:not([data-panel-open]):hover]/trigger:text-white">
            +
          </span>
        </BaseAccordion.Trigger>
      </BaseAccordion.Header>

      {/* Static wrapper keeps the divider visible while the panel is collapsed */}
      <div className="border-t border-sun">
        <BaseAccordion.Panel className="overflow-hidden h-[var(--accordion-panel-height)] opacity-100 transition-[height,opacity] duration-300 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] data-[starting-style]:h-0 data-[starting-style]:opacity-0 data-[ending-style]:h-0 data-[ending-style]:opacity-0 data-[ending-style]:duration-200">
          {hasContent ? (
            children
          ) : (
            <p className="font-space-mono text-sm lowercase py-4 px-6">
              {emptyMessage}
            </p>
          )}
        </BaseAccordion.Panel>
      </div>
    </BaseAccordion.Item>
  );
}
