import { Clock, DollarSign, HeartPulse } from "lucide-react";
import Card from "./Card";
import type { ProfessionalProfile } from "@/app/lib/agenda";
import { AUDIENCE_LABELS, formatCouncilNumber, PROFESSION_LABELS } from "@/app/lib/types";
import { formatBRL } from "@/app/lib/money";
import CategoryBadge from "../badge/SpecialityBadge";

function Info({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div>
      <p className="text-xs font-semibold">{titulo}</p>
      <p className="text-xs text-gray-600">{valor}</p>
    </div>
  );
}

function Linha({ icone, titulo, valor }: { icone: React.ReactNode; titulo: string; valor: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 text-blue1">{icone}</span>
      <Info titulo={titulo} valor={valor} />
    </li>
  );
}

// Aba "Sobre"
export default function AboutTab({ p }: { p: ProfessionalProfile }) {
  const modalities = [
    ...(p.offersOnline ? ["Online"] : []),
    ...(p.offersInPerson ? ["Presencial"] : []),
  ].join(" e ") || "Não informado";
  const price = p.consultationPrice == null ? "A combinar" : `R$ ${formatBRL(p.consultationPrice)}`;
  const location = [p.officeCity, p.officeState].filter(Boolean).join(" - ") || "Não informado";

  return (
    <Card className="flex flex-col gap-6">
      <section>
        <h2 className="text-xl font-bold">Sobre</h2>
        <p className="mt-1 text-sm text-gray-700">Conheça mais sobre a formação, experiência e a forma de atendimento.</p>
      </section>

      <section>
        <h3 className="font-bold">Apresentação</h3>
        <p className="mt-1 text-sm text-gray-700">
          {p.bio ?? "Este profissional ainda não escreveu uma apresentação."}
        </p>
      </section>

      <hr className="border-gray-200" />

      <section>
        <h3 className="mb-4 font-bold">Informações profissionais</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Info titulo="Profissão" valor={PROFESSION_LABELS[p.type]} />
          <Info titulo="Registro profissional" valor={formatCouncilNumber(p.type, p.document)} />
          <Info titulo="Localização" valor={location} />
          <Info titulo="Duração da consulta" valor={`${p.consultationMinutes} minutos`} />
        </div>
      </section>

      <hr className="border-gray-200" />

      <section>
        <h3 className="mb-3 font-bold">Especialidades</h3>
        <div className="flex flex-wrap gap-2">
          {p.specialties.map((specialty) => (
            <CategoryBadge key={specialty.id}>{specialty.name}</CategoryBadge>
          ))}
          {p.specialties.length === 0 && <p className="text-sm text-gray-600">Nenhuma especialidade informada.</p>}
        </div>
      </section>

      <hr className="border-gray-200" />

      <section>
        <h3 className="mb-3 font-bold">Atendimento</h3>
        <ul className="flex flex-col gap-3">
          <Linha icone={<DollarSign size={18} aria-hidden />} titulo="Consulta particular" valor={price} />
          <Linha icone={<HeartPulse size={18} aria-hidden />} titulo="Modalidades" valor={modalities} />
          <Linha
            icone={<Clock size={18} aria-hidden />}
            titulo="Público atendido"
            valor={p.audiences.length > 0 ? p.audiences.map((audience) => AUDIENCE_LABELS[audience]).join(", ") : "Não informado"}
          />
        </ul>
      </section>
    </Card>
  );
}