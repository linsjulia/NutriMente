"use client";

import Image from "next/image";
import Link from "next/link";

export default function HeaderSearchBar() {
  return (
    <header className="bg-linear-to-r sticky z-50 top-0 bg-blue1">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-2 md:gap-8 md:px-8">
        <Image
          src="/logo/nutrimente-v1.png"
          width={60}
          height={60}
          alt="Logo do NutriMente"
        />
        <form onSubmit={(e) => e.preventDefault()} className="">
          <div className="min-w-0 flex-1">
          <div className="flex bg-white rounded-lg gap-10 p-2 px-4 shadow-md">
            <div className="flex flex-col">
                <label htmlFor="busca">O que você procura?</label>
                <input type="text" placeholder="Nome, área de atuação, tipo de profissional" className="outline-none w-78"/>
            </div>
            <Link href="/" className="button bg-green-600 rounded-lg p-3 px-5 text-white font-bold transition hover:bg-green-600/80">Buscar</Link>
            </div>
          </div>
        </form>

        <div className="ml-auto flex items-center gap-3">
          <span className="hidden text-sm font-semibold text-white sm:inline">
            Júlia
          </span>
          <Image
            src="/icons/circle-user-solid-full.svg"
            width={50}
            height={50}
            alt="Icon de usuário"
          />
        </div>
      </div>
    </header>
  );
}
