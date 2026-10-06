import Image from "next/image";


interface Props {
  titulo: string;
  avaliacao: string;
  img: string;
}

export default function ReviewCards({ titulo, avaliacao, img }: Props) {
  return (
    <div>
      <div className="flex flex-col justify-center items-center  w-full max-w-137.5 border-2 border-[#FFAE00] bg-white rounded-2xl gap-4 p-5 shadow-3xl">
        <Image src="/icons/estrelas.svg" alt="Avaliação 5 de 5 estrelas" width={306} height={50} className="my-2 w-50" />
        <div>
          <h3 className="font-bold">{titulo}</h3>
        </div>

        <div>
          <p className="text-center text-gray-600 font-medium">
            &ldquo;{avaliacao}&rdquo;
          </p>
        </div>

        <div>
          <Image src={img} alt="" width={103} height={103} className="my-10 w-18" />
        </div>
      </div>
    </div>
  );
}
