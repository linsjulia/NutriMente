import type { Metadata } from "next";
import { Trash2 } from "lucide-react";
import { deleteSpecialty } from "@/app/actions/specialties";
import { api } from "@/app/lib/api";
import { requireRole } from "@/app/lib/dal";
import { PROFESSION_LABELS, type ProfessionalType, type Specialty } from "@/app/lib/types";
import CreateSpecialtyForm from "./CreateSpecialtyForm";

export const metadata: Metadata = { title: "Especialidades | NutriMente" };

const TYPES: ProfessionalType[] = ["NUTRICIONISTA", "PSICOLOGO"];

/**
 * Área do ADMIN: lista de especialidades que os profissionais podem marcar
 * no perfil e que os pacientes usam no filtro da busca.
 */
export default async function AdminSpecialtiesPage() {
  await requireRole("ADMIN");
  const result = await api<Specialty[]>("/api/specialties");

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-fraunces text-3xl font-medium sm:text-4xl">Especialidades</h1>
        <p className="mt-2 text-gray-700">
          Os profissionais escolhem até 5 destas no perfil, e os pacientes filtram a busca por elas.
        </p>
      </div>

      <section aria-labelledby="new-title" className="card">
        <h2 id="new-title" className="mb-4 text-xl font-bold">
          Nova especialidade
        </h2>
        <CreateSpecialtyForm />
      </section>

      {!result.ok ? (
        <p role="alert" className="card border-red-300 text-red-800">
          {result.error.detail}
        </p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {TYPES.map((type) => {
            const items = result.data.filter((s) => s.type === type);
            return (
              <section key={type} aria-labelledby={`list-${type}`} className="card">
                <h2 id={`list-${type}`} className="mb-3 text-xl font-bold">
                  {PROFESSION_LABELS[type]} ({items.length})
                </h2>
                {items.length === 0 ? (
                  <p className="text-gray-700">Nenhuma especialidade cadastrada.</p>
                ) : (
                  <ul className="flex flex-col divide-y divide-gray-200">
                    {items.map((s) => (
                      <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                        <span>{s.name}</span>
                        {/* Remover tira a especialidade do perfil de quem a marcou:
                            pede confirmação antes (<details> funciona sem JavaScript) */}
                        <details>
                          <summary
                            className="inline-flex cursor-pointer list-none items-center gap-1 py-2.5 text-sm font-semibold text-red-700 underline"
                            aria-label={`Remover ${s.name}`}
                          >
                            <Trash2 aria-hidden size={16} /> Remover
                          </summary>
                          <form action={deleteSpecialty} className="mt-2 flex flex-col items-end gap-2">
                            <input type="hidden" name="id" value={s.id} />
                            <p className="max-w-xs text-right text-sm">
                              Ela sai também do perfil dos profissionais que a escolheram.
                            </p>
                            <button type="submit" className="btn-danger">
                              Confirmar remoção
                            </button>
                          </form>
                        </details>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
