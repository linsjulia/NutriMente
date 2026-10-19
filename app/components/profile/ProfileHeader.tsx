import Image from "next/image";
import Card from "./Card";
import Stars from "./Stars";
import type { Profissional } from "./Types";

// Cartão do topo: foto, nome, registro, nota e botão de agendar.
export default function ProfileHeader({ p, onAgendar }: { p: Profissional; onAgendar: () => void }) {
  return (
    <Card className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-5">
        <Image
          src={p.foto}
          alt={`Foto de ${p.nome}`}
          width={80}
          height={80}
          className="size-20 rounded-full border-2 border-blue-500 object-cover"
        />
        <div className="flex flex-col gap-1">
          <h1 className="font-fraunces text-2xl font-medium">{p.nome}</h1>
          <p className="flex flex-wrap gap-x-4 text-sm">
            <span>{p.titulo}</span>
            <span>{p.registro}</span>
            <span>{p.cidade}</span>
          </p>
          <p className="flex items-center gap-2 text-xs text-gray-600">
            <Stars value={p.nota} />
            {p.nota.toFixed(1).replace(".", ",")} ({p.totalAvaliacoes} avaliações)
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onAgendar}
        className="rounded-full bg-green1 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-green-400"
      >
        Agendar consulta
      </button>
    </Card>
  );
}