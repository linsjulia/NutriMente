import Image from "next/image";
import Link from "next/link";

// Layout das telas de login, cadastro e senha.
// Celular: uma coluna só (formulário). Desktop (lg): formulário à esquerda
// e foto à direita. O <main id="conteudo"> é o destino do "Pular para o conteúdo".
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row">
      <div className="flex w-full flex-col px-4 py-6 sm:px-10 lg:w-1/2">
        <header>
          <Link href="/" className="inline-flex items-center gap-3" aria-label="NutriMente: voltar para a página inicial">
            <Image src="/logo/nutrimente-v2.png" alt="" width={64} height={64} className="h-auto w-14 sm:w-16" />
            <span className="font-fraunces text-2xl text-blue1 sm:text-3xl">NutriMente</span>
          </Link>
        </header>
        <main id="conteudo" className="flex flex-1 items-start justify-center py-8 lg:items-center">
          <div className="w-full max-w-xl">{children}</div>
        </main>
      </div>

      {/* Só aparece no desktop; no celular a imagem nem é baixada */}
      <div className="hidden p-5 lg:block lg:w-1/2">
        <div className="sticky top-5 h-[calc(100vh-2.5rem)] w-full">
          <Image src="/doctor/profissionais.jpg" alt="" fill sizes="50vw" className="rounded-2xl object-cover" />
        </div>
      </div>
    </div>
  );
}
