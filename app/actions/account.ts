"use server";

// Server Actions da área logada: editar perfil, trocar senha, excluir conta
// e decisões do administrador. Cada uma confere a sessão (verifySession /
// requireRole) antes de chamar a API, e a API confere de novo.

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { api } from "@/app/lib/api";
import { requireRole, verifySession } from "@/app/lib/dal";
import { deleteSession } from "@/app/lib/session";
import { fromApiError, formValues, text, type FormState } from "@/app/lib/form";
import { parseBRL } from "@/app/lib/money";

export async function updateProfile(_state: FormState, formData: FormData): Promise<FormState> {
  const session = await verifySession();
  const values = formValues(formData);
  const result = await api("/api/me", {
    method: "PUT",
    token: session.token,
    body: { name: text(formData, "name"), telephone: text(formData, "telephone"), gender: text(formData, "gender") || null },
  });
  if (!result.ok) return fromApiError(result.error, values);
  revalidatePath("/", "layout"); // atualiza o nome no cabeçalho
  return { ok: true, message: "Dados atualizados.", values };
}

export async function updateProfessionalProfile(_state: FormState, formData: FormData): Promise<FormState> {
  const session = await requireRole("PROFESSIONAL");
  // Várias caixas marcadas = vários "specialtyIds" no formulário (getAll)
  const specialtyIds = formData.getAll("specialtyIds").map(Number).filter(Number.isInteger);
  const values = { ...formValues(formData, "specialtyIds"), specialtyIds: specialtyIds.join(",") };
  const price = parseBRL(text(formData, "consultationPrice"));
  if (!price.ok) {
    return {
      ok: false,
      message: "Revise os campos destacados.",
      errors: { consultationPrice: "Valor inválido. Use só números, ex.: 150 ou 1.000,50" },
      values,
    };
  }
  const result = await api("/api/me/professional-profile", {
    method: "PUT",
    token: session.token,
    body: {
      bio: text(formData, "bio") || null,
      consultationPrice: price.value,
      // Só envia se a lista apareceu na tela; senão a API mantém as atuais
      ...(formData.has("specialtiesShown") ? { specialtyIds } : {}),
    },
  });
  if (!result.ok) return fromApiError(result.error, values);
  revalidatePath("/dashboard");
  return { ok: true, message: "Perfil profissional atualizado.", values };
}

export async function changePassword(_state: FormState, formData: FormData): Promise<FormState> {
  const session = await verifySession();
  if (formData.get("newPassword") !== formData.get("confirmPassword")) {
    return { ok: false, message: "Revise os campos destacados.", errors: { confirmPassword: "As senhas não são iguais" } };
  }
  const result = await api("/api/me/password", {
    method: "PUT",
    token: session.token,
    body: { currentPassword: formData.get("currentPassword"), newPassword: formData.get("newPassword") },
  });
  if (!result.ok) return fromApiError(result.error);
  return { ok: true, message: "Senha alterada." };
}

export async function deleteAccount(_state: FormState, formData: FormData): Promise<FormState> {
  const session = await verifySession();
  if (text(formData, "confirmation").toUpperCase() !== "EXCLUIR") {
    return { ok: false, message: "Digite EXCLUIR para confirmar.", errors: { confirmation: "Digite EXCLUIR" } };
  }
  const result = await api("/api/me", { method: "DELETE", token: session.token, body: { password: formData.get("password") } });
  if (!result.ok) return fromApiError(result.error);
  await deleteSession();
  redirect("/?account-deleted=1");
}

/** Admin aprova ou recusa um profissional */
export async function reviewProfessional(formData: FormData) {
  const session = await requireRole("ADMIN");
  const id = Number(formData.get("id"));
  const status = text(formData, "status");
  const reason = text(formData, "reason");
  if (!Number.isInteger(id) || !["APPROVED", "REJECTED"].includes(status)) return;
  // A API exige motivo na recusa; o campo do formulário já é obrigatório
  if (status === "REJECTED" && !reason) return;
  await api(`/api/admin/professionals/${id}/verification`, {
    method: "PATCH",
    token: session.token,
    body: { status, reason: reason || null },
  });
  revalidatePath("/admin/professionals");
}
