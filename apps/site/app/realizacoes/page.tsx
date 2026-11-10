import RealizacoesClient from "./RealizacoesClient";

export const metadata = {
  title: "realizações",
  description: "O que nasce dos links amarelos — projetos ativos, em construção e planejados.",
  alternates: { canonical: "/realizacoes" },
  openGraph: {
    title: "realizações • links amarelos",
    description: "O que nasce dos links amarelos — projetos ativos, em construção e planejados.",
    url: "/realizacoes",
  },
  twitter: {
    title: "realizações • links amarelos",
    description: "O que nasce dos links amarelos — projetos ativos, em construção e planejados.",
  },
};

export default function RealizacoesPage() {
  return <RealizacoesClient />;
}
