import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Clock } from "lucide-react";
import { api } from "@/app/lib/api";
import { verifySession } from "@/app/lib/dal";
import { deleteProgress, toggleChecklist, toggleGoal } from "@/app/actions/followup";
import { FREQUENCY_TEXT, type PlanDetail } from "@/app/lib/plans";
import { MOOD_TEXT } from "@/app/lib/agenda";
import { AdherenceRing, Avatar, CheckBadge, EmptyBadge } from "@/app/components/plans/PlanParts";
import ProgressForm from "./ProgressForm";

export const metadata: Metadata = { title: "Plano de ação | NutriMente" };

const CARD = "rounded-[1.75rem] bg-white shadow-[0_22px_50px_-30px_rgba(0,80,176,0.35)]";
const CHIP = "inline-flex items-center gap-1.5 rounded-full bg-[#eef3fb] px-3.5 py-1.5 text-sm font-semibold text-slate-700";
const WEEKDAY = ["D", "S", "T", "Q", "Q", "S", "S"];

type ChecklistItem = PlanDetail["checklist"][number];

const day = (iso: string) => iso.split("-").reverse().slice(0, 2).join("/");
const weekdayOf = (iso: string) => WEEKDAY[new Date(`${iso}T12:00:00`).getDay()];
const kg = (n: number) => `${String(n).replace(".", ",")} kg`;

function HeroStat({ done, total, label }: { done: number; total: number; label: string }) {
  return (
    <div className="rounded-3xl bg-white/[.12] px-6 py-5">
      <p className="text-4xl font-bold leading-none">
        {done}
        <span className="ml-1.5 text-xl font-medium text-white/70">de {total}</span>
      </p>
      <p className="mt-2.5 text-white/85">{label}</p>
    </div>
  );
}

/** Bloco de um item do checklist: o paciente toca para marcar (botão de formulário, funciona sem JavaScript) */
function ChecklistTile({ plan, item }: { plan: PlanDetail; item: ChecklistItem }) {
  const done = item.doneToday;
  const doneCount = item.history.filter((h) => h.completed).length;
  const head = (
    <>
      <span className="flex w-full items-start justify-between gap-3">
        {done ? <CheckBadge /> : <EmptyBadge />}
        <span className={`rounded-full px-3.5 py-1.5 text-sm font-semibold text-slate-700 ${done ? "bg-white" : "bg-[#eef3fb]"}`}>
          {FREQUENCY_TEXT[item.frequency]}
        </span>
      </span>
      <span className={`text-xl font-bold leading-snug ${done ? "text-[#4d7a63] line-through decoration-2" : ""}`}>{item.description}</span>
    </>
  );

  return (
    <li
      className={`flex min-h-56 flex-col gap-5 rounded-[1.75rem] p-6 transition ${
        done ? "bg-[#effcf4] ring-2 ring-[#7be8a6]" : "bg-white shadow-[0_18px_40px_-26px_rgba(0,80,176,0.35)]"
      } ${plan.canCheck ? "hover:-translate-y-0.5" : ""}`}
    >
      {plan.canCheck ? (
        <form action={toggleChecklist} className="flex">
          <input type="hidden" name="planId" value={plan.summary.id} />
          <input type="hidden" name="itemId" value={item.id} />
          <input type="hidden" name="date" value={plan.today} />
          <input type="hidden" name="completed" value={String(!item.doneToday)} />
          <button
            type="submit"
            aria-pressed={done}
            className="flex w-full flex-col gap-4 rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue1 focus-visible:ring-offset-4"
          >
            {head}
          </button>
        </form>
      ) : (
        <div className="flex flex-col gap-4">{head}</div>
      )}

      <span
        role="img"
        aria-label={`Últimos 7 dias: ${doneCount} de ${item.history.length} feitos`}
        className="mt-auto flex gap-2"
      >
        {item.history.map((h) => (
          <span key={h.date} title={day(h.date)} className="flex flex-col items-center gap-1.5">
            <span
              className={`h-6 w-6 rounded-lg ${h.completed ? "bg-[#00dc5a]" : "bg-[#e3ecf7]"} ${
                h.date === plan.today ? "ring-2 ring-blue1 ring-offset-2" : ""
              }`}
            />
            <span className="text-[11px] font-semibold text-slate-500">{weekdayOf(h.date)}</span>
          </span>
        ))}
      </span>
    </li>
  );
}

/**
 * Plano de ação: destaque com os números da semana e abas (Hoje, Metas,
 * Rotina alimentar, Progresso). A aba vem da URL (?aba=metas), então tudo
 * continua renderizado no servidor e funciona sem JavaScript.
 */
export default async function PlanPage({ params, searchParams }: PageProps<"/plans/[id]">) {
  const session = await verifySession();
  const { id } = await params;
  const { aba } = await searchParams;
  // Só números: "/plans/abc" é página inexistente, não erro de formulário
  if (!/^\d+$/.test(id)) notFound();
  const result = await api<PlanDetail>(`/api/plans/${Number(id)}`, { token: session.token });
  if (!result.ok) {
    if (result.error.status === 404) notFound();
    return <p role="alert" className="card border-red-300 text-red-800">{result.error.detail}</p>;
  }
  const plan = result.data;
  const s = plan.summary;
  const isPatient = session.role === "PATIENT";
  const person = isPatient ? s.professional.name : s.patient.name;

  const tabs: { key: string; label: string }[] = [
    { key: "hoje", label: "Hoje" },
    ...(plan.goals.length > 0 ? [{ key: "metas", label: "Metas" }] : []),
    ...(plan.meals.length > 0 ? [{ key: "rotina", label: "Rotina alimentar" }] : []),
    { key: "progresso", label: "Progresso" },
  ];
  const requested = typeof aba === "string" ? aba : "";
  const active = tabs.some((t) => t.key === requested) ? requested : "hoje";

  const remaining = s.checklistTotalToday - s.checklistDoneToday;
  const last = plan.progress.reduce<(typeof plan.progress)[number] | null>((a, p) => (!a || p.recordDate > a.recordDate ? p : a), null);
  const lastRecord = last ? `${day(last.recordDate)}${last.weightKg != null ? `, ${kg(last.weightKg)}` : ""}` : undefined;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 text-[#14304a]">
      <Link
        href="/plans"
        className="inline-flex min-h-11 items-center gap-1.5 self-start rounded-full bg-white px-5 font-semibold text-blue1 shadow-[0_10px_30px_-18px_rgba(0,80,176,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue1"
      >
        <ChevronLeft aria-hidden size={18} /> {isPatient ? "Meus planos" : "Planos"}
      </Link>

      <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-blue1 to-[#1a6bff] p-8 text-white shadow-[0_36px_70px_-36px_rgba(0,80,176,0.7)] sm:p-12">
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#00dc5a]/30 blur-3xl" />
        <div className="relative grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:items-center">
          <div>
            <span className="inline-flex rounded-full bg-white/15 px-4 py-2 text-sm font-semibold">Plano de ação</span>
            <h1 className="mt-5 font-fraunces text-4xl font-medium leading-tight sm:text-6xl">{s.title}</h1>
            <p className="mt-5 flex items-center gap-3 text-lg text-white/90">
              <Avatar name={person} size="h-10 w-10" text="text-sm" />
              <span>{isPatient ? <>Com <b>{person}</b></> : <>Paciente: <b>{person}</b></>}</span>
            </p>
            {plan.description && <p className="mt-4 max-w-lg text-lg leading-relaxed text-white/80">{plan.description}</p>}
          </div>

          <div className="flex flex-wrap items-center gap-6">
            {s.adherence7d != null ? (
              <div className="flex flex-col items-center gap-2">
                <AdherenceRing value={s.adherence7d} size={132} stroke={14} onDark />
                <span className="text-sm text-white/85">Adesão na semana</span>
              </div>
            ) : (
              <span className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold">Adesão: sem dados ainda</span>
            )}
            <div className="flex min-w-48 flex-1 flex-col gap-3.5">
              <HeroStat done={s.checklistDoneToday} total={s.checklistTotalToday} label="Checklist de hoje" />
              <HeroStat done={s.goalsCompleted} total={s.goalsTotal} label="Metas concluídas" />
            </div>
          </div>
        </div>
      </section>

      <nav aria-label="Seções do plano" className="flex max-w-full gap-1 self-start overflow-x-auto rounded-full bg-white p-1.5 shadow-[0_10px_30px_-18px_rgba(0,80,176,0.35)]">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`?aba=${t.key}`}
            scroll={false}
            aria-current={active === t.key ? "true" : undefined}
            className={`flex min-h-12 shrink-0 items-center whitespace-nowrap rounded-full px-6 text-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue1 ${
              active === t.key ? "bg-[#dcecff] font-bold text-blue1" : "font-medium text-slate-600 hover:text-blue1"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {active === "hoje" && (
        <>
          <section aria-labelledby="checklist">
            <h2 id="checklist" className="sr-only">Checklist de hoje, {s.checklistDoneToday} de {s.checklistTotalToday}</h2>
            {plan.checklist.length === 0 ? (
              <p className={`${CARD} p-8 text-slate-600`}>Este plano ainda não tem itens no checklist.</p>
            ) : (
              <>
                <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {plan.checklist.map((item) => <ChecklistTile key={item.id} plan={plan} item={item} />)}
                  <li className="flex min-h-56 flex-col justify-center gap-2.5 rounded-[1.75rem] bg-gradient-to-br from-[#dcfbe8] to-[#c8f7f0] p-7">
                    <p className="font-fraunces text-3xl font-medium leading-tight">
                      {remaining > 0
                        ? remaining === 1 ? "Falta só 1 para fechar o dia." : `Faltam só ${remaining} para fechar o dia.`
                        : "Dia fechado! Tudo marcado hoje."}
                    </p>
                    <p className="leading-relaxed text-[#2f5a49]">
                      {isPatient ? "Você já marcou" : "O paciente já marcou"} {s.checklistDoneToday} de {s.checklistTotalToday} itens de hoje.
                    </p>
                  </li>
                </ul>
                <p className="mt-4 text-sm text-slate-500">Quadradinhos: últimos 7 dias. O contorno azul marca hoje.</p>
              </>
            )}
          </section>

          {isPatient && (
            <section aria-labelledby="registrar" className={`${CARD} p-6 sm:p-10`}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 id="registrar" className="text-2xl font-bold">Registrar progresso</h2>
                <p className="text-slate-600">Preencha pelo menos um campo.</p>
              </div>
              <ProgressForm planId={s.id} lastRecord={lastRecord} />
            </section>
          )}
        </>
      )}

      {active === "metas" && (
        <section aria-labelledby="metas" className={`${CARD} p-6 sm:p-10`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="metas" className="text-2xl font-bold">Metas</h2>
            <span className={CHIP}>{s.goalsCompleted} de {s.goalsTotal} concluídas</span>
          </div>
          <ul className="mt-6 flex flex-col gap-3">
            {plan.goals.map((g) => {
              const body = (
                <>
                  {g.completed ? <CheckBadge className="h-9 w-9" /> : <EmptyBadge className="h-9 w-9" />}
                  <span className={`flex-1 text-lg font-semibold ${g.completed ? "text-[#4d7a63] line-through decoration-2" : ""}`}>{g.description}</span>
                  {g.dueDate && <span className={CHIP}>até {day(g.dueDate)}</span>}
                </>
              );
              const row = `flex flex-wrap items-center gap-4 rounded-3xl px-5 py-4 ${g.completed ? "bg-[#effcf4]" : "bg-[#f6faff]"}`;
              return (
                <li key={g.id}>
                  {isPatient ? (
                    <form action={toggleGoal}>
                      <input type="hidden" name="planId" value={s.id} />
                      <input type="hidden" name="goalId" value={g.id} />
                      <input type="hidden" name="completed" value={String(!g.completed)} />
                      <button
                        type="submit"
                        aria-pressed={g.completed}
                        className={`${row} min-h-14 w-full text-left transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue1`}
                      >
                        {body}
                      </button>
                    </form>
                  ) : (
                    <div className={row}>{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {active === "rotina" && (
        <section aria-labelledby="rotina" className={`${CARD} p-6 sm:p-10`}>
          <h2 id="rotina" className="text-2xl font-bold">Rotina alimentar</h2>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            {plan.meals.map((m) => (
              <div key={m.id} className="rounded-3xl bg-[#f6faff] p-5">
                <dt className="flex flex-col items-start gap-3 text-lg font-bold">
                  {m.mealTime && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#dcecff] px-3 py-1 text-sm font-semibold text-blue1">
                      <Clock aria-hidden size={15} /> {m.mealTime.slice(0, 5)}
                    </span>
                  )}
                  {m.mealLabel}
                </dt>
                <dd className="mt-1.5 leading-relaxed text-slate-600">{m.description}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {active === "progresso" && (
        <section aria-labelledby="progresso" className={`${CARD} p-6 sm:p-10`}>
          <h2 id="progresso" className="text-2xl font-bold">Progresso</h2>
          {plan.progress.length === 0 ? (
            <p className="mt-4 text-slate-600">
              Nenhum registro ainda.{" "}
              {isPatient && (
                <Link href="?aba=hoje" scroll={false} className="font-semibold text-blue1 underline-offset-4 hover:underline">
                  Registrar progresso
                </Link>
              )}
            </p>
          ) : (
            <ul className="mt-4 flex flex-col">
              {plan.progress.map((p) => (
                <li key={p.id} className="border-t border-[#e6eef8] py-5 first:border-t-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <strong className="text-lg">{day(p.recordDate)}</strong>
                    {p.weightKg != null && <span className="rounded-full bg-[#dcfbe8] px-3.5 py-1.5 text-sm font-semibold text-green-900">{kg(p.weightKg)}</span>}
                    {p.moodScore != null && <span className={CHIP}>{MOOD_TEXT[p.moodScore]}</span>}
                  </div>
                  {p.notes && <p className="mt-3 leading-relaxed text-slate-700">{p.notes}</p>}
                  <div className="mt-2 flex items-center justify-between gap-3 text-sm text-slate-500">
                    <span>por {p.recordedBy}</span>
                    {p.canEdit && (
                      <form action={deleteProgress}>
                        <input type="hidden" name="planId" value={s.id} />
                        <input type="hidden" name="progressId" value={p.id} />
                        <button type="submit" className="min-h-11 rounded-full px-3 font-semibold text-red-700 hover:bg-red-50">
                          Excluir<span className="sr-only"> registro de {day(p.recordDate)}</span>
                        </button>
                      </form>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}