"use server";

// Server Actions do acompanhamento: notificações e plano de ação.

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { api } from "@/app/lib/api";
import { requireRole, verifySession } from "@/app/lib/dal";
import { fromApiError, formValues, text, type FormState } from "@/app/lib/form";

/** Abrir uma notificação: marca como lida e leva para o link dela */
export async function openNotification(formData: FormData) {
  const session = await verifySession();
  const id = text(formData, "id");
  await api(`/api/notifications/${id}/read`, { method: "POST", token: session.token });
  revalidatePath("/", "layout"); // atualiza o contador do sino
  const link = text(formData, "linkUrl");
  // Só caminhos internos (nunca outro site)
  redirect(link.startsWith("/") && !link.startsWith("//") ? link : "/notifications");
}

export async function readAllNotifications() {
  const session = await verifySession();
  await api("/api/notifications/read-all", { method: "POST", token: session.token });
  revalidatePath("/", "layout");
}

/** Marcar ou desmarcar um item do checklist de hoje */
export async function toggleChecklist(formData: FormData) {
  const session = await requireRole("PATIENT");
  const plan = text(formData, "planId");
  await api(`/api/plans/${plan}/checklist/${text(formData, "itemId")}/${text(formData, "date")}`, {
    method: "PUT",
    token: session.token,
    body: { completed: text(formData, "completed") === "true" },
  });
  revalidatePath(`/plans/${plan}`);
}

export async function toggleGoal(formData: FormData) {
  const session = await verifySession();
  const plan = text(formData, "planId");
  await api(`/api/plans/${plan}/goals/${text(formData, "goalId")}`, {
    method: "PUT",
    token: session.token,
    body: { completed: text(formData, "completed") === "true" },
  });
  revalidatePath(`/plans/${plan}`);
}

export async function addProgress(_state: FormState, formData: FormData): Promise<FormState> {
  const session = await verifySession();
  const plan = text(formData, "planId");
  const values = formValues(formData);
  const weight = text(formData, "weightKg").replace(",", ".");
  const mood = text(formData, "moodScore");
  const result = await api(`/api/plans/${plan}/progress`, {
    method: "POST",
    token: session.token,
    body: {
      weightKg: weight ? Number(weight) : null,
      moodScore: mood ? Number(mood) : null,
      notes: text(formData, "notes") || null,
    },
  });
  if (!result.ok) return fromApiError(result.error, values);
  revalidatePath(`/plans/${plan}`);
  return { ok: true, message: "Registro salvo." };
}

/**
 * Criar plano de ação (profissional). As listas vêm como JSON no campo
 * "lists"; linhas em branco são ignoradas. Sucesso: abre o plano criado.
 */
export async function createPlan(_state: FormState, formData: FormData): Promise<FormState> {
  const session = await requireRole("PROFESSIONAL");
  const values = formValues(formData, "lists");
  type Lists = {
    goals: { description: string; dueDate: string }[];
    checklist: { description: string; frequency: string }[];
    meals: { mealType: string; mealTime: string; description: string }[];
  };
  let lists: Lists;
  try {
    lists = JSON.parse(text(formData, "lists"));
  } catch {
    return { ok: false, message: "Não foi possível ler o formulário. Recarregue a página.", values };
  }
  const result = await api<{ summary: { id: number } }>("/api/plans", {
    method: "POST",
    token: session.token,
    body: {
      patientId: Number(text(formData, "patientId")) || null,
      title: text(formData, "title"),
      description: text(formData, "description") || null,
      startDate: text(formData, "startDate") || null,
      endDate: text(formData, "endDate") || null,
      goals: lists.goals.filter((g) => g.description.trim()).map((g) => ({ description: g.description.trim(), dueDate: g.dueDate || null })),
      checklist: lists.checklist.filter((c) => c.description.trim()).map((c) => ({ description: c.description.trim(), frequency: c.frequency })),
      meals: lists.meals
        .filter((m) => m.description.trim())
        .map((m) => ({ mealType: m.mealType, mealTime: m.mealTime || null, description: m.description.trim() })),
    },
  });
  if (!result.ok) {
    // Erros das listas (ex.: "goals[0].description") viram uma mensagem geral
    const listErrors = Object.entries(result.error.errors ?? {}).filter(([k]) => k.includes("["));
    const message = listErrors.length ? `${result.error.detail} ${listErrors.map(([, m]) => m).join(" · ")}` : result.error.detail;
    return { ...fromApiError(result.error, values), message };
  }
  revalidatePath("/plans");
  redirect(`/plans/${result.data.summary.id}`);
}
