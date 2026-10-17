"use client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupButton,
} from "@/components/ui/input-group";
import { Search } from "lucide-react";

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
            <label
              htmlFor="busca"
              className="block text-xs font-bold text-slate-900"
            >
              O que você procura?
            </label>
            {/* <input
                id="busca"
                type="text"
                placeholder="Nome, área de atuação, tipo de profissional"
                className="w-full bg-transparent text-xs outline-none placeholder:text-slate-400 outline-none"
              /> */}

            <InputGroup>
              <InputGroupInput type="text" placeholder="Buscar..." className="bg-white"/>
              <InputGroupAddon align="inline-start">
                <Search className="h-4 w-4" />
              </InputGroupAddon>

              <InputGroupAddon align="inline-end">
                <InputGroupButton variant="default" size="sm" className="mr-1">
                  Buscar
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
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
