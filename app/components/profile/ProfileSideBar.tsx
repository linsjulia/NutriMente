import SpecialityBadge from "../badge/SpecialityBadge";
import Card from "./Card";
import Stars from "./Stars";
import type { Profissional } from "./Types";

// Coluna da direita. Na aba "Sobre" mostra as avaliações;
// nas outras abas mostra um resumo + especialidades.
export default function ProfileSidebar({
  p,
  aba,
  onVerMais,
}: {
  p: Profissional;
  aba: string;
  onVerMais: () => void;
}) {
  if (aba === "sobre") {
    return (
      <Card className="flex flex-col gap-4 self-start">
        <h2 className="text-center text-sm font-bold">Avaliações de pacientes</h2>
        <div className="flex flex-col items-center">
          <span className="text-3xl font-bold text-blue1">{p.nota.toFixed(1).replace(".", ",")}</span>
          <Stars value={p.nota} className="text-base" />
          <span className="text-xs text-gray-600">{p.totalAvaliacoes} avaliações</span>
        </div>
        <ul>
          {p.avaliacoes.slice(0, 2).map((a) => (
            <li key={a.id} className="border-t border-gray-200 py-3">
              <p className="text-xs font-bold text-blue1">{a.nome}</p>
              <Stars value={a.nota} className="text-xs" />
              <p className="text-xs">“{a.comentario}”</p>
            </li>
          ))}
        </ul>
        <button type="button" onClick={onVerMais} className="text-xs font-bold text-blue1 hover:underline">
          Ver mais
        </button>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-5 self-start">
      <section>
        <h2 className="mb-2 text-sm font-bold">Sobre</h2>
        <p className="text-xs text-gray-700">{p.resumo}</p>
      </section>
      <section>
        <h2 className="mb-2 text-sm font-bold">Especialidades</h2>
        <div className="flex flex-wrap gap-2">
          {p.especialidades.slice(0, 3).map((e) => (
            <SpecialityBadge key={e}>{e}</SpecialityBadge>
          ))}
        </div>
      </section>
    </Card>
  );
}