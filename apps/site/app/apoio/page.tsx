import Image from "next/image";
import PlansToggle from "./PlansToggle";
import Button from "../components/Button";
import SectionPill from "../components/SectionPill";
import CheckIcon from "../components/icons/CheckIcon";
import LockIcon from "../components/icons/LockIcon";

export const metadata = {
  title: "apoio",
  description:
    "Apoie links amarelos: mantenha a curadoria e as realizações amarelas vivas.",
  alternates: { canonical: "/apoio" },
  openGraph: {
    title: "apoio • links amarelos",
    description:
      "Apoie links amarelos: mantenha a curadoria e as realizações amarelas vivas.",
    url: "/apoio",
  },
  twitter: {
    title: "apoio • links amarelos",
    description:
      "Apoie links amarelos: mantenha a curadoria e as realizações amarelas vivas.",
  },
};

export default function ApoioPage() {
  return (
    <main className="min-h-screen bg-sun md:border-x-2 border-sun-light w-full md:max-w-4xl md:mx-auto">
      {/* Header */}
      <section className="space-y-6 px-8 py-16">
        <SectionPill>Apoie</SectionPill>

        <div className="space-y-2">
          <h1 className="font-unbounded text-4xl md:text-6xl text-sun-lighter tracking-tight leading-tight">
            Junte-se aos
            <br />
            canarinhos
          </h1>
          <p className="font-manrope text-xl text-sun-lighter max-w-xl leading-relaxed">
            Além de ajudar a manter os links amarelos + ondas amarelas
            gratuitos, seu apoio possibilita incríveis realizações amarelas.
          </p>
        </div>
      </section>

      <PlansToggle />

      {/* Doação espontânea */}
      <section className="border-b border-sun-light px-8 py-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-[url('/bg-texture-white.svg')] bg-repeat">
        <div className="space-y-6">
          <SectionPill>doador</SectionPill>

          <div className="space-y-1">
            <p className="font-unbounded text-4xl">Qualquer valor</p>
            <p className="font-space-mono text-sm">
              sem recorrência, sem compromisso
            </p>
          </div>
          <ul className="font-manrope text-sm space-y-2">
            <li className="flex items-start gap-2">
              <CheckIcon className="size-4 mt-0.5 shrink-0" />
              <span>
                Ideal pra quem quer garantir que o projeto continue, mas sem
                ficar por perto
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckIcon className="size-4 mt-0.5 shrink-0" />
              <span>
                Ideal pra quem já é assinante e quer impulsionar ainda mais uma
                iniciativa amarela
              </span>
            </li>
          </ul>
        </div>
        <div className="flex flex-col items-center gap-2 shrink-0">
          <Button
            variant="primary"
            href="https://donate.stripe.com/dRmcN54gb9pq0en3Oh6Ri00"
          >
            fazer uma doação
          </Button>
          <p className="flex items-center gap-1 font-manrope text-xs text-brand-black/60">
            <LockIcon className="size-3" />
            pagamento seguro via{" "}
            <Image
              src="/Stripe wordmark - Slate.svg"
              alt="Stripe"
              width={33}
              height={14}
            />
          </p>
        </div>
      </section>

      {/* Por que apoiar */}
      <section className="border-b border-sun-light ">
        <div className="border-b border-sun-light pt-16">
          <p className="uppercase text-sun-lighter font-unbounded px-6 pb-2">
            Por que apoiar
          </p>
        </div>
        <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-sun-light">
          <div className="space-y-2 p-6">
            <p className="font-manrope font-semibold tracking-tight">
              Grátis para sempre
            </p>
            <p className="font-manrope leading-relaxed text-brand-black text-sm">
              O apoio pago de alguns é o que permite que as edições sejam
              gratuitas para todo mundo.
            </p>
          </div>
          <div className="space-y-2 p-6">
            <p className="font-manrope font-semibold tracking-tight">
              Orgânico, lindo
            </p>
            <p className="font-manrope leading-relaxed text-brand-black text-sm">
              Não otimiza para engajamento, não contém anúncios. Vide de
              assinantes, vive de comunidade.
            </p>
          </div>
          <div className="space-y-4 bg-sun-light p-6">
            <div className="space-y-2">
              <p className="font-manrope font-semibold tracking-tight">
                Novas realizações
              </p>
              <p className="font-manrope text-sm  leading-relaxed">
                Com as contas da casa todas pagas, as doações passam a
                patrocinar projetos novos em mídias novas.
              </p>
            </div>
            <Button variant="ghost" href="/realizacoes" className=" text-sm">
              ver realizações
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
