import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { api } from "@/app/lib/api";
import { getSession } from "@/app/lib/session";
import type { ProfessionalProfile, SlotDay } from "@/app/lib/agenda";
import AppointmentFlow from "./AppointmentFlow";

export const metadata: Metadata = { title: "Agendar consulta | NutriMente" };

/**
 * Agendamento em etapas: /appointment?professional=ID (&startsAt=... para
 * já chegar com um horário escolhido, ex.: vindo do card da busca).
 * Perfil e horários vêm da API; quem grava é a mesma ação do perfil
 * (bookAppointment -> POST /api/appointments).
 */
export default async function AppointmentPage({ searchParams }: PageProps<"/appointment">) {
  const { professional, startsAt } = await searchParams;
  if (typeof professional !== "string" || !/^\d+$/.test(professional)) notFound();
  const id = Number(professional);

  const [profile, slots, session] = await Promise.all([
    api<ProfessionalProfile>(`/api/professionals/${id}`),
    api<SlotDay[]>(`/api/professionals/${id}/slots?days=14`),
    getSession(),
  ]);
  if (!profile.ok) {
    if (profile.error.status === 404) notFound();
    return (
      <main id="conteudo" className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="font-fraunces text-3xl font-medium">Agendar consulta</h1>
        <p role="alert" className="card mt-6 border-red-300 text-red-800">{profile.error.detail}</p>
      </main>
    );
  }
  const days = slots.ok ? slots.data.filter((d) => d.slots.length > 0) : [];
  const preselected =
    typeof startsAt === "string" && days.some((d) => d.slots.some((s) => s.startsAt === startsAt)) ? startsAt : null;

  return (
    <main id="conteudo" className="flex-1 bg-slate-50">
      <div className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-6">
        <h1 className="font-fraunces text-3xl font-medium text-blue-900">Agendar com {profile.data.name}</h1>
        <AppointmentFlow
          profile={profile.data}
          days={days}
          preselectedStartsAt={preselected}
          viewer={session ? session.role : null}
        />
      </div>
    </main>
  );
}
