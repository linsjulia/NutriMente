import Image from "next/image";
import Card from "./Card";
import Stars from "./Stars";
import type { ProfessionalProfile } from "@/app/lib/agenda";
import { formatCouncilNumber, PROFESSION_LABELS } from "@/app/lib/types";

// Cartão do topo: foto, nome, registro, nota e botão de agendar.
export default function ProfileHeader({ p, onAgendar }: { p: ProfessionalProfile; onAgendar: () => void }) {
  return (
    <Card className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-5">
        <Image
          src={p.photoUrl ?? "/doctor/placeholder.png"}
          alt={`Foto de ${p.name}`}
          width={80}
          height={80}
          className="size-20 rounded-full border-2 border-blue-500 object-cover"
        />
        <div className="flex flex-col gap-1">
          <h1 className="font-fraunces text-2xl font-medium">{p.name}</h1>
          <p className="flex flex-wrap gap-x-4 text-sm">
            <span>{PROFESSION_LABELS[p.type]}</span>
            <span>{formatCouncilNumber(p.type, p.document)}</span>
            <span>{[p.officeCity, p.officeState].filter(Boolean).join(" - ") || "Localização não informada"}</span>
          </p>
          <p className="flex items-center gap-2 text-xs text-gray-600">
            {p.ratingCount > 0 ? (
              <>
                <Stars value={p.ratingAverage} />
                {p.ratingAverage.toFixed(1).replace(".", ",")} ({p.ratingCount}{" "}
                {p.ratingCount === 1 ? "avaliação" : "avaliações"})
              </>
            ) : (
              "Ainda sem avaliações"
            )}
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