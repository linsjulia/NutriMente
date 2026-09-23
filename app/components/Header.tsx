"use client";

import { useState } from "react";
import Logo from "./Logo";
import { useRouter } from "next/navigation";

export default function Header() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="header bg-blue1 text-white h-16 lg:h-18 flex items-center justify-between top-0 px-4 md:px-8 sticky z-50">
      {/* Logo */}
      <Logo />

      {/* Navegação Desktop */}
      <nav className="hidden md:flex items-center gap-8 lg:gap-14 text-white">
        <a href="#" className="hover:opacity-80 transition-opacity">Home</a>
        <a href="#" className="hover:opacity-80 transition-opacity">Profissionais</a>
        <a href="#" className="hover:opacity-80 transition-opacity">Sobre nós</a>
      </nav>

      {/* Botão Desktop */}
      <button
        onClick={() => router.push("/cadastro")}
        className="hidden md:block bg-green1 p-3 px-8 lg:px-10 rounded-full font-bold cursor-pointer hover:bg-green3 transition ease-in-out duration-200"
      >
        Cadastre-se
      </button>

      {/* Botão do Menu Hambúrguer (Mobile) */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="md:hidden p-2 text-white focus:outline-none"
        aria-label="Abrir menu"
      >
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isMenuOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Dropdown / Menu Mobile */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 w-full bg-blue1 flex flex-col items-center gap-6 py-6 shadow-lg border-t border-white/10">
          <nav className="flex flex-col items-center gap-4 text-white w-full">
            <a
              href="#"
              onClick={() => setIsMenuOpen(false)}
              className="hover:opacity-80 transition-opacity"
            >
              Home
            </a>
            <a
              href="#"
              onClick={() => setIsMenuOpen(false)}
              className="hover:opacity-80 transition-opacity"
            >
              Profissionais
            </a>
            <a
              href="#"
              onClick={() => setIsMenuOpen(false)}
              className="hover:opacity-80 transition-opacity"
            >
              Sobre nós
            </a>
          </nav>
          <button
            onClick={() => {
              setIsMenuOpen(false);
              router.push("/cadastro");
            }}
            className="bg-green1 p-3 px-8 rounded-full font-bold cursor-pointer hover:bg-green3 transition ease-in-out duration-200"
          >
            Cadastre-se
          </button>
        </div>
      )}
    </header>
  );
}