import type { Metadata } from "next";
import { api } from "@/app/lib/api";
import { requireRole } from "@/app/lib/dal";
import IntakeForm, { type Intake } from "./IntakeForm";

export const metadata: Metadata = { title: "Questionário inicial | NutriMente" };

/** Questionário inicial (responder ou editar). Ajuda o profissional a conhecer o paciente */
export default async function OnboardingPage() {
  const session = await requireRole("PATIENT");
  const current = await api<Intake>("/api/me/intake", { token: session.token });
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-fraunces text-3xl font-medium sm:text-4xl">Conte um pouco sobre você</h1>
        <p className="mt-2 text-gray-700">
          Leva uns 2 minutos. Só os profissionais que te atendem veem as respostas, e você pode mudar depois.
        </p>
      </div>
      <section aria-label="Questionário" className="card">
        <IntakeForm current={current.ok ? current.data : null} />
      </section>
    </div>
  );
}
