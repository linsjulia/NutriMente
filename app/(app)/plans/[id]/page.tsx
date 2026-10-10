import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CircleCheck, Circle } from "lucide-react";
import { api } from "@/app/lib/api";
import { verifySession } from "@/app/lib/dal";
import { toggleChecklist, toggleGoal } from "@/app/actions/followup";
import { FREQUENCY_TEXT, type PlanDetail } from "@/app/lib/plans";
import { MOOD_TEXT } from "@/app/lib/agenda";
import ProgressForm from "./ProgressForm";

export const metadata: Metadata = { title: "Plano de ação | NutriMente" };

const day = (iso: string) => iso.split("-").reverse().slice(0, 2).join("/");

/**
 * Plano de ação. O paciente marca o checklist de hoje (cada item é um
 * botão de formulário: funciona sem JavaScript) e registra o progresso;
 * os quadradinhos mostram os últimos 7 dias.
 */
export default async function PlanPage({ params }: PageProps<"/plans/[id]">) {
  const session = await verifySession();
  const { id } = await params;
  const result = await api<PlanDetail>(`/api/plans/${Number(id)}`, { token: session.token });
  if (!result.ok) {
    if (result.error.status === 404) notFound();
    return <p role="alert" className="card border-red-300 text-red-800">{result.error.detail}</p>;
  }
  const plan = result.data;
  const s = plan.summary;
  const isPatient = session.role === "PATIENT";

  return (
    <div className="flex flex-col gap-6">
      <Link href="/plans" className="inline-block self-start py-2.5 font-semibold text-blue1 underline-offset-4 hover:underline">
        ← {isPatient ? "Meus planos" : "Planos"}
      </Link>
      <div>
        <h1 className="font-fraunces text-3xl font-medium sm:text-4xl">{s.title}</h1>
        <p className="mt-2 text-gray-700">
          {isPatient ? `Com ${s.professional.name}` : `Paciente: ${s.patient.name}`}
          {s.adherence7d != null && ` · adesão na semana: ${s.adherence7d}%`}
        </p>
        {plan.description && <p className="mt-2">{plan.description}</p>}
      </div>

      <section aria-labelledby="checklist" className="card flex flex-col gap-3">
        <h2 id="checklist" className="text-xl font-bold">
          Checklist de hoje <span className="font-normal text-gray-700">({s.checklistDoneToday}/{s.checklistTotalToday})</span>
        </h2>
        <ul className="flex flex-col gap-2">
          {plan.checklist.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-2">
              {plan.canCheck ? (
                <form action={toggleChecklist}>
                  <input type="hidden" name="planId" value={s.id} />
                  <input type="hidden" name="itemId" value={item.id} />
                  <input type="hidden" name="date" value={plan.today} />
                  <input type="hidden" name="completed" value={String(!item.doneToday)} />
                  <button type="submit" aria-pressed={item.doneToday} className="flex min-h-11 items-center gap-3 text-left">
                    {item.doneToday ? <CircleCheck aria-hidden className="shrink-0 text-green-700" size={26} /> : <Circle aria-hidden className="shrink-0 text-gray-500" size={26} />}
                    <span className={item.doneToday ? "line-through decoration-2" : ""}>{item.description}</span>
                    <span className="text-sm text-gray-700">({FREQUENCY_TEXT[item.frequency]})</span>
                  </button>
                </form>
              ) : (
                <span className="flex items-center gap-3">
                  {item.doneToday ? <CircleCheck aria-hidden className="text-green-700" /> : <Circle aria-hidden className="text-gray-500" />}
                  {item.description} <span className="text-sm text-gray-700">({FREQUENCY_TEXT[item.frequency]})</span>
                </span>
              )}
              <span role="img" aria-label={`Últimos 7 dias: ${item.history.filter((h) => h.completed).length} de ${item.history.length} feitos`} className="flex gap-1">
                {item.history.map((h) => (
                  <span key={h.date} title={day(h.date)} className={`h-4 w-4 rounded ${h.completed ? "bg-green-600" : "bg-gray-200"}`} />
                ))}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {plan.goals.length > 0 && (
        <section aria-labelledby="metas" className="card flex flex-col gap-3">
          <h2 id="metas" className="text-xl font-bold">Metas <span className="font-normal text-gray-700">({s.goalsCompleted}/{s.goalsTotal})</span></h2>
          <ul className="flex flex-col gap-2">
            {plan.goals.map((g) => (
              <li key={g.id}>
                <form action={toggleGoal}>
                  <input type="hidden" name="planId" value={s.id} />
                  <input type="hidden" name="goalId" value={g.id} />
                  <input type="hidden" name="completed" value={String(!g.completed)} />
                  <button type="submit" aria-pressed={g.completed} className="flex min-h-11 items-center gap-3 text-left">
                    {g.completed ? <CircleCheck aria-hidden className="shrink-0 text-green-700" size={26} /> : <Circle aria-hidden className="shrink-0 text-gray-500" size={26} />}
                    <span>{g.description}{g.dueDate ? ` · até ${day(g.dueDate)}` : ""}</span>
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}

      {plan.meals.length > 0 && (
        <section aria-labelledby="rotina" className="card flex flex-col gap-3">
          <h2 id="rotina" className="text-xl font-bold">Rotina alimentar</h2>
          <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-[auto_1fr]">
            {plan.meals.map((m) => (
              <div key={m.id} className="contents">
                <dt className="font-semibold">{m.mealLabel}{m.mealTime ? ` · ${m.mealTime.slice(0, 5)}` : ""}</dt>
                <dd>{m.description}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section aria-labelledby="progresso" className="card flex flex-col gap-3">
        <h2 id="progresso" className="text-xl font-bold">Progresso</h2>
        <ProgressForm planId={s.id} />
        {plan.progress.length > 0 && (
          <ul className="flex flex-col gap-2">
            {plan.progress.map((p) => (
              <li key={p.id} className="border-t border-gray-100 pt-2">
                <strong>{day(p.recordDate)}</strong>
                {p.weightKg != null && ` · ${String(p.weightKg).replace(".", ",")} kg`}
                {p.moodScore != null && ` · ${MOOD_TEXT[p.moodScore]}`}
                {p.notes && <span className="block">{p.notes}</span>}
                <span className="block text-sm text-gray-700">por {p.recordedBy}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
