import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { api } from "@/app/lib/api";
import { verifySession } from "@/app/lib/dal";
import type { PlanSummary } from "@/app/lib/plans";
import { AdherenceRing, Avatar, ProgressBar } from "@/app/components/plans/PlanParts";

export const metadata: Metadata = { title: "Planos de ação | NutriMente" };

const CARD = "rounded-[1.75rem] bg-white shadow-[0_22px_50px_-30px_rgba(0,80,176,0.35)]";

export default async function PlansPage() {
  const session = await verifySession();
  const result = await api<PlanSummary[]>("/api/plans", { token: session.token });
  const isPatient = session.role === "PATIENT";

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 text-[#14304a]">
      <header>
        <p className="text-sm font-bold uppercase tracking-[0.15em] text-blue1">Acompanhamento</p>
        <h1 className="mt-2 font-fraunces text-4xl font-medium sm:text-6xl">{isPatient ? "Meus planos" : "Planos dos pacientes"}</h1>
        <p className="mt-4 max-w-xl text-lg text-slate-600">
          {isPatient
            ? "Marque o que você já fez hoje e veja como a sua semana está indo."
            : "Acompanhe a adesão de cada paciente aos planos que você criou."}
        </p>
      </header>

      {!result.ok ? (
        <p role="alert" className="card border-red-300 text-red-800">{result.error.detail}</p>
      ) : result.data.length === 0 ? (
        <p className={`${CARD} p-8 text-slate-600`}>
          {isPatient ? "Você ainda não recebeu um plano de ação." : "Você ainda não criou planos."}
        </p>
      ) : (
        <ul className="grid gap-7 md:grid-cols-2">
          {result.data.map((p) => {
            const person = isPatient ? p.professional.name : p.patient.name;
            return (
              <li key={p.id}>
                <Link
                  href={`/plans/${p.id}`}
                  className={`${CARD} group flex h-full flex-col gap-6 p-7 transition hover:-translate-y-0.5 hover:shadow-[0_26px_50px_-26px_rgba(0,80,176,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue1 focus-visible:ring-offset-2`}
                >
                  <span className="flex items-start justify-between gap-4">
                    <span className="min-w-0">
                      <h2 className="text-xl font-bold leading-snug">{p.title}</h2>
                      <span className="mt-3 flex items-center gap-2.5 text-slate-600">
                        <Avatar name={person} size="h-8 w-8" text="text-[11px]" />
                        <span className="truncate">{person}</span>
                      </span>
                    </span>
                    {p.adherence7d != null ? (
                      <AdherenceRing value={p.adherence7d} />
                    ) : (
                      <span className="shrink-0 rounded-full bg-[#eef3fb] px-4 py-2 text-sm font-semibold text-slate-700">Sem dados ainda</span>
                    )}
                  </span>

                  <span className="flex flex-col gap-4">
                    <span>
                      <span className="mb-2 flex justify-between text-sm">
                        <span className="font-semibold">Checklist de hoje</span>
                        <strong>{p.checklistDoneToday}/{p.checklistTotalToday}</strong>
                      </span>
                      <ProgressBar done={p.checklistDoneToday} total={p.checklistTotalToday} />
                    </span>
                    <span>
                      <span className="mb-2 flex justify-between text-sm">
                        <span className="font-semibold">Metas</span>
                        <strong>{p.goalsCompleted}/{p.goalsTotal}</strong>
                      </span>
                      <ProgressBar done={p.goalsCompleted} total={p.goalsTotal} color="bg-[#2f7bff]" />
                    </span>
                  </span>

                  <span className="mt-auto flex items-center justify-between border-t border-[#e6eef8] pt-5 font-bold text-blue1">
                    Abrir plano
                    <ChevronRight aria-hidden size={22} className="text-slate-500 transition group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}