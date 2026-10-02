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
            {/* width/height na proporção real do arquivo (1916x1931), para não distorcer */}
            <Image src="/logo/nutrimente-v2.png" alt="" width={64} height={65} loading="eager" className="h-auto w-14 sm:w-16" />
            <span className="font-fraunces text-2xl text-blue1 sm:text-3xl">NutriMente</span>
          </Link>
        </header>
        <main id="conteudo" className="flex flex-1 items-start justify-center py-8 lg:items-center">
          <div className="w-full max-w-xl">{children}</div>
        </main>
      </div>

      {/* Só aparece no desktop. loading="eager": no desktop a foto é o maior
          elemento da tela (LCP) e deve carregar primeiro. No celular ela fica
          escondida; por causa do sizes="50vw" o navegador baixa só uma versão
          pequena (~15 KB), um custo baixo para não atrasar o desktop. */}
      <div className="hidden p-5 lg:block lg:w-1/2">
        <div className="sticky top-5 h-[calc(100vh-2.5rem)] w-full">
          {/* "fill" exige um pai com position relative/absolute/fixed; o sticky
              acima mantém a foto parada na rolagem, este div serve de moldura */}
          <div className="relative h-full w-full">
            <Image src="/doctor/profissionais.jpg" alt="" fill sizes="50vw" loading="eager" className="rounded-2xl object-cover" />
          </div>
        </div>
      </div>
    </div>
  );
}
