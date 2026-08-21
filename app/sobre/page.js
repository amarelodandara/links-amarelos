import LinksLogotype from "../components/icons/LinksLogotype";
import Timeline from "../components/Timeline";
import TypingCycler from "../components/TypingCycler";
import Button from "../components/Button";
import SectionPill from "../components/SectionPill";
import Accordion, { AccordionGroup } from "../components/Accordion";

export const metadata = {
  title: "sobre",
  description: "O que é Links Amarelos e quem está por trás.",
  alternates: { canonical: "/sobre" },
  openGraph: {
    title: "sobre • links amarelos",
    description: "O que é Links Amarelos e quem está por trás.",
    url: "/sobre",
  },
  twitter: {
    title: "sobre • links amarelos",
    description: "O que é Links Amarelos e quem está por trás.",
  },
};

const timeline = [
  {
    ano: "setembro de 2025",
    titulo: "links amarelos #1",
    desc: "Vai ao ar a primeira coleção dos melhores links do mês.",
    href: "https://amarelodandara.substack.com/links-amarelos-1",
    cta: "leia no Substack",
  },
  {
    ano: "janeiro de 2026",
    titulo: "ondas amarelas",
    desc: "Os links amarelos ganham voz!",
    href: "https://amarelodandara.substack.com",
    cta: "Ouça no Spotify",
  },
  {
    ano: "junho de 2026",
    titulo: "linksamarelos.com vai ao ar",
    desc: "Sejam bem vindos ao CEP dos linksamarelos na internet.",
  },
  {
    ano: "em breve",
    titulo: "muito mais",
    desc: "Novas realizações amarela estão a caminho",
    href: "/realizacoes",
    cta: "ver realizações",
  },
];

export default function SobrePage() {
  return (
    <main className="min-h-screen bg-(--sun) w-full md:max-w-4xl md:mx-auto border border-sun divide-y divide-sun">
      {/* Header */}
      <section className="space-y-6 px-8 py-16">
        <SectionPill>sobre</SectionPill>

        <h1 className="font-unbounded text-4xl md:text-6xl text-sun-lighter tracking-tight leading-tight">
          links amarelos<br></br>e muito mais
        </h1>
        <p className="font-manrope text-xl text-sun-lighter max-w-xl leading-relaxed">
          Curadorias que te levam aos lugares lindos que a internet ainda tem
          pra oferecer e você se esqueceu.
        </p>
      </section>

      {/* O que é */}
      <AccordionGroup
        render={<section className="bg-sun-light divide-y divide-sun" />}
      >
        <Accordion
          numero="01"
          nome="Links Amarelos"
          explainer="A curadoria mensal que começou tudo, direto na sua caixa de entrada"
        >
          <p className="font-manrope leading-relaxed p-6">
            Uma newsletter mensal que reúne o melhor que uma designer altamente
            técnica, careca, negra e personality hire encontrou por aí.
          </p>
        </Accordion>

        <Accordion
          numero="02"
          nome="Ondas Amarelas"
          explainer="Quando os links amarelos ganham voz, todo mês no seu ouvidor de áudio favorito"
        >
          <p className="font-manrope leading-relaxed p-6">
            O que acontece quando os links amarelos ganham voz! Uma versão
            expandida da conversa também lançada mensalmente no seu ouvidor de
            áudio favorito.
          </p>
        </Accordion>

        <Accordion
          numero="03"
          nome="Hyperlinks Amarelos"
          explainer="Quando um link é grande demais pra caber em uma edição ou episódio"
        >
          <p className="font-manrope leading-relaxed p-6">
            Quando um link extrapola os limites de uma newsletter e não consegue
            conviver com outras recomendações em um podcast de meia hora, ele
            ganha um espaço dedicado em forma de ensaio por áudio.
          </p>
        </Accordion>
      </AccordionGroup>

      {/* Timeline */}
      <section className="bg-sun-light">
        <div className="border-b border-sun pt-16">
          <p className="uppercase text-sun font-unbounded px-8 pb-2">
            Como chegamos aqui
          </p>
        </div>
        <div className="px-8 py-12">
          <Timeline items={timeline} />
        </div>
      </section>

      {/* Manifesto teaser */}
      <section className="bg-sun-light">
        <div className="border-b border-sun pt-16">
          <p className="uppercase text-sun font-unbounded px-8 pb-2">
            No que acreditamos
          </p>
        </div>
        <div className="px-8 py-12 space-y-4 font-manrope">
          <p className="text-xl font-semibold tracking-tight leading-relaxed">
            Aqui os links não começam com{" "}
            <span className="font-space-mono bg-sun px-1">
              https://
              <TypingCycler />
            </span>
            .
          </p>
          <p className="leading-relaxed max-w-prose">
            Eles começam com profundidade, pertencem a qualquer mídia e se
            sustentam com o apoio de vocês. O manifesto amarelo reúne os quatro
            princípios que guiam todas as recomendações e realizações.
          </p>
          <div className="pt-2">
            <Button variant="ghost" href="/manifesto" trail>
              leia o manifesto amarelo
            </Button>
          </div>
        </div>
      </section>

      {/* Quem faz + CTA */}
      <section>
        <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-sun-light">
          <div>
            <div className="border-b border-sun-light pt-16">
              <p className="uppercase text-sun-lighter font-unbounded px-8 pb-2">
                Quem faz
              </p>
            </div>
            <div className="px-8 py-12 space-y-4 font-manrope">
              <p className="text-xl font-semibold tracking-tight leading-relaxed">
                {" "}
                Amarelo Dandara é, para os próximos, Nicoly Dandara.
              </p>

              <p className="font-manrope leading-relaxed max-w-prose">
                Há tempos perambula pela internet e retorna com links que fazem
                todo mundo se perguntar: de onde isso saiu? Com os links
                amarelos, &ldquo;todo mundo&rdquo; pode passar a significar
                &ldquo;o mundo todo&rdquo;.
              </p>

              <div className="flex gap-4">
                <Button variant="ghost" href="https://instagram.com/nydndr">
                  instagram
                </Button>
                <Button variant="ghost" href="https://adandara.com">
                  site
                </Button>
              </div>
            </div>
          </div>

          <div className="px-8 py-12 space-y-4 text-center bg-[url('/bg-texture-white.svg')] bg-repeat flex flex-col justify-center items-center">
            <p className="font-manrope text-xl font-semibold tracking-tight">
              Pronto para começar?
            </p>
            <p className="font-manrope w-4/5 leading-relaxed">
              Assine grátis pra receber a curadoria todo mês ou apoie o projeto
              pra patrocinar os próximos passos.
            </p>
            <div className="pt-4">
              <Button variant="primary" href="/apoio" className="text-sm" trail>
                apoiar o projeto
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
