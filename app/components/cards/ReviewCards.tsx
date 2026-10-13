import Image from "next/image"

interface ReviewCardProps {
  name: string;
  role: string;
  crp: string;
  avatarLetter: string;
  quote: string;
  highlightedText?: string;
  bgLeftColor: string;
}

export default function ReviewCard({
  name,
  role,
  crp,
  avatarLetter,
  quote,
  bgLeftColor,
}: ReviewCardProps) {

 
  return (
    <div className="w-full max-w-4xl bg-[#112233] rounded-3xl shadow-2xl overflow-hidden text-white mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-12 min-h-[360px] md:min-h-[380px]">
        <div className={`${bgLeftColor} md:col-span-5 flex flex-col items-center justify-center p-8 text-white relative`}>
          <div className="w-28 h-28 md:w-32 md:h-32 rounded-full border-2 border-white/80 flex items-center justify-center mb-4 shadow-inner">
            <span className="text-4xl md:text-5xl font-bold tracking-wider">{avatarLetter}</span>
          </div>
          <h3 className="text-xl font-bold">{name}</h3>
          <p className="text-xs md:text-sm text-white/90 mt-1">
            {role} · {crp}
          </p>
          <span className="mt-4 px-4 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-medium tracking-wide">
            Profissional
          </span>
        </div>

        <div className="md:col-span-7 p-8 md:p-12 flex flex-col justify-between bg-[#132537]">
          <div>
            <div className="text-[#E5C158] text-4xl font-serif leading-none mb-4">
              “
            </div>
            <p className="text-lg md:text-xl font-medium leading-relaxed text-[#E2E8F0]">
              {quote}
            </p>
          </div>

          <div className="flex items-center space-x-1 mt-6">
            <Image
              src="/icons/estrelas.svg"
              width={50}
              height={50}
              alt="Icones de estrela"
            />
          </div>
        </div>

      </div>
    </div>
  );
}