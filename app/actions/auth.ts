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
import {
  createSession,
  deleteRegistrationTicket,
  deleteSession,
  getRegistrationTicket,
  homeFor,
  saveRegistrationTicket,
  type Role,
} from "@/app/lib/session";
import { fromApiError, formValues, text, type FormState } from "@/app/lib/form";

type LoginResponse = { accessToken: string; expiresAt: string; user: { id: number; name: string; role: Role } };
type Message = { message: string };
type RegisterResponse = { message: string; registrationTicket: string };
type VerifyEmailResponse = LoginResponse & { message: string };

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
  redirect(safeNext(text(formData, "next")) ?? homeFor(result.data.user.role));
}

/**
 * Só aceita voltar para páginas DESTE site ("/account", "/dashboard?x=1").
 * "//site.com" ou "https://site.com" seriam um redirecionamento aberto:
 * alguém mandaria um link de login do NutriMente que, depois de entrar,
 * leva a vítima para um site falso.
 */
function safeNext(next: string): string | null {
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\") || next.startsWith("/login")) return null;
  return next;
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

  const result = await api<RegisterResponse>("/api/auth/register/patient", {
    method: "POST",
    body: { ...commonFields(formData), acceptHealthData: formData.get("acceptHealthData") === "on" },
  });
  if (!result.ok) return fromApiError(result.error, values);
  await saveRegistrationTicket(result.data.registrationTicket);
  redirect(`/register/success?email=${encodeURIComponent(values.email ?? "")}`);
}

export async function registerProfessional(_state: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData);
  const mismatch = checkPasswordConfirmation(formData);
  if (mismatch) return { ok: false, message: "Revise os campos destacados.", errors: mismatch, values };

  const result = await api<RegisterResponse>("/api/auth/register/professional", {
    method: "POST",
    body: {
      ...commonFields(formData),
      professionalType: text(formData, "professionalType") || null,
      documentProfessional: text(formData, "documentProfessional"),
      bio: text(formData, "bio") || null,
    },
  });
  if (!result.ok) return fromApiError(result.error, values);
  await saveRegistrationTicket(result.data.registrationTicket);
  redirect(`/register/success?email=${encodeURIComponent(values.email ?? "")}&type=professional`);
}

// ---------------- E-mail e senha ----------------

/** Confirma o e-mail e já entra: quem abriu o link provou que é dono do e-mail */
export async function verifyEmail(_state: FormState, formData: FormData): Promise<FormState> {
  const result = await api<VerifyEmailResponse>("/api/auth/verify-email", {
    method: "POST",
    body: { token: text(formData, "token") },
  });
  if (!result.ok) return fromApiError(result.error);

  await createSession(result.data.accessToken, result.data.expiresAt);
  await deleteRegistrationTicket();
  redirect(`${homeFor(result.data.user.role)}?emailConfirmado=1`);
}

export type RegistrationStatus = { status: "pending" } | { status: "done"; href: string } | { status: "none" };

/**
 * A tela "Confirme seu e-mail" chama a cada poucos segundos. Quando a pessoa
 * confirma (em qualquer aparelho), o ticket deste navegador vira uma sessão.
 */
export async function checkRegistration(): Promise<RegistrationStatus> {
  const ticket = await getRegistrationTicket();
  if (!ticket) return { status: "none" };

  const result = await api<LoginResponse | undefined>("/api/auth/registration-session", {
    method: "POST",
    body: { ticket },
  });
  if (!result.ok) {
    // 400: ticket usado ou vencido. Outro erro (API fora do ar): tenta de novo depois
    if (result.error.status !== 400) return { status: "pending" };
    await deleteRegistrationTicket();
    return { status: "none" };
  }
  if (!result.data) return { status: "pending" };

  await createSession(result.data.accessToken, result.data.expiresAt);
  await deleteRegistrationTicket();
  return { status: "done", href: `${homeFor(result.data.user.role)}?emailConfirmado=1` };
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
