// =============================================================
// Testes de integração de PONTA A PONTA:
//   navegador -> Next.js -> API Java -> SQL Server
//                                  \-> e-mail (Mailpit)
//
// Precisam do back-end no ar: docker compose up -d --build
// Se a API ou o Mailpit não responderem, estes testes são pulados.
//
// Cada teste cria contas com e-mails únicos e, no fim, exclui essas contas
// pela API (os dados pessoais ficam anonimizados no banco).
// =============================================================

import { test, expect } from "@playwright/test";
import {
  backendIsUp,
  confirmEmail,
  deleteAccountViaApi,
  linkFromEmail,
  login,
  logout,
  PASSWORD,
  randomCpf,
  randomCrn,
  registerPatient,
  uniqueEmail,
} from "./helpers";

const created: string[] = [];

test.beforeAll(async () => {
  test.skip(!(await backendIsUp()), "API/Mailpit fora do ar: rode `docker compose up -d --build`");
});

test.afterAll(async () => {
  for (const email of created) await deleteAccountViaApi(email);
});

test("sem login, a área logada manda para o login", async ({ page }) => {
  for (const path of ["/dashboard", "/account", "/admin/professionals"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login$/);
  }
});

test("cadastro escolhe o tipo de conta", async ({ page }) => {
  await page.goto("/register");
  await page.getByRole("link", { name: /Sou paciente/ }).click();
  await expect(page).toHaveURL(/\/register\/patient$/);
  await page.goto("/register");
  await page.getByRole("link", { name: /Sou profissional/ }).click();
  await expect(page).toHaveURL(/\/register\/professional$/);
});

test("paciente: cadastro -> e-mail -> confirmação -> login -> editar conta -> sair", async ({ page }) => {
  const email = uniqueEmail("paciente");
  created.push(email);

  await registerPatient(page, email);

  // Antes de confirmar: login barrado, com opção de reenviar o e-mail
  await login(page, email);
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Confirme seu e-mail");
  await expect(page.getByRole("button", { name: "Reenviar e-mail de confirmação" })).toBeVisible();

  await confirmEmail(page, email);

  await login(page, email);
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Olá, Ana!" })).toBeVisible();
  // Paciente não vê nada de profissional nem de admin
  await expect(page.getByText("Perfil profissional")).toHaveCount(0);
  await page.goto("/admin/professionals");
  await expect(page).toHaveURL(/\/dashboard$/);

  // Logado, /login e /register levam para a área logada
  await page.goto("/login");
  await expect(page).toHaveURL(/\/dashboard$/);

  // Minha conta: CPF mascarado e edição
  await page.getByRole("link", { name: "Minha conta" }).click();
  await expect(page.getByText(/\*\*\*\.\d{3}\.\d{3}-\*\*/)).toBeVisible();
  await page.getByLabel("Nome completo").fill("Ana Maria Paciente");
  await page.getByRole("button", { name: "Salvar dados" }).click();
  await expect(page.getByRole("main").getByRole("status")).toContainText("Dados atualizados");

  await logout(page);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
});

test("cadastro mostra os erros da API no campo certo", async ({ page }) => {
  await page.goto("/register/patient");
  await page.getByLabel("Nome completo").fill("Ana Paciente");
  await page.getByLabel("E-mail").fill(uniqueEmail("invalido"));
  await page.getByLabel("CPF").fill("11111111111"); // CPF inválido
  await page.getByLabel("Celular").fill("11988887777");
  await page.getByLabel("Data de nascimento").fill("2015-01-01"); // menor de idade
  await page.getByLabel("Senha", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Repita a senha").fill("OutraSenha1");
  await page.getByLabel(/Li e aceito/).check();
  await page.getByLabel(/Autorizo o uso/).check();
  await page.getByRole("button", { name: "Criar conta" }).click();

  // Primeiro a confirmação de senha (conferida no Next)
  await expect(page.getByText("As senhas não são iguais")).toBeVisible();
  await expect(page.getByLabel("Nome completo")).toHaveValue("Ana Paciente"); // não apagou o que foi digitado

  await page.getByLabel("Senha", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Repita a senha").fill(PASSWORD);
  await page.getByRole("button", { name: "Criar conta" }).click();

  // Depois as regras da API, cada uma embaixo do seu campo
  await expect(page.getByText("CPF inválido")).toBeVisible();
  await expect(page.getByText("É preciso ter 18 anos ou mais", { exact: true })).toBeVisible();
  await expect(page.getByLabel("CPF")).toHaveAttribute("aria-invalid", "true");
});

test("profissional: 3 etapas -> confirmação -> em análise -> admin aprova -> aparece na busca", async ({ page }) => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  test.skip(!adminEmail || !adminPassword, "ADMIN_EMAIL/ADMIN_PASSWORD não configurados no .env");

  const email = uniqueEmail("profissional");
  const name = `Dra. Teste ${Date.now()}`;
  created.push(email);

  await page.goto("/register/professional");
  // Etapa 1
  await page.getByLabel("Nome completo").fill(name);
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Repita a senha").fill(PASSWORD);
  await page.getByRole("button", { name: "Continuar" }).click();
  // Etapa 2
  await expect(page.getByRole("heading", { name: /Etapa 2 de 3/ })).toBeFocused();
  await page.getByLabel("CPF").fill(randomCpf());
  await page.getByLabel("Celular").fill("11977776666");
  await page.getByLabel("Data de nascimento").fill("1985-07-01");
  await page.getByRole("button", { name: "Continuar" }).click();
  // Etapa 3: a escolha da profissão muda o campo para CRN
  await page.getByText("Nutricionista", { exact: true }).click();
  await page.getByLabel("Número do CRN").fill(randomCrn());
  await page.getByLabel(/Li e aceito/).check();
  await page.getByRole("button", { name: /Concluir cadastro/ }).click();
  await expect(page.getByText("nossa equipe vai verificar")).toBeVisible();

  await confirmEmail(page, email);
  await login(page, email);
  await expect(page.getByRole("heading", { name: "Cadastro: Em análise" })).toBeVisible();

  // Completa o perfil profissional (só PROFESSIONAL tem este formulário)
  await page.getByLabel("Bio").fill("Nutrição comportamental para adultos.");
  await page.getByLabel("Valor da consulta (R$)").fill("180,00");
  await page.getByRole("button", { name: "Salvar perfil" }).click();
  await expect(page.getByRole("main").getByRole("status")).toContainText("Perfil profissional atualizado");

  // Ainda não aparece na busca pública
  await page.goto("/professionals?type=NUTRICIONISTA");
  await expect(page.getByText(name)).toHaveCount(0);
  await page.goto("/dashboard");
  await logout(page);

  // Admin aprova
  await login(page, adminEmail!, adminPassword!);
  await expect(page).toHaveURL(/\/admin\/professionals$/);
  await page.getByRole("button", { name: `Aprovar ${name}` }).click();
  await expect(page.getByRole("button", { name: `Aprovar ${name}` })).toHaveCount(0);
  await logout(page);

  // Agora aparece na busca, sem dados pessoais
  await page.goto("/professionals?type=NUTRICIONISTA");
  const card = page.getByRole("listitem").filter({ hasText: name });
  await expect(card).toContainText("R$ 180,00");
  await expect(card).not.toContainText(email);
});

test("esqueci a senha -> link por e-mail -> nova senha -> login", async ({ page }) => {
  const email = uniqueEmail("senha");
  created.push(email);
  await registerPatient(page, email);
  await confirmEmail(page, email);

  await page.goto("/login");
  await page.getByRole("link", { name: "Esqueceu sua senha?" }).click();
  await page.getByLabel("E-mail").fill(email);
  await page.getByRole("button", { name: "Enviar link" }).click();
  await expect(page.getByRole("main").getByRole("status")).toContainText("Se houver uma conta");

  await page.goto(await linkFromEmail(email, "/reset-password"));
  await page.getByLabel("Nova senha", { exact: true }).fill("NovaSenha99");
  await page.getByLabel("Repita a nova senha").fill("NovaSenha99");
  await page.getByRole("button", { name: "Salvar nova senha" }).click();
  await expect(page.getByRole("main").getByRole("status")).toContainText("Senha alterada");

  await login(page, email, "NovaSenha99");
  await expect(page).toHaveURL(/\/dashboard$/);
  await logout(page);
  // Limpeza usa a senha nova
  await deleteAccountViaApi(email, "NovaSenha99");
});

test("excluir conta pela tela apaga o acesso", async ({ page }) => {
  const email = uniqueEmail("excluir");
  await registerPatient(page, email);
  await confirmEmail(page, email);
  await login(page, email);
  await expect(page).toHaveURL(/\/dashboard$/); // espera o login terminar (cookie gravado)

  await page.goto("/account");
  await page.getByRole("button", { name: "Quero excluir minha conta" }).click();
  await page.getByLabel('Digite "EXCLUIR" para confirmar').fill("EXCLUIR");
  await page.getByLabel("Sua senha").fill(PASSWORD);
  await page.getByRole("button", { name: "Excluir definitivamente" }).click();
  await expect(page).toHaveURL(/\/\?account-deleted=1$/);

  await login(page, email);
  await expect(page.getByRole("main").getByRole("alert")).toContainText("E-mail ou senha incorretos");
});
