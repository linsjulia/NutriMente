import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Video } from "lucide-react";
import { api } from "@/app/lib/api";
import { verifySession } from "@/app/lib/dal";
import { formatWhen, STATUS_TEXT, type Appointment } from "@/app/lib/agenda";

export const metadata: Metadata = { title: "Minhas consultas | NutriMente" };

/** Próximas consultas e histórico, para paciente e profissional */
export default async function AppointmentsPage() {
  const session = await verifySession();
  const [upcoming, past] = await Promise.all([
    api<Appointment[]>("/api/appointments?scope=UPCOMING", { token: session.token }),
    api<Appointment[]>("/api/appointments?scope=PAST", { token: session.token }),
  ]);
  const isPatient = session.role === "PATIENT";

  const list = (title: string, id: string, result: typeof upcoming, empty: string) => (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <h2 id={id} className="text-xl font-bold">{title}</h2>
      {!result.ok ? (
        <p role="alert" className="card border-red-300 text-red-800">{result.error.detail}</p>
      ) : result.data.length === 0 ? (
        <p className="card text-gray-700">{empty}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {result.data.map((a) => (
            <li key={a.id}>
              <Link href={`/appointments/${a.id}`} className="card flex flex-wrap items-center justify-between gap-3 transition hover:border-blue1">
                <span className="flex flex-col gap-1">
                  <span className="font-bold first-letter:uppercase">{formatWhen(a.startsAt)}</span>
                  <span className="text-gray-700">{isPatient ? a.professional.name : a.patient.name}</span>
                </span>
                <span className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                  <span className="flex items-center gap-1">
                    {a.modality === "ONLINE" ? <Video aria-hidden size={16} /> : <MapPin aria-hidden size={16} />}
                    {a.modality === "ONLINE" ? "Online" : "Presencial"}
                  </span>
                  <span className={`rounded-full px-2.5 py-0.5 ${a.status === "CANCELLED" ? "bg-red-100 text-red-900" : a.status === "CONFIRMED" ? "bg-green-100 text-green-900" : "bg-gray-200 text-gray-900"}`}>
                    {STATUS_TEXT[a.status]}
                  </span>
                  {(a.canReview || a.canWriteRecord && a.status === "COMPLETED") && (
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-amber-900">
                      {a.canReview ? "Avaliar" : "Registro"}
                    </span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-fraunces text-3xl font-medium sm:text-4xl">{isPatient ? "Minhas consultas" : "Agenda"}</h1>
        {isPatient && (
          <p className="mt-2">
            <Link href="/professionals" className="inline-block py-2.5 font-semibold text-blue1 underline-offset-4 hover:underline">
              Agendar nova consulta →
            </Link>
          </p>
        )}
      </div>
      {list("Próximas", "proximas", upcoming, isPatient ? "Você não tem consultas marcadas." : "Nenhuma consulta marcada.")}
      {list("Histórico", "historico", past, "Ainda não há consultas no histórico.")}
    </div>
  );
}
