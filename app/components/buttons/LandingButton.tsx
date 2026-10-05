import Link from "next/link";

// Botão "Começar agora" da landing page (leva ao cadastro de paciente).
// O texto era "Agendar uma consulta", mas o agendamento ainda não existe:
// prometer o que a tela seguinte não entrega frustra a pessoa.
// É um LINK (e não <button> com router.push): navegar é papel de link.
// Assim funciona sem JavaScript, abre em nova aba e o leitor de tela
// anuncia corretamente como "link".
export default function LandingButton({ href }: { href: string }) {
  return (
    <div>
      <Link href={href} className="button-test mb-10 inline-flex items-center rounded-4xl p-2 font-bold">
        <img src="/icons/cronograma.png" alt="" className="mx-2 w-10" />
        <span className="button__text">Começar agora</span>
      </Link>
    </div>
  );
}
