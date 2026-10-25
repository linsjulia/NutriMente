import Image from "next/image";
import Link from "next/link";

type Props = {
  /** Quem está logado (null = visitante) */
  user: { name: string; home: string } | null;
  /** Texto já buscado, para o campo voltar preenchido */
  query?: string;
};

// Cabeçalho da busca de profissionais. A busca é um formulário GET para
// /patient?q=... (funciona até sem JavaScript).
export default function HeaderSearchBar({ user, query = "" }: Props) {
  return (
    <header className="sticky top-0 z-50 bg-blue1">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2 md:gap-8 md:px-8">
        <Link href="/" aria-label="NutriMente: página inicial" className="shrink-0">
          <Image src="/logo/nutrimente-v1.png" width={60} height={60} alt="" className="h-12 w-12 sm:h-14 sm:w-14" />
        </Link>
        <form action="/patient" method="get" role="search" className="min-w-0 flex-1">
          <div className="flex items-center gap-2 rounded-lg bg-white p-2 shadow-md sm:gap-4 sm:px-4">
            <div className="flex min-w-0 flex-1 flex-col">
              <label htmlFor="busca" className="text-xs font-semibold text-slate-700 sm:text-sm">
                O que você procura?
              </label>
              <input
                id="busca"
                name="q"
                type="search"
                defaultValue={query}
                placeholder="Nome, área de atuação, tipo de profissional"
                className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-slate-500"
              />
            </div>
            <button
              type="submit"
              className="min-h-11 shrink-0 rounded-lg bg-green1 px-4 font-bold text-blue2 transition hover:bg-green3 sm:px-5"
            >
              Buscar
            </button>
          </div>
        </form>
        <Link href={user ? user.home : "/login"} className="flex shrink-0 items-center gap-2">
          <Image src="/icons/circle-user-solid-full.svg" width={40} height={40} alt="" className="h-10 w-10" />
          <span className="hidden text-sm font-semibold text-white sm:inline">
            {user ? user.name.split(" ")[0] : "Entrar"}
          </span>
          <span className="sr-only sm:hidden">{user ? "Minha área" : "Entrar"}</span>
        </Link>
      </div>
    </header>
  );
}
