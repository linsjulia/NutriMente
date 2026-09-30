// Utilidades dos testes de ponta a ponta (front + API + banco + e-mail).

import { expect, type Page } from "@playwright/test";

export const API_URL = process.env.API_URL ?? "http://localhost:8080";
export const MAILPIT_URL = process.env.MAILPIT_URL ?? `http://localhost:${process.env.MAILPIT_UI_PORT ?? 8025}`;
export const PASSWORD = "Senha1234";

/** A API e o Mailpit estão no ar? (se não, os testes de fluxo são pulados) */
export async function backendIsUp() {
  try {
    const [api, mail] = await Promise.all([fetch(`${API_URL}/actuator/health`), fetch(`${MAILPIT_URL}/api/v1/info`)]);
    return api.ok && mail.ok;
  } catch {
    return false;
  }
}

export const uniqueEmail = (prefix: string) => `e2e-${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@teste.local`;

/** CPF válido e aleatório (com os dígitos verificadores certos) */
export function randomCpf() {
  const d = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
  const check = (length: number) => {
    const sum = d.slice(0, length).reduce((acc, digit, i) => acc + digit * (length + 1 - i), 0);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  d.push(check(9));
  d.push(check(10));
  return d.join("");
}

export const randomCrn = () => `${1 + Math.floor(Math.random() * 9)}-${10000 + Math.floor(Math.random() * 89999)}`;

/**
 * Espera o e-mail chegar no Mailpit e devolve o link que está nele.
 * O Mailpit guarda todos os e-mails que a API envia em desenvolvimento.
 */
export async function linkFromEmail(to: string, path: "/verify-email" | "/reset-password") {
  for (let attempt = 0; attempt < 30; attempt++) {
    const search = await fetch(`${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}`).then((r) => r.json());
    for (const message of search.messages ?? []) {
      const full = await fetch(`${MAILPIT_URL}/api/v1/message/${message.ID}`).then((r) => r.json());
      const match = String(full.Text).match(new RegExp(`https?://[^\\s]+${path}\\?token=[\\w-]+`));
      if (match) return new URL(match[0]).pathname + new URL(match[0]).search;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`E-mail com ${path} não chegou para ${to}`);
}

export async function login(page: Page, email: string, password = PASSWORD) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
}

export async function logout(page: Page) {
  await page.getByRole("button", { name: "Sair" }).click();
  await expect(page).toHaveURL(/\/login$/);
}

/** Preenche o cadastro de paciente e envia */
export async function registerPatient(page: Page, email: string, name = "Ana Paciente") {
  await page.goto("/register/patient");
  await page.getByLabel("Nome completo").fill(name);
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("CPF").fill(randomCpf());
  await page.getByLabel("Celular").fill("11988887777");
  await page.getByLabel("Data de nascimento").fill("1992-03-15");
  await page.getByText("Prefiro não informar").click();
  await page.getByLabel("Senha", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Repita a senha").fill(PASSWORD);
  await page.getByLabel(/Li e aceito/).check();
  await page.getByLabel(/Autorizo o uso dos meus dados de saúde/).check();
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page.getByRole("heading", { name: "Confirme seu e-mail" })).toBeVisible();
}

/** Abre o link do e-mail e confirma */
export async function confirmEmail(page: Page, email: string) {
  await page.goto(await linkFromEmail(email, "/verify-email"));
  await page.getByRole("button", { name: "Confirmar meu e-mail" }).click();
  await expect(page.getByRole("heading", { name: "E-mail confirmado!" })).toBeVisible();
}

/** Limpeza: exclui a conta pela API (os dados pessoais são anonimizados) */
export async function deleteAccountViaApi(email: string, password = PASSWORD) {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) return;
  const { accessToken } = await res.json();
  await fetch(`${API_URL}/api/me`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ password }),
  });
}
