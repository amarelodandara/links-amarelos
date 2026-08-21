const routes = ["", "/sobre", "/manifesto", "/realizacoes", "/apoio"];

export default function sitemap() {
  const base = "https://linksamarelos.com";
  return routes.map((route) => ({
    url: `${base}${route}`,
    lastModified: new Date(),
  }));
}
