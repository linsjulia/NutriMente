import type { MetadataRoute } from "next";

const SITE = "https://nutrimente.tech";

// /sitemap.xml: só as páginas públicas
export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/about", "/professionals", "/register", "/login", "/terms", "/privacy"].map((path) => ({
    url: `${SITE}${path}`,
  }));
}
