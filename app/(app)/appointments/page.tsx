import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { api } from "@/app/lib/api";
import { requireRole } from "@/app/lib/dal";
import type { ProfessionalProfile, SlotDay } from "@/app/lib/agenda";
import AppointmentFlow from "@/app/components/appointment/AppointmentFlow";

export const metadata: Metadata = { title: "Agendar consulta | NutriMente" };

/** Agendamento dentro da área logada; o profissional vem da busca. */
export default async function AppointmentsPage({ searchParams }: PageProps<"/appointments">) {
  const session = await requireRole("PATIENT");
  const { professional: professionalParam, startsAt } = await searchParams;

  if (typeof professionalParam !== "string") redirect("/professionals");
  if (!/^\d+$/.test(professionalParam)) notFound();
  const professionalId = Number(professionalParam);
  if (!Number.isSafeInteger(professionalId) || professionalId < 1) notFound();

  const [profile, slots] = await Promise.all([
    api<ProfessionalProfile>(`/api/professionals/${professionalId}`),
    api<SlotDay[]>(`/api/professionals/${professionalId}/slots?days=14`),
  ]);
  if (!profile.ok) {
    if (profile.error.status === 404) notFound();
    return (
      <div className="space-y-6">
        <h1 className="font-fraunces text-3xl font-medium">Agendar consulta</h1>
        <p role="alert" className="card border-red-300 text-red-800">{profile.error.detail}</p>
      </div>
    );
  }

  const days = slots.ok ? slots.data.filter((day) => day.slots.length > 0) : [];
  const preselected =
    typeof startsAt === "string" && days.some((day) => day.slots.some((slot) => slot.startsAt === startsAt)) ? startsAt : null;

  return (
    <div className="space-y-6">
      {!slots.ok && <p role="alert" className="card border-red-300 text-red-800">{slots.error.detail}</p>}
      <AppointmentFlow profile={profile.data} days={days} preselectedStartsAt={preselected} viewer={session.role} />
    </div>
  );
}
