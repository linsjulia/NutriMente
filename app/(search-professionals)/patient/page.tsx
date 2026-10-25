import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/app/lib/api";
import { PROFESSION_LABELS, type Page, type PublicProfessional, type Specialty } from "@/app/lib/types";
import type { SlotDay } from "@/app/lib/agenda";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faArrowRight, faClose } from "@fortawesome/free-solid-svg-icons";
import SearchProfessionalCard from "../../components/cards/SearchProfessionalCard";
import SearchProfessionalFilter from "../../components/filter/SearchProfessionalFilter";

export const metadata: Metadata = { title: "Buscar profissionais | NutriMente" };

const PAGE_SIZE = 10;
const SORTS = [
  { value: "RELEVANCE", label: "Mais relevantes" },
  { value: "PRICE_ASC", label: "Menor preço" },
  { value: "PRICE_DESC", label: "Maior preço" },
];

/** Compara sem acento e sem maiúsculas ("psico" acha "Psicólogo(a)") */
const normalize = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/* ---------- página ---------- */
export default async function BuscaProfissionais({ searchParams }: PageProps<"/patient">) {
  const params = await searchParams;
  const one = (k: string) => (typeof params[k] === "string" ? (params[k] as string) : undefined);
  const q = one("q")?.trim() ?? "";
  const type = one("type") === "NUTRICIONISTA" || one("type") === "PSICOLOGO" ? (one("type") as "NUTRICIONISTA" | "PSICOLOGO") : undefined;
  // A API espera "specialty" (antes ia "speciality" e o filtro era ignorado sem erro)
  const specialtyId = Number(one("specialty") ?? one("speciality")) || undefined;
  const sort = SORTS.some((s) => s.value === one("sort")) ? one("sort")! : "RELEVANCE";
  const page = Math.max(Number(one("page")) || 0, 0);

  // Filtros atuais: reaproveitados nos links (ordenar, paginar, remover filtro)
  const filters: Record<string, string> = {};
  if (q) filters.q = q;
  if (type) filters.type = type;
  if (specialtyId) filters.specialty = String(specialtyId);
  if (sort !== "RELEVANCE") filters.sort = sort;
  const link = (change: Record<string, string | undefined>) => {
    const next: Record<string, string> = { ...filters };
    for (const [k, v] of Object.entries(change)) {
      if (v === undefined) delete next[k];
      else next[k] = v;
    }
    const qs = new URLSearchParams(next).toString();
    return qs ? `/patient?${qs}` : "/patient";
  };

  const query = new URLSearchParams({ sort });
  if (type) query.set("type", type);
  if (specialtyId) query.set("specialty", String(specialtyId));
  // A API não busca por texto: com "q", trazemos até 50 e filtramos aqui
  // (nome, área de atuação ou profissão). Basta para o tamanho do projeto.
  query.set("page", q ? "0" : String(page));
  query.set("size", q ? "50" : String(PAGE_SIZE));

  const [result, specialties] = await Promise.all([
    api<Page<PublicProfessional>>(`/api/professionals?${query}`),
    specialtyId ? api<Specialty[]>("/api/specialties") : Promise.resolve(null),
  ]);
  const specialtyName = specialties?.ok ? specialties.data.find((s) => s.id === specialtyId)?.name : undefined;

  let items = result.ok ? result.data.items : [];
  let totalItems = result.ok ? result.data.totalItems : 0;
  let totalPages = result.ok ? result.data.totalPages : 0;
  if (q) {
    const term = normalize(q);
    const matched = items.filter((p) =>
      [p.name, PROFESSION_LABELS[p.type], ...p.specialties.map((s) => s.name)].some((t) => normalize(t).includes(term)),
    );
    totalItems = matched.length;
    totalPages = Math.ceil(matched.length / PAGE_SIZE);
    items = matched.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  }

  const hoje = new Date().toISOString().slice(0, 10);
  const profissionais = await Promise.all(
    items.map(async (p) => {
      const slots = await api<SlotDay[]>(`/api/professionals/${p.id}/slots?from=${hoje}&days=1`);
      const horarios = slots.ok ? (slots.data[0]?.slots.map((s) => ({ time: s.time, startsAt: s.startsAt })) ?? []) : [];
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

  // Só os filtros que estão REALMENTE aplicados (antes eram três de exemplo, fixos)
  const active = [
    q && { label: `“${q}”`, remove: link({ q: undefined, page: undefined }) },
    type && { label: PROFESSION_LABELS[type], remove: link({ type: undefined, page: undefined }) },
    specialtyId && { label: specialtyName ?? "Especialidade", remove: link({ specialty: undefined, page: undefined }) },
  ].filter(Boolean) as { label: string; remove: string }[];

  return (
    <div className="min-h-screen bg-sky-50 text-slate-800">
      <main id="conteudo" className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:flex-row md:px-8">
        <SearchProfessionalFilter />
        <section aria-labelledby="resultado" className="min-w-0 flex-1">
          <h1 id="resultado" className="mb-1 font-fraunces text-2xl font-medium text-blue2">
            {q ? `Resultados para “${q}”` : "Encontre seu profissional"}
          </h1>
          {result.ok && (
            <p className="mb-4 text-sm text-slate-700" aria-live="polite">
              {totalItems === 1 ? "1 profissional encontrado" : `${totalItems} profissionais encontrados`}
            </p>
          )}

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {active.map((f) => (
                <span
                  key={f.label}
                  className="flex items-center gap-2 rounded-full border border-green-700 bg-emerald-50 px-3 py-1 text-xs text-slate-800"
                >
                  {f.label}
                  <Link href={f.remove} aria-label={`Remover filtro ${f.label}`} className="flex h-8 w-8 shrink-0 items-center justify-center">
                    <FontAwesomeIcon icon={faClose} className="h-3 w-3" />
                  </Link>
                </span>
              ))}
              {active.length > 0 && (
                <Link href="/patient" className="py-2 text-xs font-semibold text-green-800 underline-offset-2 hover:underline">
                  Limpar tudo
                </Link>
              )}
            </div>

            <nav aria-label="Ordenar" className="flex flex-wrap items-center gap-1 text-xs text-slate-700">
              <span>Ordenar:</span>
              {SORTS.map((s) => (
                <Link
                  key={s.value}
                  href={link({ sort: s.value === "RELEVANCE" ? undefined : s.value, page: undefined })}
                  aria-current={s.value === sort ? "true" : undefined}
                  className={`rounded-full px-3 py-1.5 ${s.value === sort ? "bg-blue1 font-semibold text-white" : "hover:bg-white"}`}
                >
                  {s.label}
                </Link>
              ))}
            </nav>
          </div>

          {!result.ok ? (
            <p role="alert" className="rounded-xl border border-red-300 bg-white p-4 text-red-800">
              {result.error.detail}
            </p>
          ) : profissionais.length === 0 ? (
            <div className="rounded-xl bg-white p-6">
              <p>Nenhum profissional encontrado{active.length ? " com esses filtros" : ""}.</p>
              {active.length > 0 && (
                <Link href="/patient" className="mt-2 inline-block font-semibold text-blue1 underline-offset-4 hover:underline">
                  Ver todos os profissionais
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {profissionais.map((p) => (
                <SearchProfessionalCard key={p.id} p={p} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <nav aria-label="Páginas" className="mt-6 flex items-center justify-between text-sm">
              {page > 0 ? (
                <Link href={link({ page: String(page - 1) })} className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 hover:bg-slate-50">
                  <FontAwesomeIcon icon={faArrowLeft} /> Voltar
                </Link>
              ) : (
                <span />
              )}
              <span className="text-xs text-slate-700">
                Página {page + 1} de {totalPages}
              </span>
              {page + 1 < totalPages ? (
                <Link href={link({ page: String(page + 1) })} className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 hover:bg-slate-50">
                  Próximo <FontAwesomeIcon icon={faArrowRight} />
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </section>
      </main>
    </div>
  );
}
