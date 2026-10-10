import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/app/lib/api";
import { requireRole } from "@/app/lib/dal";
import type { MyPatient } from "@/app/lib/patients";
import PlanForm from "./PlanForm";

export const metadata: Metadata = { title: "Novo plano de ação | NutriMente" };

export default async function NewPlanPage({ searchParams }: PageProps<"/plans/new">) {
  const session = await requireRole("PROFESSIONAL");
  const { patientId } = await searchParams;
  const patients = await api<MyPatient[]>("/api/me/patients", { token: session.token });
  return (
    <div className="flex flex-col gap-6">
      <Link href="/patients" className="inline-block self-start py-2.5 font-semibold text-blue1 underline-offset-4 hover:underline">
        ← Meus pacientes
      </Link>
      <div>
        <h1 className="font-fraunces text-3xl font-medium sm:text-4xl">Novo plano de ação</h1>
        <p className="mt-2 text-gray-700">O paciente recebe um e-mail e acompanha o plano todos os dias pelo NutriMente.</p>
      </div>
      {!patients.ok ? (
        <p role="alert" className="card border-red-300 text-red-800">{patients.error.detail}</p>
      ) : patients.data.length === 0 ? (
        <p className="card text-gray-700">Você poderá criar planos depois da primeira consulta com um paciente.</p>
      ) : (
        <section aria-label="Plano" className="card">
          <PlanForm patients={patients.data} patientId={typeof patientId === "string" ? Number(patientId) : undefined} />
        </section>
      )}
    </div>
  );
}
