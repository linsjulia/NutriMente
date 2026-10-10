// =============================================================
// Telas de agenda e acompanhamento (paciente e profissional):
//   - perfil do profissional → agendar com triagem → consulta;
//   - profissional vê a triagem, confirma e cancela;
//   - profissional cria plano; paciente marca o checklist;
//   - questionário inicial, diário com foto e ficha do paciente.
//
// Para ser rápido, os usuários são criados pela API (cadastro + confirmação
// de e-mail pelo Mailpit + aprovação do admin); as TELAS são testadas como
// uma pessoa usaria. Cada teste apaga as contas que criou.
// =============================================================

import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { API_URL, PASSWORD, backendIsUp, deleteAccountViaApi, linkFromEmail, login, randomCpf, randomCrn, uniqueEmail } from "./helpers";

const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;
const created: string[] = [];

test.beforeAll(async () => {
  test.skip(!(await backendIsUp()), "API/Mailpit fora do ar: rode `docker compose up -d --build`");
  test.skip(!adminEmail || !adminPassword, "ADMIN_EMAIL/ADMIN_PASSWORD não configurados no .env");
});

test.afterAll(async () => {
  for (const email of created) await deleteAccountViaApi(email);
});

async function apiCall(method: string, path: string, token?: string, body?: unknown) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path}: ${res.status} ${text}`);
  return text ? JSON.parse(text) : null;
}

const apiLogin = async (email: string, password = PASSWORD) =>
  (await apiCall("POST", "/api/auth/login", undefined, { email, password })).accessToken as string;

/** Cadastro pela API + confirmação do e-mail (link que chegou no Mailpit) */
async function createVerified(kind: "patient" | "professional", name: string) {
  const email = uniqueEmail(kind);
  const base = { name, email, password: PASSWORD, cpf: randomCpf(), birthDate: "1990-05-10", telephone: "11988887777", acceptTerms: true };
  await apiCall(
    "POST",
    `/api/auth/register/${kind}`,
    undefined,
    kind === "patient"
      ? { ...base, acceptHealthData: true }
      : { ...base, professionalType: "NUTRICIONISTA", documentProfessional: randomCrn(), bio: "Atendo adultos." },
  );
  created.push(email);
  const link = await linkFromEmail(email, "/verify-email");
  await apiCall("POST", "/api/auth/verify-email", undefined, { token: new URL(link, "http://x").searchParams.get("token") });
  return { email, token: await apiLogin(email), id: (await apiCall("GET", "/api/me", await apiLogin(email))).id as number };
}

/** Nutricionista aprovada, que atende online e presencial, com agenda aberta todos os dias */
async function readyProfessional(name: string) {
  const pro = await createVerified("professional", name);
  await apiCall("PUT", "/api/me/professional-profile", pro.token, {
    consultationPrice: 150,
    telehealthRegistered: true,
    officeAddress: "Rua das Flores, 100 - Centro",
    officeCity: "São Paulo",
    officeState: "SP",
  });
  const windows = Array.from({ length: 7 }, (_, d) => ({ dayOfWeek: d, startTime: "00:00", endTime: "23:59" }));
  await apiCall("PUT", "/api/me/availability", pro.token, { windows });
  const admin = await apiLogin(adminEmail!, adminPassword!);
  await apiCall("PATCH", `/api/admin/professionals/${pro.id}/verification`, admin, { status: "APPROVED" });
  return pro;
}

async function expectAccessible(page: Page) {
  const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(axe.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
}

/** Espera a página trocar o "Carregando..." pelo conteúdo */
const settle = (page: Page) => expect(page.locator("h1")).toHaveCount(1);

/** Sobrenome aleatório só com letras (a API recusa nomes com números) */
const letters = () => Array.from({ length: 6 }, () => String.fromCharCode(97 + Math.floor(Math.random() * 26))).join("");

test("paciente agenda com triagem pelo perfil; profissional vê a triagem, confirma e cancela", async ({ browser }) => {
  const suffix = letters();
  const pro = await readyProfessional(`Camila ${suffix[0].toUpperCase()}${suffix.slice(1)}`);
  const patient = await createVerified("patient", "Ana Paciente");

  // Paciente: busca → perfil → agendar presencial com triagem
  const ana = await (await browser.newContext()).newPage();
  await login(ana, patient.email);
  await expect(ana).toHaveURL(/\/dashboard$/);
  await ana.goto(`/professionals/${pro.id}`);
  await settle(ana);
  await expect(ana.getByText("Presencial em São Paulo/SP")).toBeVisible();
  await expectAccessible(ana);
  await ana.getByLabel("Dia").selectOption({ index: 1 });
  await ana.locator('input[name="startsAt"]').first().check({ force: true });
  await ana.getByLabel("Presencial").check();
  await ana.getByText("Contar ao profissional como você está").click();
  await ana.getByLabel("Motivo da consulta").fill("Quero organizar os lanches.");
  await ana.getByLabel("Bem", { exact: true }).check();
  await ana.getByRole("button", { name: "Agendar consulta" }).click();
  await expect(ana).toHaveURL(/\/appointments\/\d+\?agendada=1$/);
  await expect(ana.getByRole("status")).toContainText("Consulta agendada!");
  await expect(ana.getByText("Rua das Flores, 100 - Centro, São Paulo/SP")).toBeVisible();
  const appointmentUrl = new URL(ana.url()).pathname;
  await expectAccessible(ana);

  // Profissional: notificação, triagem, confirmar
  const camila = await (await browser.newContext()).newPage();
  await login(camila, pro.email);
  await expect(camila.getByRole("link", { name: /Notificações: \d+ não lidas/ })).toBeVisible();
  await camila.goto(appointmentUrl);
  await settle(camila);
  await expect(camila.getByText("Quero organizar os lanches.")).toBeVisible();
  await camila.getByRole("button", { name: "Confirmar consulta" }).click();
  await expect(camila.getByRole("status")).toContainText("Consulta confirmada.");

  // Paciente vê "Confirmada" na lista
  await ana.goto("/appointments");
  await settle(ana);
  await expect(ana.getByText("Confirmada")).toBeVisible();
  await expectAccessible(ana);

  // Profissional cancela (com confirmação na própria tela)
  await camila.reload();
  await settle(camila);
  await camila.getByText("Cancelar consulta").click();
  await camila.getByRole("button", { name: "Confirmar cancelamento" }).click();
  await expect(camila.getByRole("status")).toContainText("Consulta cancelada.");
});

test("acompanhamento: questionário e diário com foto; profissional cria plano e vê a ficha; paciente marca o checklist", async ({ browser }) => {
  const suffix = letters();
  const pro = await readyProfessional(`Helena ${suffix[0].toUpperCase()}${suffix.slice(1)}`);
  const patient = await createVerified("patient", "Bruna Paciente");
  // Uma consulta liga os dois (sem ela, o profissional não vê o paciente)
  const slots = await apiCall("GET", `/api/professionals/${pro.id}/slots?days=3`);
  const startsAt = slots.flatMap((d: { slots: { startsAt: string }[] }) => d.slots)[2].startsAt;
  await apiCall("POST", "/api/appointments", patient.token, { professionalId: pro.id, startsAt, modality: "ONLINE" });

  // Paciente: aviso do questionário → responde
  const bruna = await (await browser.newContext()).newPage();
  await login(bruna, patient.email);
  await expect(bruna.getByRole("heading", { name: "Conte um pouco sobre você" })).toBeVisible();
  await bruna.getByRole("link", { name: "Responder questionário" }).click();
  await settle(bruna);
  await expectAccessible(bruna);
  await bruna.getByLabel("Dormir melhor").check();
  await bruna.getByLabel("Refeições por dia").fill("4");
  await bruna.getByLabel("Água por dia (litros)").fill("1,5");
  await bruna.getByLabel("Leve (1 a 2 vezes por semana)").check();
  await bruna.locator('input[name="sleepQuality"][value="2"]').check();
  await bruna.locator('input[name="stressLevel"][value="4"]').check();
  await bruna.getByRole("button", { name: "Salvar respostas" }).click();
  await expect(bruna).toHaveURL(/\/dashboard\?questionario=1$/);
  await expect(bruna.getByRole("heading", { name: "Conte um pouco sobre você" })).toHaveCount(0);

  // Paciente: diário com foto (a foto passa pela rota do site, que põe o token)
  await bruna.goto("/diary");
  await settle(bruna);
  await bruna.getByLabel("Refeição", { exact: true }).selectOption("ALMOCO");
  await bruna.getByLabel("O que você comeu?").fill("Arroz, feijão e salada");
  await bruna.getByLabel(/^Foto/).setInputFiles("public/icons/apple.png");
  await bruna.getByRole("button", { name: "Registrar refeição" }).click();
  await expect(bruna.getByRole("status")).toContainText("Refeição registrada.");
  const photo = bruna.getByRole("img", { name: "Foto: Arroz, feijão e salada" });
  await expect(photo).toBeVisible();
  await expect.poll(() => photo.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  await expectAccessible(bruna);

  // Profissional: ficha da paciente → cria plano
  const helena = await (await browser.newContext()).newPage();
  await login(helena, pro.email);
  await helena.getByRole("link", { name: "Pacientes" }).click();
  await helena.getByRole("link", { name: /Bruna Paciente/ }).click();
  await settle(helena);
  await expect(helena.getByText("Dormir melhor")).toBeVisible();
  await expect(helena.getByRole("img", { name: "Foto: Arroz, feijão e salada" })).toBeVisible();
  await expectAccessible(helena);
  await helena.getByRole("link", { name: "Criar plano" }).click();
  await settle(helena);
  await helena.getByLabel("Título").fill("Rotina do sono e alimentação");
  await helena.getByLabel("Meta 1", { exact: true }).fill("Dormir 7 horas");
  await helena.getByLabel("Tarefa 1", { exact: true }).fill("Jantar até as 20h");
  await helena.getByRole("button", { name: "Criar plano" }).click();
  await expect(helena).toHaveURL(/\/plans\/\d+$/);
  await settle(helena);
  const planUrl = new URL(helena.url()).pathname;
  await expectAccessible(helena);

  // Paciente marca o checklist de hoje
  await bruna.goto(planUrl);
  await settle(bruna);
  const checklist = bruna.getByRole("heading", { name: /Checklist de hoje/ });
  await expect(checklist).toContainText("(0/1)");
  await bruna.getByRole("button", { name: /Jantar até as 20h/ }).click();
  await expect(checklist).toContainText("(1/1)");
});
