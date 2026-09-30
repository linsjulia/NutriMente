"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/professionals", label: "Profissionais" },
  { href: "/about", label: "Sobre nós" },
];

type HeaderProps = {
  /** null = visitante; senão, nome e página inicial de quem está logado */
  user: { name: string; home: string } | null;
};

/**
 * Cabeçalho público. Antes: links "#", botão "Cadastre-se" usando
 * router.push (não abria em nova aba e não funcionava sem JS) e o menu do
 * celular levava para /cadastro, uma página que não existe.
 */
export default function Header({ user }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  // Fecha o menu do celular ao trocar de página. Ajustar o estado durante a
  // renderização quando algo muda é o jeito recomendado pelo React (um
  // useEffect aqui causaria uma renderização extra).
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setIsMenuOpen(false);
  }

  const isCurrent = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  const actions = user ? (
    <Link href={user.home} className="rounded-full bg-green1 px-8 py-3 font-bold text-blue2 transition hover:bg-green3">
      Minha área
    </Link>
  ) : (
    <>
      <Link href="/login" className="rounded-full border-2 border-white px-6 py-2.5 font-bold transition hover:bg-white/10">
        Entrar
      </Link>
      <Link href="/register" className="rounded-full bg-green1 px-6 py-3 font-bold text-blue2 transition hover:bg-green3">
        Cadastre-se
      </Link>
    </>
  );

  return (
    <header className="header sticky top-0 z-50 bg-blue1 text-white">
      <div className="flex h-16 items-center justify-between px-4 md:px-8 lg:h-18">
        <Link href="/" className="h-full py-1" aria-label="NutriMente: página inicial">
          <Logo />
        </Link>

        {/* Desktop */}
        <nav aria-label="Navegação principal" className="hidden items-center gap-8 md:flex lg:gap-14">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} aria-current={isCurrent(item.href) ? "page" : undefined} className="underline-offset-8 hover:underline aria-[current=page]:underline">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">{actions}</div>

        {/* Celular: botão do menu */}
        <button
          type="button"
          onClick={() => setIsMenuOpen((open) => !open)}
          className="p-2 md:hidden"
          aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={isMenuOpen}
          aria-controls="menu-mobile"
        >
          <svg aria-hidden="true" className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Celular: menu aberto (logo abaixo do cabeçalho) */}
      {isMenuOpen && (
        <div id="menu-mobile" className="flex flex-col items-center gap-6 border-t border-white/10 bg-blue1 py-6 shadow-lg md:hidden">
          <nav aria-label="Navegação principal" className="flex flex-col items-center gap-4">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} aria-current={isCurrent(item.href) ? "page" : undefined}>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex flex-wrap items-center justify-center gap-3">{actions}</div>
        </div>
      )}
    </header>
  );
}
