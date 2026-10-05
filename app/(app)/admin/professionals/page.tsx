import type { Metadata } from "next";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { reviewProfessional } from "@/app/actions/account";
import { api } from "@/app/lib/api";
import { requireRole } from "@/app/lib/dal";
import { COUNCIL, PROFESSION_LABELS, STATUS_LABELS, type Page, type ProfessionalForReview, type VerificationStatus } from "@/app/lib/types";

export const metadata: Metadata = { title: "Verificação de profissionais | NutriMente" };

const TABS: VerificationStatus[] = ["PENDING", "APPROVED", "REJECTED"];

/**
 * Área do ADMIN: conferir o registro (CRN/CRP) e aprovar ou recusar.
 * requireRole("ADMIN") manda qualquer outro papel embora; a API também
 * recusa (403) se alguém tentar chamar a rota diretamente.
 */
export default async function AdminProfessionalsPage({ searchParams }: PageProps<"/admin/professionals">) {
  const session = await requireRole("ADMIN");
  const { status: statusParam } = await searchParams;
  const status: VerificationStatus = TABS.includes(statusParam as VerificationStatus) ? (statusParam as VerificationStatus) : "PENDING";

  const result = await api<Page<ProfessionalForReview>>(`/api/admin/professionals?status=${status}&size=50`, { token: session.token });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-fraunces text-3xl font-medium sm:text-4xl">Verificação de profissionais</h1>
        <p className="mt-2 text-gray-700">
          Confira o número no site do conselho (
          <a href="https://cadastro.cfn.org.br/" target="_blank" rel="noreferrer" className="underline">
            CFN
          </a>{" "}
          /{" "}
          <a href="https://cadastro.cfp.org.br/" target="_blank" rel="noreferrer" className="underline">
            CFP
          </a>
          ) antes de aprovar.
        </p>
      </div>

      <nav aria-label="Filtrar por situação">
        <ul className="flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <li key={tab}>
              <Link
                href={`/admin/professionals?status=${tab}`}
                aria-current={tab === status ? "page" : undefined}
                className={`chip-link ${tab === status ? "chip-link-active" : ""}`}
              >
                {STATUS_LABELS[tab]}
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
        <p className="card">Nenhum profissional nesta situação.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {result.data.items.map((p) => (
            <li key={p.id} className="card flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-lg font-bold">{p.name}</p>
                <p className="break-all text-gray-700">{p.email}</p>
                <p>
                  {PROFESSION_LABELS[p.type]} · <strong>{COUNCIL[p.type]} {p.document}</strong>
                </p>
                <p className="text-sm text-gray-600">Cadastro em {new Date(p.createdAt + "Z").toLocaleDateString("pt-BR")}</p>
              </div>
              {/* Cada botão é um formulário: funciona até sem JavaScript */}
              <div className="flex flex-wrap gap-2">
                {p.status !== "APPROVED" && (
                  <form action={reviewProfessional}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="status" value="APPROVED" />
                    <button type="submit" className="btn-primary" aria-label={`Aprovar ${p.name}`}>
                      <Check aria-hidden size={18} /> Aprovar
                    </button>
                  </form>
                )}
                {/* Recusar pede motivo (vai no e-mail para a pessoa saber o que
                    corrigir) e uma segunda confirmação. <details> abre e fecha
                    sem JavaScript e funciona com teclado e leitor de tela. */}
                {p.status !== "REJECTED" && (
                  <details className="w-full md:w-auto">
                    <summary className="btn-danger cursor-pointer list-none" aria-label={`Recusar ${p.name}`}>
                      <X aria-hidden size={18} /> Recusar
                    </summary>
                    <form action={reviewProfessional} className="mt-3 flex flex-col gap-2 md:w-96">
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="status" value="REJECTED" />
                      <label htmlFor={`reason-${p.id}`} className="font-semibold">
                        Motivo da recusa (vai no e-mail para {p.name.split(" ")[0]})
                      </label>
                      <textarea
                        id={`reason-${p.id}`}
                        name="reason"
                        required
                        maxLength={500}
                        rows={3}
                        className="form-input"
                        placeholder="Ex.: Não encontramos este CRN no site do CFN."
                      />
                      <button type="submit" className="btn-danger self-start">
                        Confirmar recusa
                      </button>
                    </form>
                  </details>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
