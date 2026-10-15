import Image from "next/image"

interface ReviewCardProps {
  name: string;
  role: string;
  crp: string;
  avatarSrc: string;
  quote: string;
  highlightedText?: string;
  bgLeftColor: string;
}

export default function ReviewCard({
  name,
  role,
  crp,
  avatarSrc,
  quote,
  bgLeftColor,
}: ReviewCardProps) {

 
  return (
    <div className="w-full max-w-4xl bg-white border-3 border-blue-800 rounded-3xl shadow-2xl overflow-hidden mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-12 min-h-90 md:min-h-95">
        <div className={`${bgLeftColor} md:col-span-5 flex flex-col items-center justify-center p-8 text-white relative`}>
          <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-full border-2 border-white/80 overflow-hidden mb-4">
            <Image
              src={avatarSrc}
              alt={`Foto de ${name}`}
              fill
              sizes="128px"
              className="object-cover"
            />
          </div>
          <h3 className="text-xl font-bold">{name}</h3>
          <span className="mt-4 px-4 py-1 bg-black/25 border border-white/60 rounded-full text-sm font-bold tracking-wide">
           {role}
          </span>
        </div>

        <div className="md:col-span-7 p-8 md:p-12 flex flex-col justify-between bg-white">
          <div>
            <div className="text-[#E5C158] text-4xl font-serif leading-none mb-4">
              “
            </div>
            <p className="text-lg md:text-xl font-medium leading-relaxed">
              {quote}
            </p>
          </div>

          <div className="flex items-center space-x-1 mt-6">
            <Image
              src="/icons/estrelas.svg"
              width={200}
              height={200}
              alt="Avaliação: 5 de 5 estrelas"
            />
          </div>
        </div>

      </div>
    </div>
  );
}