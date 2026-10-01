import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Página não encontrada | NutriMente" };

// Página 404 (endereço que não existe). Antes era a página padrão do
// Next.js, em inglês e sem o visual do site.
export default function NotFound() {
  return (
    <main id="conteudo" className="mx-auto flex w-full max-w-xl flex-1 flex-col items-start justify-center gap-6 px-4 py-16">
      <p className="font-bold tracking-widest text-green-700">ERRO 404</p>
      <h1 className="font-fraunces text-4xl font-medium">Página não encontrada</h1>
      <p>O endereço pode estar errado ou a página pode ter mudado de lugar.</p>
      <div className="flex flex-wrap gap-3">
        <Link href="/" className="btn-primary">
          Ir para o início
        </Link>
        <Link href="/professionals" className="btn-secondary">
          Ver profissionais
        </Link>
      </div>
    </main>
  );
}
