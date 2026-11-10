"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import YellowCircle from "../components/YellowCircle";
import Button from "../components/Button";
import SectionPill, { PILL_BASE } from "../components/SectionPill";
import Accordion, { AccordionGroup } from "../components/Accordion";
import Link from "next/link";

const statusStyles = {
  ativa: "border-sun-dark text-sun-dark",
  construindo: "border-sun-dark text-sun-dark border-dashed",
  planejada: "border-sun-dark text-sun-dark border-dashed",
};

type RealizacaoStatus = keyof typeof statusStyles;

// null is a real state here, not a missing prop: a card with no status renders
// the blob placeholder rather than a pill.
type StatusPillProps = { status?: RealizacaoStatus | null };

function StatusPill({ status }: StatusPillProps) {
  if (!status) return null;
  return (
    <span className={`${PILL_BASE} ${statusStyles[status] ?? ""}`}>
      {status}
    </span>
  );
}

type RealizacaoCardProps = {
  status?: RealizacaoStatus | null;
  name: string;
  cover?: string;
  cta?: string;
  href?: string;
  children?: ReactNode;
};

function RealizacaoCard({
  status,
  name,
  cover,
  cta,
  href,
  children,
}: RealizacaoCardProps) {
  return (
    <div className="p-6 aspect-square flex flex-col justify-between">
      <div className="flex justify-end">
        <StatusPill status={status} />
      </div>

      <div>
        {status === "construindo" ? (
          <YellowCircle filled className="size-20 shrink-0" />
        ) : status === "planejada" ? (
          <YellowCircle className="size-20 shrink-0" />
        ) : !status ? (
          <div
            className="size-20 shrink-0 bg-sun-lighter rounded-[60%_40%_55%_45%/45%_55%_40%_60%]"
            aria-hidden="true"
          />
        ) : cover ? (
          <Image
            src={cover}
            width={400}
            height={400}
            alt={name}
            className="size-30 aspect-square rounded-sm outline outline-sun-lighter rotate-1 shrink-0 transition-transform duration-200 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] group-hover:scale-110 group-hover:-translate-y-1"
          />
        ) : (
          <div className="size-20 rounded-sm border-2 border-dashed border-sun/40 flex items-center justify-center shrink-0">
            <span className="font-space-mono text-xs text-sun-dark">
              em breve
            </span>
          </div>
        )}
      </div>

      <div className="min-w-0 space-y-2 font-manrope">
        <h3 className="font-manrope font-semibold text-xl tracking-tight leading-tight lowercase">
          {name}
        </h3>
        {children}
      </div>
      {status !== null &&
        (cta && href ? (
          <Button
            variant="primary"
            href={href}
            className="self-start w-fit text-sm mt-2"
          >
            {cta}
          </Button>
        ) : (
          <div aria-hidden="true">
            <Button
              variant="primary"
              disabled
              className="self-start w-fit invisible text-sm mt-2"
            >
              placeholder
            </Button>
          </div>
        ))}
    </div>
  );
}

export default function RealizacoesClient() {
  return (
    <main className="min-h-screen bg-(--sun) w-full md:max-w-4xl md:mx-auto md:border-x border-sun">
      {/* Header */}
      <section className="border-b border-sun-light px-8 py-16 space-y-6">
        <SectionPill>realizações</SectionPill>
        <h1 className="font-unbounded text-4xl md:text-6xl text-sun-lighter tracking-tight leading-tight">
          O que nasce dos
          <br />
          links amarelos
        </h1>
        <p className="font-manrope text-xl text-sun-lighter max-w-lg leading-relaxed">
          Os links são só a semente, as realizações são os frutos.
        </p>
      </section>

      {/* Accordions */}
      <AccordionGroup
        render={
          <section className="bg-sun-light border-x border-sun divide-y divide-sun" />
        }
      >
        <Accordion
          numero="01"
          nome="Profundo e Otimista"
          explainer="Conteúdo escrito com calma e profundidade, otimista sobre a vida e sobre o seu span de atenção"
        >
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y divide-x divide-sun">
          <RealizacaoCard
            status="ativa"
            name="Links Amarelos"
            cover="/brand/links-amarelos-3.png"
            cta="leia no Substack"
            href="https://amarelodandara.substack.com"
          >
            <p>
              Uma curadoria mensal do{" "}
              <span className="italic">creme de la creme</span> da internet,
              todo mês na sua caixa de entrada.{" "}
            </p>
          </RealizacaoCard>
          <RealizacaoCard
            status="ativa"
            name="Ondas Amarelas"
            cover="/brand/ondas-amarelas-6.png"
            cta="ouça no Spotify"
            href="https://open.spotify.com/show/043Gs7eyY2KOlotEWSTSxB?si=e7abf2b9730747d7"
          >
            <p>
              A versão expandida dos links amarelos em áudio. O mesmo conteúdo,
              mas com um tempero a mais, todo mês no seu ouvidor de áudio.
            </p>
          </RealizacaoCard>
          <RealizacaoCard
            status="construindo"
            name="Hyperlinks Amarelos"
            cover="/brand/coming-newsletter.png"
            cta="Assine para receber"
            href="https://amarelodandara.substack.com"
          >
            <p>
              Ensaios sobre assuntos específicos formados por muitos links
              amarelos demais para caber em uma issue ou outra.
            </p>
          </RealizacaoCard>

          <RealizacaoCard status={null} name="código-fonte">
            <p>
              Abrindo as portas de como tudo funciona: como nasce uma issue dos
              links amarelos? Como eu organizo minhas anotações? Como esse site
              para em pé?
            </p>
            <table className="w-full mt-4 text-sm text-brand-black lowercase">
              <thead>
                <tr>
                  <th className="text-left border-b border-sun/40 pr-4 pb-1">
                    requisitos
                  </th>
                  <th className="text-left font-semibold border-b border-sun/40 pb-1 invisible">
                    status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sun">
                <tr>
                  <td className="pr-4 py-1">câmera</td>
                  <td className="py-1 text-right font-space-mono">não temos</td>
                </tr>
                <tr>
                  <td className="pr-4 py-1">canal no YouTube</td>
                  <td className="py-1 text-right font-space-mono">não temos</td>
                </tr>
              </tbody>
            </table>
          </RealizacaoCard>
        </div>
        </Accordion>

        <Accordion
          numero="02"
          nome="Presente e Multimídia"
          explainer="Formatos que vão além do texto e realizações que vão além da internet"
        >
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y divide-x divide-sun">
          <RealizacaoCard
            status="ativa"
            name="linksamarelos.com"
            href="https://linksamarelos.com"
            cta="Você está aqui!"
            cover={"/icon.svg"}
          >
            <p>
              Os melhores links da internet tem uma casa. Muito mais que um
              arquivo das edições, a porta de entrada para a internet como uma
              cidade.
            </p>
          </RealizacaoCard>

          <RealizacaoCard status={null} name="Exposição Amarela">
            <p>
              E se a curadoria extrapolasse os limites das telas? E se as telas
              fossem grandes, físicas, táteis? E se a comunidade amarela
              escondesse vários artistas?
            </p>
          </RealizacaoCard>

          <RealizacaoCard
            status={null}
            name="encontro em que a gente lê coisas"
          >
            <p>
              Coloque sua melhor roupa, pegue seus melhores links. Hoje vamos
              compartilhar as coisas que mais nos fizeram pensar na internet e
              conversar como se tudo dependesse disso - porque depende.
            </p>
            <p className="text-sm ml-4 pl-4 border-l border-sun text-sun-dark mt-6">
              Inspirado por{" "}
              <Link
                href="https://mwichary.medium.com/party-where-we-read-things-c503c3ec624c"
                className="underline underline-offset-2"
              >
                Party Where We Read Things
              </Link>{" "}
              do Marchin Wichary
            </p>
          </RealizacaoCard>

          <RealizacaoCard
            status={null}
            name="bar em que a gente aprende coisas"
          >
            <p>
              Hear me out: a gente fecha um bar, convida um especialista pra
              palestrar pra gente e bebe e aprende a noite inteira. Não é a
              noite ideal de muita gente, mas é a nossa.
            </p>
            <p className="text-sm ml-4 pl-4 border-l border-sun text-sun-dark mt-6">
              Inspirado por Sip and Learn
            </p>
          </RealizacaoCard>
        </div>
        </Accordion>

        <Accordion
          numero="03"
          nome="Auto-sustentável e Expansivo"
          explainer="A liberdade da imprensa só existe pra quem é dono de uma."
        >
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y divide-x divide-sun">
          <RealizacaoCard status={null} name="Auto hospedagem">
            <p>
              Que os links amarelos vivam em sua própria casa, sem depender da
              estabilidade de plataformas de entretenimento. Que vivam pra
              sempre. Que para todos.
            </p>
          </RealizacaoCard>
          <RealizacaoCard status={null} name="Paint The Town Yellow!">
            <p>
              Que as recomendações da cidade, vivam na cidade. Pequenas ações e
              intervenções em cada lugar já recomendados nos links amarelos e
              nas ondas amarelas. Nos encontre por aí!
            </p>
          </RealizacaoCard>
        </div>
        </Accordion>

        <Accordion
          numero="04"
          nome="Apoiado e Apoiador"
          explainer="Iniciativas realizadas e celebrados lado a lado com vocês."
        >
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y divide-x divide-sun">
          <RealizacaoCard status={"construindo"} name="Sólzinhos">
            <p>
              Uma pequena palavra de agradecimento e encorajamento para todos os
              criadores já recomendados por aqui. As vezes, é tudo que alguém
              precisa para continuar criando.
            </p>
          </RealizacaoCard>

          <RealizacaoCard status={null} name="Painel de Apoiadores">
            <p>
              Todos que fazem os links respirarem com leveza merecem ser
              lembrados.
            </p>
          </RealizacaoCard>

          <RealizacaoCard status={null} name="Urna de Temas">
            <p>
              Sugira temas para serem explorados ou aprofundados, vote nos temas
              já sugeridos. Exerça seu direito de cidadão amarelo!
            </p>
          </RealizacaoCard>

          <RealizacaoCard status={null} name="Arco-links">
            <p>
              Uma conversa minha com outro criador de links em que conversamos
              sobre os links que mais lhe impactaram e o que mais ele vê de
              amarelo na vida.
            </p>
            <p className="text-sm ml-4 pl-4 border-l border-sun text-sun-dark mt-6">
              Inspirado pelo quadro de entrevista do Derrick Gee,{" "}
              <Link
                href="https://www.youtube.com/playlist?list=PLArYIy4cER9uLERZnNR8MkCh0lTTV6mhw"
                className="underline underline-offset-2"
              >
                play songs at my house
              </Link>
            </p>
          </RealizacaoCard>
        </div>
        </Accordion>
      </AccordionGroup>

      {/* Support CTA */}
      <section className="px-8 py-16 space-y-4 text-center bg-[url('/bg-texture-white.svg')] bg-repeat">
        <p className="font-manrope text-xl font-semibold tracking-tight">
          Essas realizações vivem do apoio de pessoas como você
        </p>
        <p className="font-manrope text-center md:w-3/5 mx-auto leading-relaxed">
          Cada assinante pago ajuda a manter o conteúdo principal gratuito e a
          financiar novos projetos.
        </p>
        <div className="pt-4">
          <Button variant="primary" href="/apoio" className="text-sm" trail>
            apoiar
          </Button>
        </div>
      </section>
    </main>
  );
}
