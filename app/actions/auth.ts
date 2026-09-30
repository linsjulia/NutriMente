"use server";

// =============================================================
// Server Actions de autenticação
//
// "use server" = estas funções rodam NO SERVIDOR do Next, mesmo sendo
// chamadas por um <form> na página. O navegador só envia os campos;
// quem fala com a API Java (e guarda o token) é o servidor.
//
// Validação: a regra de verdade fica na API (CPF, idade, senha...). Aqui só
// conferimos o que a API não recebe (ex.: "confirme a senha") e repassamos
// os erros por campo que ela devolve.
// =============================================================

import { redirect } from "next/navigation";
import { api } from "@/app/lib/api";
import { createSession, deleteSession, homeFor, type Role } from "@/app/lib/session";
import { fromApiError, formValues, text, type FormState } from "@/app/lib/form";

type LoginResponse = { accessToken: string; expiresAt: string; user: { id: number; name: string; role: Role } };
type Message = { message: string };

// ---------------- Login / logout ----------------

export async function login(_state: FormState, formData: FormData): Promise<FormState> {
  const values = { email: text(formData, "email") };
  const result = await api<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: { email: values.email, password: formData.get("password") },
  });
  if (!result.ok) return fromApiError(result.error, values);

  await createSession(result.data.accessToken, result.data.expiresAt);
  // redirect() precisa ficar FORA de try/catch: ele funciona lançando um erro especial
  redirect(homeFor(result.data.user.role));
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}

// ---------------- Cadastros ----------------

/** Confere o "repita a senha" (a API só recebe a senha uma vez) */
function checkPasswordConfirmation(formData: FormData): Record<string, string> | null {
  if (formData.get("password") !== formData.get("confirmPassword")) {
    return { confirmPassword: "As senhas não são iguais" };
  }
  return null;
}

function commonFields(formData: FormData) {
  return {
    name: text(formData, "name"),
    email: text(formData, "email"),
    password: formData.get("password"),
    cpf: text(formData, "cpf"),
    birthDate: text(formData, "birthDate") || null,
    telephone: text(formData, "telephone"),
    gender: text(formData, "gender") || null,
    acceptTerms: formData.get("acceptTerms") === "on",
  };
}

export async function registerPatient(_state: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData);
  const mismatch = checkPasswordConfirmation(formData);
  if (mismatch) return { ok: false, message: "Revise os campos destacados.", errors: mismatch, values };

  const result = await api<Message>("/api/auth/register/patient", {
    method: "POST",
    body: { ...commonFields(formData), acceptHealthData: formData.get("acceptHealthData") === "on" },
  });
  if (!result.ok) return fromApiError(result.error, values);
  redirect(`/register/success?email=${encodeURIComponent(values.email ?? "")}`);
}

export async function registerProfessional(_state: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData);
  const mismatch = checkPasswordConfirmation(formData);
  if (mismatch) return { ok: false, message: "Revise os campos destacados.", errors: mismatch, values };

  const result = await api<Message>("/api/auth/register/professional", {
    method: "POST",
    body: {
      ...commonFields(formData),
      professionalType: text(formData, "professionalType") || null,
      documentProfessional: text(formData, "documentProfessional"),
      bio: text(formData, "bio") || null,
    },
  });
  if (!result.ok) return fromApiError(result.error, values);
  redirect(`/register/success?email=${encodeURIComponent(values.email ?? "")}&type=professional`);
}

// ---------------- E-mail e senha ----------------

export async function verifyEmail(_state: FormState, formData: FormData): Promise<FormState> {
  const result = await api<Message>("/api/auth/verify-email", {
    method: "POST",
    body: { token: text(formData, "token") },
  });
  if (!result.ok) return fromApiError(result.error);
  return { ok: true, message: result.data.message };
}

export async function resendVerification(_state: FormState, formData: FormData): Promise<FormState> {
  const values = { email: text(formData, "email") };
  const result = await api<Message>("/api/auth/resend-verification", { method: "POST", body: values });
  if (!result.ok) return fromApiError(result.error, values);
  return { ok: true, message: result.data.message, values };
}

export async function forgotPassword(_state: FormState, formData: FormData): Promise<FormState> {
  const values = { email: text(formData, "email") };
  const result = await api<Message>("/api/auth/forgot-password", { method: "POST", body: values });
  if (!result.ok) return fromApiError(result.error, values);
  return { ok: true, message: result.data.message, values };
}

export async function resetPassword(_state: FormState, formData: FormData): Promise<FormState> {
  if (formData.get("password") !== formData.get("confirmPassword")) {
    return { ok: false, message: "Revise os campos destacados.", errors: { confirmPassword: "As senhas não são iguais" } };
  }
  const result = await api<Message>("/api/auth/reset-password", {
    method: "POST",
    body: { token: text(formData, "token"), password: formData.get("password") },
  });
  if (!result.ok) return fromApiError(result.error);
  // Sessão antiga (se houver) deixa de valer: entra de novo com a senha nova
  await deleteSession();
  redirect("/login?reset=1");
}
