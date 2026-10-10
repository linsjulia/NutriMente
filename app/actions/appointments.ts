"use server";

// Server Actions da agenda: agendar, cancelar, confirmar, concluir, avaliar,
// triagem e registro da consulta. Cada uma confere a sessão antes de chamar
// a API, e a API confere tudo de novo (quem pode, quando pode).

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { api } from "@/app/lib/api";
import { requireRole, verifySession } from "@/app/lib/dal";
import { fromApiError, formValues, text, type FormState } from "@/app/lib/form";
import type { Appointment } from "@/app/lib/agenda";

const optionalNumber = (formData: FormData, key: string) => {
  const value = text(formData, key);
  return value ? Number(value) : null;
};

/** Agendar a partir do perfil do profissional. Sucesso: vai para a consulta */
export async function bookAppointment(_state: FormState, formData: FormData): Promise<FormState> {
  const session = await requireRole("PATIENT");
  const values = formValues(formData);
  const startsAt = text(formData, "startsAt");
  if (!startsAt) {
    return { ok: false, message: "Escolha um horário.", errors: { startsAt: "Escolha um horário" }, values };
  }
  const reason = text(formData, "reason");
  const result = await api<Appointment>("/api/appointments", {
    method: "POST",
    token: session.token,
    body: {
      professionalId: Number(text(formData, "professionalId")),
      startsAt,
      modality: text(formData, "modality") || null,
      notes: text(formData, "notes") || null,
      // Triagem é opcional: só vai se a pessoa contou o motivo
      screening: reason
        ? { reason, symptoms: text(formData, "symptoms") || null, moodScore: optionalNumber(formData, "moodScore") }
        : undefined,
    },
  });
  if (!result.ok) {
    // A API devolve erros da triagem como "screening.reason"
    const errors = Object.fromEntries(
      Object.entries(result.error.errors ?? {}).map(([k, v]) => [k.replace("screening.", ""), v]),
    );
    return { ...fromApiError(result.error, values), errors };
  }
  revalidatePath("/appointments");
  redirect(`/appointments/${result.data.id}?agendada=1`);
}

/** Ações de um clique (confirmar, concluir) e cancelar (com motivo opcional) */
export async function appointmentAction(_state: FormState, formData: FormData): Promise<FormState> {
  const session = await verifySession();
  const id = text(formData, "id");
  const action = text(formData, "action");
  if (!["cancel", "confirm", "complete"].includes(action)) return { ok: false, message: "Ação inválida." };
  const result = await api<Appointment>(`/api/appointments/${id}/${action}`, {
    method: "POST",
    token: session.token,
    body: action === "cancel" ? { reason: text(formData, "reason") || null } : undefined,
  });
  if (!result.ok) return fromApiError(result.error);
  revalidatePath(`/appointments/${id}`);
  revalidatePath("/appointments");
  const done = { cancel: "Consulta cancelada.", confirm: "Consulta confirmada.", complete: "Consulta marcada como realizada." };
  return { ok: true, message: done[action as keyof typeof done] };
}

export async function reviewAppointment(_state: FormState, formData: FormData): Promise<FormState> {
  const session = await requireRole("PATIENT");
  const id = text(formData, "id");
  const values = formValues(formData);
  const result = await api(`/api/appointments/${id}/review`, {
    method: "POST",
    token: session.token,
    body: { rating: optionalNumber(formData, "rating"), comment: text(formData, "comment") || null },
  });
  if (!result.ok) return fromApiError(result.error, values);
  revalidatePath(`/appointments/${id}`);
  return { ok: true, message: "Obrigado! Sua avaliação foi publicada." };
}

export async function saveScreening(_state: FormState, formData: FormData): Promise<FormState> {
  const session = await requireRole("PATIENT");
  const id = text(formData, "id");
  const values = formValues(formData);
  const result = await api(`/api/appointments/${id}/screening`, {
    method: "PUT",
    token: session.token,
    body: {
      reason: text(formData, "reason"),
      symptoms: text(formData, "symptoms") || null,
      moodScore: optionalNumber(formData, "moodScore"),
    },
  });
  if (!result.ok) return fromApiError(result.error, values);
  revalidatePath(`/appointments/${id}`);
  return { ok: true, message: "Triagem salva. O profissional vai ler antes da consulta.", values };
}

export async function saveRecord(_state: FormState, formData: FormData): Promise<FormState> {
  const session = await requireRole("PROFESSIONAL");
  const id = text(formData, "id");
  const values = formValues(formData);
  const result = await api(`/api/appointments/${id}/record`, {
    method: "PUT",
    token: session.token,
    body: { privateNotes: text(formData, "privateNotes") || null, patientGuidance: text(formData, "patientGuidance") || null },
  });
  if (!result.ok) return fromApiError(result.error, values);
  revalidatePath(`/appointments/${id}`);
  return { ok: true, message: "Registro salvo.", values };
}
