import type { MetadataRoute } from "next";

const routes = ["", "/sobre", "/manifesto", "/realizacoes", "/apoio"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://linksamarelos.com";
  return routes.map((route) => ({
    url: `${base}${route}`,
    lastModified: new Date(),
  }));
}
