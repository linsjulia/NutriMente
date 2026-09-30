import type { NextConfig } from "next";

/**
 * Cabeçalhos de segurança enviados em TODAS as páginas.
 * - Referrer-Policy: os links de e-mail levam um token na URL
 *   (/reset-password?token=...). Sem esta regra, o endereço completo
 *   poderia ser enviado a outros sites ao clicar num link externo.
 * - X-Frame-Options / frame-ancestors: impede que o site seja aberto
 *   dentro de um <iframe> de outro site (ataque de "clickjacking").
 * - X-Content-Type-Options: o navegador não tenta "adivinhar" o tipo de arquivo.
 * - Permissions-Policy: desliga câmera, microfone e localização, que o site não usa.
 */
const securityHeaders = [
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.0.98"],
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
