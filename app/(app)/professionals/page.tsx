// API
import { api } from "@/app/lib/api";
import { PROFESSION_LABELS, type Page, type PublicProfessional, type Specialty } from "@/app/lib/types";
import { SlotDay } from "@/app/lib/agenda";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faArrowRight, faChevronDown, faClose } from "@fortawesome/free-solid-svg-icons";
import SearchProfessionalCard from "../../components/cards/SearchProfessionalCard";
import SearchProfessionalFilter from "../../components/filter/SearchProfessionalFilter";

const filtrosAtivos = ["Psicologia nutricional", "Ansiedade", "Comer emocional"];

/* ---------- página ---------- */
export default async function BuscaProfissionais({ searchParams }: PageProps<"/patient">) {
  const { type: typeParam, specialty: specialtyParam, minPrice, maxPrice, online, sort, page: pageParam } = await searchParams;

  const type = typeParam === "NUTRICIONISTA" || typeParam === "PSICOLOGO" ? typeParam : undefined;
  const specialty = Number(specialtyParam) > 0 ? Number(specialtyParam) : undefined;
  const page = Math.max(Number(pageParam) || 0, 0);

  // Filtros atuais, reaproveitados nos links de paginação e query da API
  const filters: Record<string, string> = {};
  if (type) filters.type = type;
  if (specialty) filters.specialty = String(specialty);
  if (typeof minPrice === "string") filters.minPrice = minPrice;
  if (typeof maxPrice === "string") filters.maxPrice = maxPrice;
  if (online === "true") filters.online = "true";
  if (typeof sort === "string") filters.sort = sort;

  const query = new URLSearchParams({ ...filters, page: String(page), size: "10" });

  // Consultas à API em paralelo (Promise.all) para profissionais e especialidades
  const [result, specialties] = await Promise.all([
    api<Page<PublicProfessional>>(`/api/professionals?${query}`),
    api<Specialty[]>(type ? `/api/specialties?type=${type}` : "/api/specialties"),
  ]);

  const items = result.ok ? result.data.items : [];
  const specialtyOptions = specialties.ok ? specialties.data : [];
  const specialtyName = specialtyOptions.find((s) => s.id === specialty)?.name;

  const hoje = new Date().toISOString().slice(0, 10);
  
  // Busca os horários e formata os dados para o card
  const profissionais = await Promise.all(
    items.map(async (p) => {
      const slots = await api<SlotDay[]>(`/api/professionals/${p.id}/slots?from=${hoje}&days=1`);
      const horarios = slots.ok ? (slots.data[0]?.slots.map((s) => s.time) ?? []) : [];
      return {
        id: p.id,
        titulo: PROFESSION_LABELS[p.type],
        nome: p.name,
        nota: p.ratingAverage,
        avaliacoes: p.ratingCount,
        areas: p.specialties.map((s) => s.name),
        horarios: horarios.slice(0, 4),
        preco: p.consultationPrice,
      };
    }),
  );

  const pageLink = (p: number) => `/patient?${new URLSearchParams({ ...filters, page: String(p) })}`;

  return (
    <div className="bg-sky-50">
      <div className="min-h-screen text-slate-800"> 
        <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:flex-row md:px-8">
          <SearchProfessionalFilter />
          <section className="min-w-0 flex-1">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {filtrosAtivos.map((f) => (
                  <span
                    key={f}
                    className="flex items-center gap-2 rounded-full border border-green-600 bg-emerald-50 px-3 py-1 text-xs text-slate-700"
                  >
                    {f}
                    <button type="button" aria-label={`Remover ${f}`}>
                      <FontAwesomeIcon icon={faClose} className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <button type="button" className="text-xs font-semibold text-green-600">
                  Limpar tudo
                </button>
              </div>

              <button type="button" className="flex items-center gap-1 text-xs text-slate-600">
                Ordenar: Mais relevantes
                <FontAwesomeIcon icon={faChevronDown} />
              </button>
            </div>

            {!result.ok ? (
              <p role="alert" className="card border-red-300 text-red-800 p-4 bg-white rounded-md">
                {result.error.detail}
              </p>
            ) : profissionais.length === 0 ? (
              <p className="card p-4 bg-white rounded-md">
                {specialtyName
                  ? `Ainda não há profissionais aprovados com a especialidade "${specialtyName}".`
                  : "Ainda não há profissionais aprovados nesta categoria."}
              </p>
            ) : (
              <>
                {/* lista */}
                <div className="space-y-4">
                  {profissionais.map((p) => (
                    <SearchProfessionalCard key={p.id} p={p} />
                  ))}
                </div>

                {/* paginação */}
                {result.data.totalPages > 1 && (
                  <nav className="mt-6 flex items-center justify-between text-sm">
                    {page > 0 ? (
                      <Link
                        href={pageLink(page - 1)}
                        className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 hover:bg-slate-50"
                      >
                        <FontAwesomeIcon icon={faArrowLeft} /> Voltar
                      </Link>
                    ) : (
                      <span />
                    )}
                    
                    <span className="text-xs text-slate-500">
                      Página {page + 1} de {result.data.totalPages}
                    </span>

                    {page + 1 < result.data.totalPages ? (
                      <Link
                        href={pageLink(page + 1)}
                        className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 hover:bg-slate-50"
                      >
                        Próximo <FontAwesomeIcon icon={faArrowRight} />
                      </Link>
                    ) : (
                      <span />
                    )}
                  </nav>
                )}
              </>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}