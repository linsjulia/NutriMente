import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/app/lib/api";
import { requireRole } from "@/app/lib/dal";
import { formatWhen } from "@/app/lib/agenda";
import type { MyPatient } from "@/app/lib/patients";

export const metadata: Metadata = { title: "Meus pacientes | NutriMente" };

/** Pacientes com consulta marcada ou realizada com o profissional */
export default async function PatientsPage() {
  const session = await requireRole("PROFESSIONAL");
  const result = await api<MyPatient[]>("/api/me/patients", { token: session.token });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-fraunces text-3xl font-medium sm:text-4xl">Meus pacientes</h1>
      {!result.ok ? (
        <p role="alert" className="card border-red-300 text-red-800">{result.error.detail}</p>
      ) : result.data.length === 0 ? (
        <p className="card text-gray-700">Seus pacientes aparecem aqui depois da primeira consulta marcada.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {result.data.map((p) => (
            <li key={p.id}>
              <Link href={`/patients/${p.id}`} className="card flex h-full flex-col gap-1 transition hover:border-blue1">
                <span className="text-lg font-bold">{p.name}</span>
                <span className="text-gray-700 first-letter:uppercase">Última consulta: {formatWhen(p.lastAppointmentAt)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
