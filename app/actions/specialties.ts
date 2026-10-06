"use server";

// Server Actions da tela "Especialidades" do administrador.
// requireRole("ADMIN") confere a sessão; a API confere de novo (403).

import { revalidatePath } from "next/cache";
import { api } from "@/app/lib/api";
import { requireRole } from "@/app/lib/dal";
import { fromApiError, formValues, text, type FormState } from "@/app/lib/form";

export async function createSpecialty(_state: FormState, formData: FormData): Promise<FormState> {
  const session = await requireRole("ADMIN");
  const values = formValues(formData);
  const result = await api("/api/admin/specialties", {
    method: "POST",
    token: session.token,
    body: { name: text(formData, "name"), type: text(formData, "type") || null },
  });
  if (!result.ok) return fromApiError(result.error, values);
  // A lista aparece em três lugares: admin, busca pública e perfil do profissional
  revalidatePath("/admin/specialties");
  revalidatePath("/professionals");
  revalidatePath("/dashboard");
  // Sem "values": o formulário volta limpo para cadastrar a próxima
  return { ok: true, message: `Especialidade "${text(formData, "name")}" cadastrada.` };
}

export async function deleteSpecialty(formData: FormData) {
  const session = await requireRole("ADMIN");
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  await api(`/api/admin/specialties/${id}`, { method: "DELETE", token: session.token });
  revalidatePath("/admin/specialties");
  revalidatePath("/professionals");
  revalidatePath("/dashboard");
}
