import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { api } from "@/app/lib/api";
import { requireRole } from "@/app/lib/dal";
import type { Page } from "@/app/lib/types";
import type { PlanSummary } from "@/app/lib/plans";
import { ACTIVITY_TEXT, GOAL_TEXT, type Intake, type Meal, type MyPatient } from "@/app/lib/patients";
import MealList from "@/app/components/MealList";

export const metadata: Metadata = { title: "Paciente | NutriMente" };

/**
 * Ficha do paciente para o profissional: questionário inicial, planos e
 * diário alimentar. A API só libera para quem atende o paciente (as leituras
 * ficam na auditoria).
 */
export default async function PatientPage({ params }: PageProps<"/patients/[id]">) {
  const session = await requireRole("PROFESSIONAL");
  const { id } = await params;
  const patientId = Number(id);
  const [patients, intake, meals, plans] = await Promise.all([
    api<MyPatient[]>("/api/me/patients", { token: session.token }),
    api<Intake>(`/api/patients/${patientId}/intake`, { token: session.token }),
    api<Page<Meal>>(`/api/patients/${patientId}/meals?size=30`, { token: session.token }),
    api<PlanSummary[]>("/api/plans", { token: session.token }),
  ]);
  const patient = patients.ok ? patients.data.find((p) => p.id === patientId) : undefined;
  if (!patient) notFound();
  const myPlans = plans.ok ? plans.data.filter((p) => p.patient.id === patientId) : [];

  return (
    <div className="flex flex-col gap-6">
      <Link href="/patients" className="inline-block self-start py-2.5 font-semibold text-blue1 underline-offset-4 hover:underline">
        ← Meus pacientes
      </Link>
      <h1 className="font-fraunces text-3xl font-medium sm:text-4xl">{patient.name}</h1>

      <section aria-labelledby="questionario" className="card flex flex-col gap-3">
        <h2 id="questionario" className="text-xl font-bold">Questionário inicial</h2>
        {!intake.ok ? (
          <p className="text-gray-700">{intake.error.code === "INTAKE_NOT_ANSWERED" ? "O paciente ainda não respondeu." : intake.error.detail}</p>
        ) : (
          <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-[auto_1fr]">
            <dt className="font-semibold">Objetivos</dt>
            <dd>{intake.data.goals.map((g) => GOAL_TEXT[g]).join(" · ")}</dd>
            <dt className="font-semibold">Hábitos</dt>
            <dd>
              {intake.data.mealsPerDay} refeições por dia · {String(intake.data.waterLitersPerDay).replace(".", ",")} L de água
            </dd>
            <dt className="font-semibold">Atividade física</dt>
            <dd>{ACTIVITY_TEXT[intake.data.activityLevel]}</dd>
            <dt className="font-semibold">Sono / estresse</dt>
            <dd>Sono {intake.data.sleepQuality}/5 · estresse {intake.data.stressLevel}/5</dd>
            {intake.data.dietaryRestrictions && (<><dt className="font-semibold">Restrições</dt><dd>{intake.data.dietaryRestrictions}</dd></>)}
            {intake.data.healthConditions && (<><dt className="font-semibold">Saúde</dt><dd>{intake.data.healthConditions}</dd></>)}
            {intake.data.expectations && (<><dt className="font-semibold">Expectativas</dt><dd>{intake.data.expectations}</dd></>)}
          </dl>
        )}
      </section>

      <section aria-labelledby="planos" className="card flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="planos" className="text-xl font-bold">Planos de ação</h2>
          <Link href={`/plans/new?patientId=${patientId}`} className="btn-primary">Criar plano</Link>
        </div>
        {myPlans.length === 0 ? (
          <p className="text-gray-700">Nenhum plano com este paciente ainda.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {myPlans.map((p) => (
              <li key={p.id}>
                <Link href={`/plans/${p.id}`} className="font-semibold text-blue1 underline-offset-4 hover:underline">{p.title}</Link>
                {" · "}checklist de hoje {p.checklistDoneToday}/{p.checklistTotalToday}
                {p.adherence7d != null && ` · adesão na semana ${p.adherence7d}%`}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="diario" className="flex flex-col gap-3">
        <h2 id="diario" className="text-xl font-bold">Diário alimentar</h2>
        {!meals.ok ? (
          <p role="alert" className="card border-red-300 text-red-800">{meals.error.detail}</p>
        ) : meals.data.items.length === 0 ? (
          <p className="card text-gray-700">O paciente ainda não registrou refeições.</p>
        ) : (
          <MealList meals={meals.data.items} headingLevel={3} />
        )}
      </section>
    </div>
  );
}
