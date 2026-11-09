import Image from "next/image"
import Link from "next/link"

type Profissional = {
  id: number;
  titulo: string;
  nome: string;
  nota: number;
  avaliacoes: number;
  areas: string[];
  /** Horários livres de hoje (time "14:00", startsAt ISO para já chegar escolhido) */
  horarios: { time: string; startsAt: string }[];
  preco: number | null;
  foto?: string | null;
};


export default function CardProfissional({ p }: { p: Profissional }) {
  const iniciais = p.nome.split(" ").map((parte) => parte[0]).slice(0, 2).join("");

  return (
    <article className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-lg shadow-blue1/10 sm:flex-row sm:justify-between">
      {/* esquerda: foto, nome e áreas */}
      <div className="flex justify-center gap-6">
        <Link
          href={`/professionals/${p.id}`}
          aria-label={`Ver perfil de ${p.nome}`}
          className="relative h-19 w-19 shrink-0 overflow-hidden rounded-full ring-2 ring-blue-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-900"
        >
          {p.foto ? (
            <Image src={p.foto} alt="" fill sizes="76px" className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-emerald-100 font-semibold text-blue-900">
              {iniciais}
            </div>
          )}
        </Link>

        <div>
          <p className="text-lg font-semibold text-sky-700">{p.titulo}</p>
          <h3 className="font-bold text-slate-900">
            <Link href={`/professionals/${p.id}`} className="text-lg underline-offset-4 hover:underline">{p.nome}</Link>
          </h3>
          <p className="text-md text-slate-500">
            <span className="text-yellow-400">★</span> {p.nota.toFixed(1)} ({p.avaliacoes})
          </p>

          <p className="mt-3 text-[14px] text-slate-500">Principais áreas de atuação:</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {p.areas.map((area) => (
              <span
                key={area}
                className="rounded-2xl bg-emerald-100 px-2 py-0.5 text-[14px] text-green-900"
              >
                {area}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* direita: horários, preço e botão */}
      <div className="sm:w-44 sm:shrink-0 sm:text-right">
        <p className="mb-2 text-lg font-semibold text-sky-700">{p.horarios.length > 0 ? "Hoje" : "Sem horário hoje"}</p>
        <div className="grid grid-cols-2 gap-2">
          {p.horarios.map((h) => (
            <Link
              key={h.startsAt}
              href={`/appointments?professional=${p.id}&startsAt=${encodeURIComponent(h.startsAt)}`}
              aria-label={`Agendar hoje às ${h.time} com ${p.nome}`}
              className="flex min-h-8 items-center justify-center rounded bg-sky-100 px-3 py-1 text-sm font-medium text-slate-700 transition duration-300 ease-in-out hover:bg-sky-200"
            >
              {h.time}
            </Link>
          ))}
        </div>
        <p className="mt-3 text-sm font-bold text-slate-900">
          {p.preco != null ? p.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "Valor a combinar"}
        </p>
        <p className="text-[12px] text-slate-600">por consulta</p>
        <Link
          href={`/appointments?professional=${p.id}`}
          aria-label={`Agendar consulta com ${p.nome}`}
          className="mt-2 flex min-h-11 w-full items-center justify-center rounded-full bg-green1/70 px-4 py-2 text-md font-bold text-blue2 transition duration-200 hover:bg-green3"
        >
          Agendar Consulta
        </Link>
      </div>
    </article>
  );
}