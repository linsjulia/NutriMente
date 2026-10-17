"use client"
import Image from "next/image"

type Profissional = {
  id: number;
  titulo: string;
  nome: string;
  nota: number;
  avaliacoes: number;
  areas: string[];
  horarios: string[];
  preco: number;
  foto?: string; // se não vier foto, mostra as iniciais
};

const filtrosAtivos = ["Psicologia nutricional", "Ansiedade", "Comer emocional"];

export default function CardProfissional({ p }: { p: Profissional }) {
  const iniciais = p.nome.split(" ").map((parte) => parte[0]).slice(0, 2).join("");

  return (
    <article className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:justify-between">
      {/* esquerda: foto, nome e áreas */}
      <div className="flex gap-4">
        {p.foto ? (
          <Image
            src={p.foto}
            width={14}
            height={14}
            alt={p.nome}
            className="shrink-0 rounded-full object-cover ring-2 ring-blue-900"
          />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-semibold text-blue-900 ring-2 ring-blue-900">
            {iniciais}
          </div>
        )}

        <div>
          <p className="text-sm font-semibold text-sky-500">{p.titulo}</p>
          <h3 className="font-bold text-slate-900">{p.nome}</h3>
          <p className="text-xs text-slate-500">
            <span className="text-yellow-400">★</span> {p.nota.toFixed(1)} ({p.avaliacoes})
          </p>

          <p className="mt-3 text-[11px] text-slate-500">Principais áreas de atuação:</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {p.areas.map((area) => (
              <span
                key={area}
                className="rounded bg-emerald-100 px-2 py-0.5 text-[11px] text-green-900"
              >
                {area}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* direita: horários, preço e botão */}
      <div className="sm:w-44 sm:shrink-0 sm:text-right">
        <p className="mb-2 text-sm font-semibold text-sky-500">Hoje</p>
        <div className="grid grid-cols-2 gap-2">
          {p.horarios.map((h) => (
            <button
              key={h}
              type="button"
              className="rounded bg-sky-100 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-sky-200"
            >
              {h}
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm font-bold text-slate-900">R$ {p.preco}</p>
        <p className="text-[11px] text-slate-500">por consulta</p>
        <button
          type="button"
          className="mt-2 w-full rounded-full bg-linear-to-r from-cyan-500 to-teal-400 px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
        >
          Agendar Consulta
        </button>
      </div>
    </article>
  );
}