import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/app/lib/api";
import { verifySession } from "@/app/lib/dal";
import type { PlanSummary } from "@/app/lib/plans";

export const metadata: Metadata = { title: "Planos de ação | NutriMente" };

export default async function PlansPage() {
  const session = await verifySession();
  const result = await api<PlanSummary[]>("/api/plans", { token: session.token });
  const isPatient = session.role === "PATIENT";

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-fraunces text-3xl font-medium sm:text-4xl">{isPatient ? "Meus planos" : "Planos dos pacientes"}</h1>
      {!result.ok ? (
        <p role="alert" className="card border-red-300 text-red-800">{result.error.detail}</p>
      ) : result.data.length === 0 ? (
        <p className="card text-gray-700">{isPatient ? "Você ainda não recebeu um plano de ação." : "Você ainda não criou planos."}</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {result.data.map((p) => (
            <li key={p.id}>
              <Link href={`/plans/${p.id}`} className="card flex h-full flex-col gap-2 transition hover:border-blue1">
                <span className="text-lg font-bold">{p.title}</span>
                <span className="text-gray-700">{isPatient ? p.professional.name : p.patient.name}</span>
                <span>Checklist de hoje: <strong>{p.checklistDoneToday}/{p.checklistTotalToday}</strong></span>
                <span>Metas: <strong>{p.goalsCompleted}/{p.goalsTotal}</strong></span>
                {p.adherence7d != null && <span>Adesão na semana: <strong>{p.adherence7d}%</strong></span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
