import type { MetadataRoute } from "next";

const SITE = "https://nutrimente.tech";

// /robots.txt: buscadores podem ver as páginas públicas, mas não a área logada
// nem as telas que dependem de token (confirmação de e-mail, nova senha).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard", "/account", "/admin", "/appointments", "/notifications", "/plans",
        "/diary", "/onboarding", "/patients", "/verify-email", "/reset-password", "/api/",
      ],
    },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
