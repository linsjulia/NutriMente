import Image from "next/image";

interface ReviewCardProps {
  name: string;
  role: string;
  crp: string;
  avatarSrc: string;
  quote: string;
  highlightedText?: string;
}

export default function ReviewCard({
  name,
  role,
  avatarSrc,
  quote,
}: ReviewCardProps) {
  return (
    /* h-full garante que o card ocupe exatamente a mesma altura total de todos os slides */
    <div className="w-full h-full bg-white rounded-3xl overflow-hidden mx-auto border border-slate-100 flex flex-col justify-between">
      <div className="grid grid-cols-1 md:grid-cols-12 h-full">
        {/* Lado esquerdo (Gradiente) */}
        <div className="bg-gradient-to-br from-green-300 to-blue-400 md:col-span-5 flex flex-col items-center justify-center p-6 md:p-8 text-white">
          <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full border-2 border-white/80 overflow-hidden mb-4 shadow-md shrink-0">
            <Image
              src={avatarSrc}
              alt={`Foto de ${name}`}
              fill
              sizes="128px"
              className="object-cover"
            />
          </div>
          <h3 className="text-lg md:text-xl font-bold text-center">{name}</h3>
          <span className="mt-2 md:mt-3 px-4 py-1 bg-black/20 border border-white/40 rounded-full text-xs md:text-sm font-semibold tracking-wide">
            {role}
          </span>
        </div>

        {/* Lado direito (Depoimento) */}
        <div className="md:col-span-7 p-6 md:p-10 flex flex-col justify-between bg-white h-full">
          <div>
            <span className="text-[#E5C158] text-4xl md:text-5xl font-serif leading-none block mb-1 md:mb-2">
              “
            </span>
            <p className="text-base md:text-lg font-medium leading-relaxed text-slate-700">
              {quote}
            </p>
            <span className="text-[#E5C158] text-4xl md:text-5xl font-serif leading-none block mt-1 md:mt-2 text-right">
              ”
            </span>
          </div>

          <div className="flex items-center space-x-1 mt-4 md:mt-6 pt-2">
            <Image
              src="/icons/estrelas.svg"
              width={130}
              height={26}
              alt="Avaliação: 5 de 5 estrelas"
            />
          </div>
        </div>
      </div>
    </div>
  );
}