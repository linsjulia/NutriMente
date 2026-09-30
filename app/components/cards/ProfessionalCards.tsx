import Link from "next/link";
import CategoryBadge from "../badge/CategoryBagde";

interface Props {
  titulo: string;
  tipoProfissional: string;
  documento: string;
  descricao: string;
  categoria: string;
  segundaCategoria: string;
  img: string;
}

// Card de exemplo da landing page.
// Largura: w-full + max-w-105 (420px) -> no celular ocupa a tela, no
// desktop para em 420px. Sem altura fixa, para o texto nunca ser cortado
// quando a pessoa aumenta a fonte no menu de acessibilidade.
export default function CardProfi({ titulo, tipoProfissional, documento, descricao, categoria, segundaCategoria, img }: Props) {
  return (
    <article className="flex w-full max-w-105 flex-col gap-4 rounded-2xl border border-gray-400 p-6 shadow-xl sm:p-8">
      <div className="my-4 flex items-center justify-center gap-6">
        <img src={img} alt={`Foto de ${titulo}`} className="w-20 rounded-full bg-green-700" />
        <div>
          <h3 className="font-fraunces text-lg font-semibold">{titulo}</h3>
          <p>{tipoProfissional}</p>
          <p>{documento}</p>
        </div>
      </div>

      <p className="flex-1">{descricao}</p>

      <div className="flex flex-col gap-3">
        <CategoryBadge categoria={categoria} />
        <CategoryBadge categoria={segundaCategoria} />
      </div>

      {/* Antes eram <button> sem ação; agora levam a páginas reais */}
      <div className="flex flex-wrap gap-3">
        <Link href="/professionals" className="rounded-lg border border-gray-300 p-2 transition duration-300 hover:-translate-y-0.5">
          Ver profissionais
        </Link>
        <Link href="/register/patient" className="rounded-lg border border-gray-300 p-2 transition duration-300 hover:-translate-y-0.5">
          Agendar
        </Link>
      </div>
    </article>
  );
}
