import { Clock, DollarSign, HeartPulse } from "lucide-react";
import Card from "./Card";
import Tag from "./Tag";
import type { Profissional } from "./Types";
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
export default function AboutTab({ p }: { p: Profissional }) {
  return (
    <Card className="flex flex-col gap-6">
      <section>
        <h2 className="text-xl font-bold">Sobre</h2>
        <p className="mt-1 text-sm text-gray-700">Conheça mais sobre a formação, experiência e a forma de atendimento.</p>
      </section>

      <section>
        <h3 className="font-bold">Apresentação</h3>
        <p className="mt-1 text-sm text-gray-700">{p.apresentacao}</p>
      </section>

      <hr className="border-gray-200" />

      <section>
        <h3 className="mb-4 font-bold">Formação e experiência</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Info titulo="Graduação" valor={p.graduacao} />
          <Info titulo="Pós-graduação" valor={p.posGraduacao} />
          <Info titulo="Experiência" valor={p.experiencia} />
          <Info titulo="Registro profissional" valor={p.registro} />
        </div>
      </section>

      <hr className="border-gray-200" />

      <section>
        <h3 className="mb-3 font-bold">Especialidades</h3>
        <div className="flex flex-wrap gap-2">
          {p.especialidades.map((e) => (
            <CategoryBadge key={e}>{e}</CategoryBadge>
          ))}
        </div>
      </section>

      <hr className="border-gray-200" />

      <section>
        <h3 className="mb-3 font-bold">Atendimento</h3>
        <ul className="flex flex-col gap-3">
          <Linha icone={<DollarSign size={18} aria-hidden />} titulo="Consulta particular" valor={`R$ ${p.preco}`} />
          <Linha icone={<HeartPulse size={18} aria-hidden />} titulo="Modalidades" valor={p.modalidade} />
          <Linha icone={<Clock size={18} aria-hidden />} titulo="Horário de atendimento" valor={p.horarioAtendimento} />
        </ul>
      </section>
    </Card>
  );
}