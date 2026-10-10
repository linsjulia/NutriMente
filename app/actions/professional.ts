"use server";

// Server Actions do profissional: horários de atendimento e documentos.

import { revalidatePath } from "next/cache";
import { api } from "@/app/lib/api";
import { requireRole } from "@/app/lib/dal";
import { fromApiError, text, type FormState } from "@/app/lib/form";

const API_URL = process.env.API_URL ?? "http://localhost:8080";

/** Salvar a agenda semanal inteira (as janelas vêm como JSON do editor) */
export async function saveAvailability(_state: FormState, formData: FormData): Promise<FormState> {
  const session = await requireRole("PROFESSIONAL");
  let windows: { dayOfWeek: number; startTime: string; endTime: string }[];
  try {
    windows = JSON.parse(text(formData, "windows"));
  } catch {
    return { ok: false, message: "Não foi possível ler os horários. Recarregue a página." };
  }
  const result = await api("/api/me/availability", { method: "PUT", token: session.token, body: { windows } });
  if (!result.ok) return { ...fromApiError(result.error), message: result.error.errors?.windows ?? result.error.detail };
  revalidatePath("/dashboard");
  return { ok: true, message: "Horários salvos. Os pacientes já veem os novos horários livres." };
}

/** Enviar documento (multipart direto para a API, com o token da sessão) */
export async function uploadDocument(_state: FormState, formData: FormData): Promise<FormState> {
  const session = await requireRole("PROFESSIONAL");
  const type = text(formData, "documentType");
  const file = formData.get("file");
  if (!type) return { ok: false, message: "Revise os campos destacados.", errors: { documentType: "Escolha o tipo do documento" } };
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: "Revise os campos destacados.", errors: { file: "Escolha o arquivo" } };
  const upload = new FormData();
  upload.append("file", file);
  const response = await fetch(`${API_URL}/api/me/documents?documentType=${encodeURIComponent(type)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${session.token}` },
    body: upload,
  });
  if (!response.ok) {
    const json = await response.json().catch(() => null);
    return { ok: false, message: json?.detail ?? "Não foi possível enviar agora.", errors: json?.errors };
  }
  revalidatePath("/dashboard");
  return { ok: true, message: "Documento enviado. Nossa equipe vai conferir." };
}

export async function deleteDocument(formData: FormData) {
  const session = await requireRole("PROFESSIONAL");
  await api(`/api/me/documents/${text(formData, "id")}`, { method: "DELETE", token: session.token });
  revalidatePath("/dashboard");
}
