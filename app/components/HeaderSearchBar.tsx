"use client";

import Image from "next/image";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupButton,
} from "@/components/ui/input-group";
import { Search } from "lucide-react";
import Link from "next/link";

export default function HeaderSearchBar() {
  return (
    <header className="bg-linear-to-r from-emerald-100 via-cyan-100 to-sky-200">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 md:gap-8 md:px-8">
        <Image
          src="/logo/nutrimente-v2.png"
          width={50}
          height={50}
          alt="Logo do NutriMente"
        />
        <form onSubmit={(e) => e.preventDefault()} className="">
          <div className="min-w-0 flex-1">
          <div className="flex bg-white rounded-lg gap-10 p-4 shadow-md">
            <div className="flex flex-col">
                <label htmlFor="busca">O que você procura?</label>
                <input type="text" placeholder="Nome, área de atuação, tipo de profissional" className="outline-none w-78"/>
            </div>
            <Link href="/" className="button bg-green-600 rounded-lg p-3 px-5 text-white font-bold transition hover:bg-green-600/80">Buscar</Link>
            </div>
          </div>
        </form>

        <div className="ml-auto flex items-center gap-3">
          <span className="hidden text-sm font-semibold text-blue-900 sm:inline">
            Júlia
          </span>
          <Image
            src="/icons/circle-user-solid-full.svg"
            width={30}
            height={30}
            alt="Icon de usuário"
          />
        </div>
      </div>
    </header>
  );
}
