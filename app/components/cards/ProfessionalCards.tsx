import Image from "next/image";
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

export default function CardProfi({
  titulo,
  tipoProfissional,
  documento,
  descricao,
  categoria,
  segundaCategoria,
  img,
}: Props) {
  return (
    <article className="flex w-full max-w-105 flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-[0_10px_30px_rgba(16,47,66,0.08)] transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-2 hover:shadow-[0_20px_45px_rgba(16,47,66,0.16)] motion-reduce:transition-none motion-reduce:hover:transform-none sm:p-8 lg:max-w-none lg:min-w-0 lg:flex-1 lg:gap-[clamp(0.75rem,1.1vw,1rem)] lg:p-[clamp(1.25rem,2vw,2rem)]">
      <div className="my-4 flex items-center justify-center gap-6 lg:my-[clamp(0.5rem,1vw,1rem)] lg:gap-[clamp(1rem,1.5vw,1.5rem)]">
        <Image
          src={img}
          alt={`Foto de ${titulo}`}
          width={99}
          height={100}
          className="aspect-square w-20 rounded-full bg-green-700 object-cover lg:w-[clamp(4rem,6vw,5rem)]"
        />
        <div className="min-w-0 text-sm lg:text-[clamp(0.8125rem,1vw,1rem)]">
          <h3 className="font-fraunces text-lg font-semibold lg:text-[clamp(1rem,1.35vw,1.125rem)]">
            {titulo}
          </h3>
          <p>{tipoProfissional}</p>
          <p>{documento}</p>
        </div>
      </div>

      <p className="flex-1 text-base lg:text-[clamp(0.8125rem,1vw,1rem)]">
        {descricao}
      </p>

      <div className="flex flex-col gap-3 font-medium">
        <CategoryBadge categoria={categoria} />
        <CategoryBadge categoria={segundaCategoria} />
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/professionals"
          className="rounded-lg border border-gray-300 p-2 text-base transition duration-300 hover:-translate-y-0.5 hover:bg-gray-50 lg:text-[clamp(0.8125rem,1vw,1rem)]"
        >
          Ver profissionais
        </Link>
        <Link
          href="/register/patient"
          className="rounded-lg bg-green1 p-2 text-base font-semibold text-blue2 shadow-md shadow-green-900/10 transition duration-300 hover:-translate-y-0.5 hover:bg-green3 hover:shadow-lg hover:shadow-green-900/20 lg:text-[clamp(0.8125rem,1vw,1rem)]"
        >
          Agendar
        </Link>
      </div>
    </article>
  );
}