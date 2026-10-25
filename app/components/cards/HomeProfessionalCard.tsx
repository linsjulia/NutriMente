import Image from "next/image";
import Link from "next/link";
import SpecialityBadge from "../badge/SpecialityBadge";

interface Props {
  titulo: string;
  tipoProfissional: string;
  documento: string;
  descricao: string;
  categoria: string;
  segundaCategoria: string;
  img: string;
}

export default function HomeProfessionalCard({
  titulo,
  tipoProfissional,
  documento,
  descricao,
  categoria,
  segundaCategoria,
  img,
}: Props) {
  return (
    <article className="flex w-full max-w-105 flex-col gap-4 rounded-2xl border border-green1 bg-white p-6 shadow-[0_10px_30px_rgba(16,47,66,0.08)] transition-[translate,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0, 221, 92,0.16)] sm:p-8 lg:max-w-none lg:min-w-0 lg:flex-1 lg:gap-[clamp(0.75rem,1.1vw,1rem)] lg:p-[clamp(1.25rem,2vw,2rem)]">
      <div className="my-4 flex items-center justify-center gap-6 lg:my-[clamp(0.5rem,1vw,1rem)] lg:gap-[clamp(1rem,1.5vw,1.5rem)]">
        <Image
          src={img}
          alt={`Foto de ${titulo}`}
          width={100}
          height={100}
          className="aspect-square w-6 rounded-full bg-green-700 object-cover lg:w-[clamp(4rem,6vw,5rem)]"
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
        <SpecialityBadge speciality={categoria}/>
        <SpecialityBadge speciality={segundaCategoria} />
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/register/patient"
          className="rounded-xl border border-blue1 p-3 text-base font-semibold text-blue1 shadow-md shadow-green-900/10 transition duration-300 hover:bg-blue1/10 hover:shadow-lg hover:shadow-blue1-900/20 lg:text-[clamp(0.8125rem,1vw,1rem)]"
        >
          Ver profissional
        </Link>
      </div>
    </article>
  );
}