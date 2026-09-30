import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = { title: "Cadastro | NutriMente" };

// Primeira tela do cadastro: a pessoa escolhe o TIPO de conta.
// Cada tipo tem seu próprio formulário (os dados pedidos são diferentes).
const OPTIONS = [
  {
    href: "/register/patient",
    title: "Sou paciente",
    description: "Quero encontrar nutricionistas e psicólogos e acompanhar meu cuidado.",
    image: "/patient/paciente.jpg",
  },
  {
    href: "/register/professional",
    title: "Sou profissional",
    description: "Sou nutricionista (CRN) ou psicólogo(a) (CRP) e quero atender pela plataforma.",
    image: "/doctor/nutricionista.jpg",
  },
];

export default function RegisterChoicePage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-fraunces text-4xl font-medium sm:text-5xl">Crie sua conta</h1>
        <p className="mt-3 text-gray-700">Como você vai usar o NutriMente?</p>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2">
        {OPTIONS.map((option) => (
          <li key={option.href}>
            <Link
              href={option.href}
              className="group flex h-full flex-col overflow-hidden rounded-2xl border-2 border-gray-200 transition hover:border-blue1"
            >
              <img src={option.image} alt="" className="h-36 w-full object-cover" />
              <span className="flex flex-1 flex-col gap-2 p-5">
                <span className="flex items-center justify-between text-xl font-bold text-blue1">
                  {option.title}
                  <ArrowRight aria-hidden className="transition group-hover:translate-x-1" />
                </span>
                <span className="text-gray-700">{option.description}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <p className="text-center">
        Já tem conta?{" "}
        <Link href="/login" className="font-bold underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
