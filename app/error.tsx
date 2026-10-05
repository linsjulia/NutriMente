"use client"; // telas de erro precisam ser Client Components

import { useEffect } from "react";
import Link from "next/link";

/**
 * Tela mostrada quando algo quebra numa página (ex.: a API caiu enquanto
 * a "Minha conta" carregava). Sem este arquivo, aparecia a tela genérica
 * do Next.js, em inglês.
 *
 * retry(): tenta carregar a página de novo (no Next 16 se chama "retry").
 * error.digest: código do erro nos logs do servidor; a mensagem técnica
 * NÃO é mostrada para a pessoa (poderia expor detalhes internos).
 */
export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id="conteudo" className="mx-auto flex w-full max-w-xl flex-1 flex-col items-start justify-center gap-6 px-4 py-16">
      <h1 className="font-fraunces text-4xl font-medium">Algo deu errado</h1>
      <p role="alert">Não conseguimos carregar esta página agora. Tente de novo em alguns instantes.</p>
      {error.digest && <p className="text-sm text-gray-600">Código do erro: {error.digest}</p>}
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => retry()} className="btn-primary">
          Tentar de novo
        </button>
        <Link href="/" className="btn-secondary">
          Ir para o início
        </Link>
      </div>
    </main>
  );
}
