"use server";

// Server Actions do paciente: diário alimentar (com foto) e questionário inicial.

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { api } from "@/app/lib/api";
import { requireRole } from "@/app/lib/dal";
import { fromApiError, formValues, text, type FormState } from "@/app/lib/form";

const API_URL = process.env.API_URL ?? "http://localhost:8080";
const optionalNumber = (formData: FormData, key: string) => (text(formData, key) ? Number(text(formData, key)) : null);

/**
 * Registrar refeição. Data e hora vêm no horário de Brasília (inputs date e
 * time); a API recebe em UTC. A foto, se houver, vai num segundo envio
 * (multipart), depois que a refeição existe.
 */
export async function addMeal(_state: FormState, formData: FormData): Promise<FormState> {
  const session = await requireRole("PATIENT");
  const values = formValues(formData, "photo");
  const date = text(formData, "date");
  const time = text(formData, "time");
  if (!date || !time) {
    return { ok: false, message: "Revise os campos destacados.", errors: { eatenAt: "Informe o dia e a hora" }, values };
  }
  const created = await api<{ id: number }>("/api/me/meals", {
    method: "POST",
    token: session.token,
    body: {
      eatenAt: new Date(`${date}T${time}:00-03:00`).toISOString(),
      mealType: text(formData, "mealType") || null,
      description: text(formData, "description"),
      notes: text(formData, "notes") || null,
      hungerLevel: optionalNumber(formData, "hungerLevel"),
      satisfactionLevel: optionalNumber(formData, "satisfactionLevel"),
    },
  });
  if (!created.ok) return fromApiError(created.error, values);

  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    const upload = new FormData();
    upload.append("photo", photo);
    const response = await fetch(`${API_URL}/api/me/meals/${created.data.id}/photo`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${session.token}` },
      body: upload,
    });
    if (!response.ok) {
      const json = await response.json().catch(() => null);
      revalidatePath("/diary");
      return {
        ok: false,
        message: `Refeição registrada, mas a foto não foi enviada: ${json?.detail ?? "tente de novo."}`,
        errors: json?.errors,
      };
    }
  }
  revalidatePath("/diary");
  return { ok: true, message: "Refeição registrada." };
}

export async function deleteMeal(formData: FormData) {
  const session = await requireRole("PATIENT");
  await api(`/api/me/meals/${text(formData, "id")}`, { method: "DELETE", token: session.token });
  revalidatePath("/diary");
}

export async function saveIntake(_state: FormState, formData: FormData): Promise<FormState> {
  const session = await requireRole("PATIENT");
  const goals = formData.getAll("goals").map(String);
  const values = { ...formValues(formData, "goals"), goals: goals.join(",") };
  const result = await api("/api/me/intake", {
    method: "PUT",
    token: session.token,
    body: {
      goals,
      mealsPerDay: optionalNumber(formData, "mealsPerDay"),
      waterLitersPerDay: text(formData, "waterLitersPerDay") ? Number(text(formData, "waterLitersPerDay").replace(",", ".")) : null,
      activityLevel: text(formData, "activityLevel") || null,
      sleepQuality: optionalNumber(formData, "sleepQuality"),
      stressLevel: optionalNumber(formData, "stressLevel"),
      dietaryRestrictions: text(formData, "dietaryRestrictions") || null,
      healthConditions: text(formData, "healthConditions") || null,
      expectations: text(formData, "expectations") || null,
    },
  });
  if (!result.ok) return fromApiError(result.error, values);
  revalidatePath("/dashboard");
  redirect("/dashboard?questionario=1");
}
