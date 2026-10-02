import type { Metadata } from "next";
import Link from "next/link";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { getSession, homeFor } from "./lib/session";

export const metadata: Metadata = { title: "Página não encontrada | NutriMente" };

// Página 404. Tem cabeçalho e rodapé como as outras páginas públicas, para
// a pessoa não ficar "presa" numa tela sem saída.
export default async function NotFound() {
  const session = await getSession();
  const user = session ? { name: session.name, home: homeFor(session.role) } : null;

  return (
    <>
      <Header user={user} />
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
      <Footer />
    </>
  );
}
