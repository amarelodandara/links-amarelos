import Link from "next/link";
import TypingCycler from "../components/TypingCycler";
import PageActions from "../components/PageActions";
import Signature from "../components/Signature";

export const metadata = {
  title: "manifesto",
  description:
    "Os quatro princípios que guiam os links amarelos e tudo que nasce deles.",
  alternates: { canonical: "/manifesto" },
  openGraph: {
    title: "manifesto • links amarelos",
    description:
      "Os quatro princípios que guiam os links amarelos e tudo que nasce deles.",
    url: "/manifesto",
  },
  twitter: {
    title: "manifesto • links amarelos",
    description:
      "Os quatro princípios que guiam os links amarelos e tudo que nasce deles.",
  },
};

export default function ManifestoPage() {
  return (
    <main className="min-h-screen bg-sun w-full md:max-w-4xl md:mx-auto border-x border-sun divide-y divide-sun">
      {/* Manifesto */}
      <section id="manifesto" className="bg-sun-lighter">
        <div className="px-8 py-16 space-y-10">
          <div className="flex items-center justify-between gap-4">
            <nav aria-label="Trilha de navegação">
              <ol className="flex items-center gap-2 leading-none">
                <li className="flex items-center">
                  <Link
                    href="/sobre"
                    className="font-geist-mono text-xs lowercase text-brand-black/60 underline-offset-4 transition-colors hover:text-brand-black hover:underline"
                  >
                    sobre
                  </Link>
                </li>
                <li aria-hidden="true" className="flex items-center font-geist-mono text-xs text-brand-black/40">
                  /
                </li>
                <li aria-current="page" className="flex items-center">
                  {/* Marker highlight, not a pill — the pill read as another
                      small button next to the action row. Same bg-sun treatment
                      as the cycling domain in the opening paragraph. */}
                  <span className="bg-sun px-1 font-geist-mono text-xs lowercase text-brand-black">
                    manifesto
                  </span>
                </li>
              </ol>
            </nav>

            <PageActions
              title="o manifesto amarelo"
              markdownTargetId="manifesto-content"
            />
          </div>

          <div
            id="manifesto-content"
            className="font-geist-sans text-base max-w-prose md:w-3/4 space-y-6"
          >
            {/* Intro */}
            <div className="space-y-4">
              <p className="text-2xl md:text-3xl leading-snug tracking-tight w-4/5">
                Links podem começar com qualquer coisa, mas acho que esquecemos
                disso. Hoje em dia todos os links começam com{" "}
                <span className="font-space-mono bg-sun px-1">
                  https://
                  <TypingCycler />
                </span>.
              </p>
              <p className="leading-relaxed text-balance">
                Mas aqui não. Aqui os links começam de maneiras imprevisíveis e pertencem a
                qualquer mídia. Os links amarelos, as ondas amarelas, e o que mais sair disso,
                são uma contribuição para que <span className="font-semibold">passemos mais tempo na internet
                como o nosso bairro e não como o Shopping Deles Inc.</span>
              </p>
              <p className="leading-relaxed">
                E tudo que fazemos para que isso aconteça, se apoia em quatro
                princípios:
              </p>
            </div>

            {/* Princípio 1 */}
            <div className="space-y-4">
              <h2 className="font-unbounded text-xl text-brand-black tracking-tight">
                Profundidade e Otimismo
              </h2>
              <p className="leading-relaxed text-balance">
                Enquanto o resto da internet estiver preocupado com resumir,
                cortar e viralizar, aqui eu vou me preocupar com respirar fundo,
                rolar até o fim da página e priorizar a mensagem. Isso
                envolve contar a mensagem na mídia que ela precisa e não necessariamente na mais
                rápida. Significa também contar com calma e com fontes.
              </p>
              <p className="leading-relaxed text-balance">
                Essa profundidade vai ser feita com otimismo. É fácil achar o
                lado ruim das coisas, é mais fácil ainda se beneficiar dele. É
                beeem mais difícil discutir pontos que são amarelos como o sol: funcionam todo dia e te dão vontade de levantar.
              </p>
            </div>

            {/* Princípio 2 */}
            <div className="space-y-4">
              <h2 className="font-unbounded text-xl text-brand-black tracking-tight">
                Presença e Multimídias
              </h2>
              <p className="leading-relaxed text-balance">
                A internet é mais que texto e imagem, vídeo curto e propaganda.
                Eu procuro por elementos inusitados, por histórias sendo
                contadas sem som, com muito som ou só com o teclado. O amarelo
                mora em todas as mídias.
              </p>
              <p className="leading-relaxed text-balance">
                E eu amo a internet, mas o mundo não acaba aqui. Eu encontro
                pessoas que são otimistas e as apoio com profundidade no mundo
                real, no mundo físico, no mundo impresso, nas letras e nos asfaltos.
              </p>
            </div>

            {/* Princípio 3 */}
            <div className="space-y-4">
              <h2 className="font-unbounded text-xl text-brand-black tracking-tight">
                Auto-sustententabilidade e Expansão
              </h2>
              <p className="leading-relaxed text-balance">
                A curadoria não começou com a primeira edição da newsletter e
                não vai parar se um dia a newsletter acabar. A melhor maneira de sustentá-la é vivendo a minha vida sem vergonha por aí, porque tem muitas outras cores por aí.
              </p>
              <p className="leading-relaxed text-balance">
                O sol nasce e brilha, doa a quem doer, sorria a quem sorrir. Tocaremos todas as superfícies, nos daremos todas as chances, e não verão esse filho fugir da luta.
              </p>
            </div>

            {/* Princípio 4 */}
            <div className="space-y-4">
              <h2 className="font-unbounded text-xl text-brand-black tracking-tight">
                Apoiado e Apoiador
              </h2>
              <p className="leading-relaxed text-balance">
                Todo apoio dado a esse projeto me dá a simples chance de:
                continuar brincando. E eu continuarei brincando, na esperança de que alguém se una a mim, porque eu adoro compartilhar brinquedos.
              </p>
              <p className="leading-relaxed text-balance">
                E enquanto me segurarem de pé, impulsionarei outros pra cima.
                Procurarei oportunidades de apoiar, retribuir, e dar o
                elogio que alguém precisa pra continuar fazendo o que ama e o
                que sabe. Se precisar de mim, é só me chamar.
              </p>
            </div>

            {/* Fechamento */}
            <div className="mt-12 space-y-12 pt-12 border-t border-dashed border-sun">
              <p className="text-2xl md:text-3xl leading-snug tracking-tight text-balance">
                Esses princípios trazem todas as recomendações até vocês e guiam
                todas as realizações do papel para a realidade. É com eles que o mundo se pinta de amarelo.
              </p>
              <div className="space-y-2">
                <Signature
                  title="Assinatura de Amarelo Dandara"
                  className="w-36 text-brand-black md:w-40"
                />
                <div className="space-y-1">
                <p className="text-lg text-brand-black font-manrope lowercase font-semibold tracking-tight">
                  Amarelo Dandara
                </p>
                <p className="text-sm">
                  <a
                    href="https://en.wikipedia.org/wiki/Gesamtkunstwerk"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-4 decoration-brand-black/30 hover:decoration-brand-black transition-colors"
                  >
                    Gesamtkunstwerk
                  </a>{" "}
                  dos links amarelos e muito mais
                </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
