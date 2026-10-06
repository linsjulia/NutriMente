import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/app/lib/api";
import {
  COUNCIL,
  PROFESSION_LABELS,
  type Page,
  type ProfessionalType,
  type PublicProfessional,
  type Specialty,
} from "@/app/lib/types";

export const metadata: Metadata = { title: "Profissionais | NutriMente" };

const FILTERS: { value?: ProfessionalType; label: string }[] = [
  { label: "Todos" },
  { value: "NUTRICIONISTA", label: "Nutricionistas" },
  { value: "PSICOLOGO", label: "Psicólogos" },
];

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

// Lista pública: só profissionais APROVADOS pelo admin (a API já filtra).
export default async function ProfessionalsPage({ searchParams }: PageProps<"/professionals">) {
  const { type: typeParam, specialty: specialtyParam, page: pageParam } = await searchParams;
  const type = typeParam === "NUTRICIONISTA" || typeParam === "PSICOLOGO" ? typeParam : undefined;
  const specialty = Number(specialtyParam) > 0 ? Number(specialtyParam) : undefined;
  const page = Math.max(Number(pageParam) || 0, 0);

  // Filtros atuais, reaproveitados nos links de paginação
  const filters: Record<string, string> = {};
  if (type) filters.type = type;
  if (specialty) filters.specialty = String(specialty);

  const query = new URLSearchParams({ ...filters, page: String(page), size: "12" });
  // As duas consultas à API saem ao mesmo tempo (Promise.all), não uma depois da outra
  const [result, specialties] = await Promise.all([
    api<Page<PublicProfessional>>(`/api/professionals?${query}`),
    api<Specialty[]>(type ? `/api/specialties?type=${type}` : "/api/specialties"),
  ]);
  const specialtyOptions = specialties.ok ? specialties.data : [];
  const specialtyName = specialtyOptions.find((s) => s.id === specialty)?.name;

  const pageLink = (p: number) => `/professionals?${new URLSearchParams({ ...filters, page: String(p) })}`;

  return (
    <main id="conteudo" className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
      <h1 className="font-fraunces text-3xl font-medium sm:text-4xl">Profissionais</h1>
      <p className="mt-2 text-gray-700">Todos com registro no conselho verificado pela nossa equipe.</p>

      <nav aria-label="Filtrar por profissão" className="mt-6">
        <ul className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <li key={f.label}>
              {/* Trocar de profissão limpa a especialidade (cada uma é de uma profissão) */}
              <Link
                href={f.value ? `/professionals?type=${f.value}` : "/professionals"}
                aria-current={f.value === type ? "page" : undefined}
                className={`chip-link ${f.value === type ? "chip-link-active" : ""}`}
              >
                {f.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Formulário GET: muda o endereço (?specialty=3), então o filtro funciona
          sem JavaScript, pode ser compartilhado e o "voltar" do navegador funciona */}
      {specialtyOptions.length > 0 && (
        <form method="get" action="/professionals" className="mt-4 mb-6 flex flex-wrap items-end gap-3">
          {type && <input type="hidden" name="type" value={type} />}
          <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor="specialty" className="font-semibold">
              Especialidade
            </label>
            <select id="specialty" name="specialty" defaultValue={specialty ?? ""} className="form-input max-w-full sm:w-80">
              <option value="">Todas</option>
              {type
                ? specialtyOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))
                : (["NUTRICIONISTA", "PSICOLOGO"] as const).map((t) => (
                    <optgroup key={t} label={PROFESSION_LABELS[t]}>
                      {specialtyOptions
                        .filter((s) => s.type === t)
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                    </optgroup>
                  ))}
            </select>
          </div>
          <button type="submit" className="btn-secondary">
            Filtrar
          </button>
        </form>
      )}

      {!result.ok ? (
        <p role="alert" className="card border-red-300 text-red-800">
          {result.error.detail}
        </p>
      ) : result.data.items.length === 0 ? (
        <p className="card">
          {specialtyName
            ? `Ainda não há profissionais aprovados com a especialidade "${specialtyName}".`
            : "Ainda não há profissionais aprovados nesta categoria."}
        </p>
      ) : (
        <>
          <p className="mb-4 text-gray-700">
            {result.data.totalItems === 1 ? "1 profissional encontrado" : `${result.data.totalItems} profissionais encontrados`}
            {specialtyName ? ` em "${specialtyName}"` : ""}.
          </p>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {result.data.items.map((p) => (
              <li key={p.id} className="card flex flex-col gap-3">
                <h2 className="text-lg font-bold">{p.name}</h2>
                <p className="text-gray-700">
                  {PROFESSION_LABELS[p.type]} · {COUNCIL[p.type]} {p.document}
                </p>
                {p.specialties.length > 0 && (
                  <ul aria-label="Especialidades" className="flex flex-wrap gap-1.5">
                    {p.specialties.map((s) => (
                      <li key={s.id} className="specialty-tag">
                        {s.name}
                      </li>
                    ))}
                  </ul>
                )}
                <p className="flex-1">{p.bio ?? "Este profissional ainda não escreveu uma apresentação."}</p>
                <p className="font-semibold">{p.consultationPrice != null ? `${brl.format(p.consultationPrice)} por consulta` : "Valor a combinar"}</p>
              </li>
            ))}
          </ul>
          {result.data.totalPages > 1 && (
            <nav aria-label="Paginação" className="mt-8 flex items-center justify-center gap-4">
              {page > 0 && <Link href={pageLink(page - 1)} className="btn-secondary">Anterior</Link>}
              <span>
                Página {page + 1} de {result.data.totalPages}
              </span>
              {page + 1 < result.data.totalPages && <Link href={pageLink(page + 1)} className="btn-secondary">Próxima</Link>}
            </nav>
          )}
        </>
      )}
    </main>
  );
}
