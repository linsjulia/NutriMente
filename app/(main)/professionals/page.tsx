import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/app/lib/api";
import { COUNCIL, PROFESSION_LABELS, type Page, type ProfessionalType, type PublicProfessional } from "@/app/lib/types";

export const metadata: Metadata = { title: "Profissionais | NutriMente" };

const FILTERS: { value?: ProfessionalType; label: string }[] = [
  { label: "Todos" },
  { value: "NUTRICIONISTA", label: "Nutricionistas" },
  { value: "PSICOLOGO", label: "Psicólogos" },
];

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

// Lista pública: só profissionais APROVADOS pelo admin (a API já filtra).
export default async function ProfessionalsPage({ searchParams }: PageProps<"/professionals">) {
  const { type: typeParam, page: pageParam } = await searchParams;
  const type = typeParam === "NUTRICIONISTA" || typeParam === "PSICOLOGO" ? typeParam : undefined;
  const page = Math.max(Number(pageParam) || 0, 0);

  const query = new URLSearchParams({ page: String(page), size: "12" });
  if (type) query.set("type", type);
  const result = await api<Page<PublicProfessional>>(`/api/professionals?${query}`);

  const pageLink = (p: number) => `/professionals?${new URLSearchParams({ ...(type ? { type } : {}), page: String(p) })}`;

  return (
    <main id="conteudo" className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
      <h1 className="font-fraunces text-3xl font-medium sm:text-4xl">Profissionais</h1>
      <p className="mt-2 text-gray-700">Todos com registro no conselho verificado pela nossa equipe.</p>

      <nav aria-label="Filtrar por profissão" className="my-6">
        <ul className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <li key={f.label}>
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

      {!result.ok ? (
        <p role="alert" className="card border-red-300 text-red-800">
          {result.error.detail}
        </p>
      ) : result.data.items.length === 0 ? (
        <p className="card">Ainda não há profissionais aprovados nesta categoria.</p>
      ) : (
        <>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {result.data.items.map((p) => (
              <li key={p.id} className="card flex flex-col gap-3">
                <h2 className="text-lg font-bold">{p.name}</h2>
                <p className="text-gray-700">
                  {PROFESSION_LABELS[p.type]} · {COUNCIL[p.type]} {p.document}
                </p>
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
