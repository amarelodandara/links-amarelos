import Image from "next/image";
import Link from "next/link";
import AutoTooltips from "./components/AutoTooltips";
import LogoCarousel from "./components/LogoCarousel";
import ExperimenteSection from "./components/ExperimenteSection";
import CountdownOdometer from "./components/CountdownOdometer";
import FloatingLink from "./components/FloatingLink";
import ExternalLinkPill from "./components/ExternalLinkPill";
import Button from "./components/Button";
import SectionPill from "./components/SectionPill";

export default function Home() {
  return (
    <main className="min-h-screen bg-(--sun) w-full md:max-w-4xl md:mx-auto md:border-x border-sun">
      <section className="grid grid-cols-1 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-sun-light items-end">
        <div className="p-4 h-80 flex flex-col justify-end col-span-full md:col-span-3 space-y-4">
          <AutoTooltips />
        </div>

        <div className="col-span-full md:col-span-2 bg-sun-light md:bg-transparent">
          <p className="uppercase text-sm text-sun px-4 pt-12 md:pt-2 pb-2 font-unbounded">
            Comece por aqui
          </p>

          <div className="text-brand-black md:text-sun-lighter">
            <Link
              href="https://amarelodandara.substack.com/links-amarelos-3"
              className="border-sun md:border-sun-light border-t flex items-center gap-4 hover:bg-code group py-3"
            >
              <Image
                src="/brand/links-amarelos-3.png"
                width={2000}
                height={2000}
                className="size-24 aspect-square rotate-6 -my-3 shrink-0 outline outline-2 outline-sun-light transition-transform duration-200 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] group-hover:scale-110 group-hover:-translate-y-1"
                alt="links amarelos #3"
              />

              <div className="w-full mr-3">
                <div className="flex items-center justify-between">
                  <p className="font-manrope font-bold tracking-tight">
                    links amarelos #3
                  </p>
                </div>
                <p className="font-manrope text-sm">
                  maestros, saltos e seriedade
                </p>
              </div>
            </Link>

            <Link
              href="https://open.spotify.com/episode/56YFLEYZebBCBU9DEOCZlL?si=ceb9096ddfc347c3"
              className="border-sun md:border-sun-light border-t flex items-center gap-4 hover:bg-code group py-3"
            >
              <Image
                src="/brand/ondas-amarelas-6.png"
                width={2000}
                height={2000}
                className="size-24 aspect-square -rotate-3 -my-3 shrink-0 outline outline-2 outline-sun-light transition-transform duration-200 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] group-hover:scale-110 group-hover:-translate-y-1"
                alt="ondas amarelas #6"
              />
              <div className="w-full mr-3">
                <div className="flex items-center justify-between">
                  <p className="font-manrope font-bold tracking-tight">
                    ondas amarelas #6
                  </p>
                </div>
                <p className="font-manrope text-sm">
                  autorrealização, autocriação
                </p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <div>
        {/* <div className="text-sun-light">
          <LogoCarousel />
        </div>*/}

        <ExperimenteSection />

        <section
          id="apoie"
          className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-sun-light "
        >
          <div className="flex flex-col items-center py-16 aspect-square justify-around bg-[url('/bg-texture-cutting-pad.svg')] bg-cover">
            <SectionPill className="mx-auto">Explore</SectionPill>

            <div className="font-manrope text-center mx-auto space-y-4">
              <p className="w-2/3 mx-auto text-xl  font-semibold tracking-tigther leading-snug">
                Newsletters e podcasts <br></br> são só o começo
              </p>
              <p className="w-2/3 mx-auto">
                Com o seu apoio o plano é explorar a internet, o mundo físico,
                pintar cidades de amarelo e muito mais...
              </p>
            </div>

            <Button variant="primary" href="/realizacoes" className="text-sm">
              ver realizações
            </Button>
          </div>

          <div className="flex flex-col items-center py-16 aspect-square justify-around bg-code text-white">
            <SectionPill tone="dark" className="mx-auto">
              Apoie
            </SectionPill>

            <div className="font-manrope text-center mx-auto space-y-4 ">
              <p className="w-2/3 mx-auto text-xl  font-semibold tracking-tigther leading-snug">
                Junte-se aos canarinhos ou doe expontaneamente
              </p>

              <p className="w-4/5 mx-auto">
                Mergulhe nos links amarelos com conteúdos exclusivos e patrocine
                iniciativa para todos
              </p>
            </div>

            <Button
              variant="primary-inverted"
              href="/apoio"
              className="text-sm"
            >
              ver planos
            </Button>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2  divide-y md:divide-y-0 md:divide-x-2 divide-sun-light">
          <div className="flex flex-col items-center py-8 aspect-square justify-around bg-sun-light ">
            <SectionPill className="mx-auto">última edição</SectionPill>

            <div className="flex flex-col items-center gap-2">
              <div>
                <p className="font-manrope text-2xl font-bold tracking-tighter">
                  links amarelos #8
                </p>
                <p className="font-unbounded">ondas amarelas #8</p>
              </div>

              <p className="w-3/4 font-manrope text-center text-sm">
                uma semana de pensamento com o Espírito Santo, amém
              </p>
            </div>
            <div className="flex w-full justify-center border-y border-sun">
              <Image
                src="/brand/links-amarelos-8.png"
                width={2000}
                height={2000}
                className="size-30 aspect-square rotate-6 -my-3 shrink-0 outline outline-2 outline-sun-light transition-transform duration-200 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] group-hover:scale-110 group-hover:-translate-y-1"
                alt="links amarelos #3"
              />
              <Image
                src="/brand/ondas-amarelas-8.png"
                width={2000}
                height={2000}
                className="size-30 aspect-square -rotate-6 -my-3 shrink-0 outline outline-2 outline-sun-light transition-transform duration-200 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] group-hover:scale-110 group-hover:-translate-y-1"
                alt="links amarelos #3"
              />
            </div>

            <div className="flex gap-2">
              <ExternalLinkPill
                platform="substack"
                href="https://amarelodandara.substack.com"
                className="flex bg-white/20"
              />
              <ExternalLinkPill
                platform="spotify"
                href="https://open.spotify.com/show/043Gs7eyY2KOlotEWSTSxB?si=e7abf2b9730747d7"
                className="flex bg-white/20"
              />
            </div>
          </div>

          <div className="items-center pt-16 aspect-square">
            <div className="flex justify-between">
              <p className="uppercase text-sm text-sun-lighter px-4 py-2 font-unbounded">
                Próximas edições
              </p>

              <p className="uppercase text-sm text-sun-lighter px-4 py-2 font-unbounded">
                <CountdownOdometer />
              </p>
            </div>

            <div>
              <div className="border-sun-light border-t flex flex-col items-center gap-12 py-3">
                <Image
                  src="/brand/coming-newsletter.png"
                  width={2000}
                  height={2000}
                  className="size-36 aspect-square rotate-6 -my-3 shrink-0 outline outline-2 outline-sun-light"
                  alt="links amarelos #3"
                />

                <div className="text-center flex flex-col items-center">
                  <div className="flex items-start gap-2">
                    <p className="font-manrope font-bold text-lg tracking-tight">
                      hyperlinks #1
                    </p>

                    <SectionPill className="mx-auto">grátis</SectionPill>
                  </div>

                  <p className="text-sm w-4/5 font-manrope">
                    o primeiro episódio dos hyperlinks{" "}
                    <span className="font-redacted text-sun-light">
                      amarelos
                    </span>
                    , grátis pra todos, sobre a coisa mais{" "}
                    <span className="font-redacted text-sun-light">
                      amarela
                    </span>{" "}
                    que já{" "}
                    <span className="font-redacted text-sun-light">
                      entrou em campo.
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex justify-center items-center gap-6 border-t border-sun-lighter py-6 md:py-4">
                <div className="flex">
                  <Image
                    src="/brand/coming-newsletter.png"
                    width={2000}
                    height={2000}
                    className="size-16 aspect-square -rotate-6  shrink-0 outline outline-2 outline-sun-light "
                    alt="links amarelos #3"
                  />

                  <Image
                    src="/brand/coming-podcast.png"
                    width={2000}
                    height={2000}
                    className="size-16 aspect-square rotate-6 shrink-0 outline outline-2 outline-sun-light "
                    alt="links amarelos #3"
                  />
                </div>

                <div className="">
                  <p className="font-manrope text-xl font-bold tracking-tight">
                    links amarelos #9
                  </p>
                  <p className="font-unbounded text-sm">ondas amarelas #9</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-0 py-20 font-manrope border-t border-sun bg-sun-light overflow-hidden">
          <div className=" px-12 flex flex-col justify-end gap-6">
            {" "}
            <p className="text-xl font-semibold tracking-tight leading-snug">
              Os links amarelos são curados e realizados{" "}
              <span className="text-sun"> em uma semana </span> por amarelo
              dandara.
            </p>
            <Button variant="ghost" href="/manifesto">
              Leia o manifesto amarelo
            </Button>
          </div>

          <div className="font-manrope px-12">
            <ul className="space-y-2 lowercase">
              <li className="">
                <span className="font-semibold tracking-tight">Curadoria </span>
                Amarelo Dandara
              </li>
              <li className="">
                <span className="font-semibold tracking-tight">Escrita </span>
                Amarelo Dandara
              </li>
              <li className="">
                <span className="font-semibold tracking-tight">Narração </span>
                Amarelo Dandara
              </li>
              <li className="">
                <span className="font-semibold tracking-tight">Produção </span>
                Amarelo Dandara
              </li>
              <li className="">
                <span className="font-semibold tracking-tight">Edição </span>
                Amarelo Dandara
              </li>
              <li className="">
                <span className="font-semibold tracking-tight">Design </span>
                Amarelo Dandara
              </li>
              <li className="">
                <span className="font-semibold tracking-tight">
                  Desenvolvimento{" "}
                </span>
                Amarelo Dandara
              </li>
              <li className="">
                <span className="font-semibold tracking-tight">
                  Direção Criativa{" "}
                </span>
                Amarelo Dandara
              </li>
            </ul>

            <div className="mt-6 pt-6 border-t border-(--sun)">
              <p className="lowercase">
                <span className="font-semibold tracking-tight">Apoio </span>
                amigos, amarelinhos
              </p>
            </div>
          </div>
          <FloatingLink
            title="a palavra pra quem faz tudo"
            url="https://en.wikipedia.org/wiki/Gesamtkunstwerk"
          />
        </section>
      </div>
    </main>
  );
}
