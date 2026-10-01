import type { Metadata } from "next";
import { Geist, Geist_Mono, Open_Sans, Fraunces } from "next/font/google";
import "./globals.css";
import SkipLink from "./components/accessibility/SkipLink";
import AccessibilityMenu from "./components/accessibility/AccessibilityMenu";
import { AccessibilityProvider } from "./components/accessibility/AccessibilityProvider";
import { INLINE_APPLY_SCRIPT } from "./components/accessibility/preferences";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

// Favicon: app/icon.png (64x64, gerado do logo). Antes era um PNG de 800 KB.
export const metadata: Metadata = {
  title: "NutriMente",
  description: "Plataforma que conecta pacientes a profissionais da área da nutrição e psicologia",
};

// Layout RAIZ: envolve TODAS as páginas (home, login, cadastro...).
// Tudo que precisa existir no site inteiro (fontes, acessibilidade) fica aqui.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // lang="pt-BR": o leitor de tela usa para pronunciar em português.
    // Com "en", ele lê o texto com sotaque/regras do inglês.
    // suppressHydrationWarning: o script abaixo adiciona atributos data-a11y-*
    // no <html> antes do React carregar; isso avisa o React que é esperado.
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${openSans.variable} ${fraunces.variable} text-blue2 font-open-sans h-full antialiased`}
    >
      <head>
        {/*
          Aplica as preferências de acessibilidade salvas ANTES da página ser
          desenhada, evitando que ela "pisque" com o visual padrão.
          Ver app/components/accessibility/preferences.ts
        */}
        <script dangerouslySetInnerHTML={{ __html: INLINE_APPLY_SCRIPT }} />
      </head>
      {/* pb-20: espaço para o botão flutuante de acessibilidade não cobrir o fim da página */}
      <body className="min-h-full flex flex-col pb-20 text-blue2 font-open-sans sm:pb-0">
        <AccessibilityProvider>
          {/* Primeiros itens do Tab: pular conteúdo e menu de acessibilidade */}
          <SkipLink />
          <AccessibilityMenu />
          {children}
        </AccessibilityProvider>
      </body>
    </html>
  );
}
