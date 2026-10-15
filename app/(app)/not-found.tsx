import Link from "next/link";

// 404 DENTRO da área logada (consulta, plano ou paciente que não existe ou
// não é desta conta). O layout da área logada já tem cabeçalho e <main>;
// a 404 da raiz traria o cabeçalho do site público junto (ficava duplicado).
export default function AppNotFound() {
  return (
    <div className="flex max-w-xl flex-col items-start gap-6 py-8">
      <p className="font-bold tracking-widest text-green-700">ERRO 404</p>
      <h1 className="font-fraunces text-4xl font-medium">Não encontramos esta página</h1>
      <p>O endereço pode estar errado, o item pode ter sido removido ou não pertence à sua conta.</p>
      <Link href="/dashboard" className="btn-primary">
        Voltar ao início
      </Link>
    </div>
  );
}
