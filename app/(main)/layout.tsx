import type { Metadata } from "next";
import { Geist, Geist_Mono, Open_Sans, Fraunces } from "next/font/google";
import "../globals.css";
import Header from "../components/Header";

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
})

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"]
})

export const metadata: Metadata = {
  title: "NutriMente",
  description: "Plataforma que conecta pacientes a profissionais da área da nutrição e psicologia",
  icons: {
    icon: "/logo/nutrimente-v3.png"
  }
};

export default function MainLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${openSans.variable} ${fraunces.variable} text-blue2 font-open-sans h-full antialiased`}
    >
      <body className="min-h-full flex flex-col text-blue2 {`${openSans.variable} font-open-sans`}">
        <Header/>
        {children}
        </body>
    </html>
  );
}
