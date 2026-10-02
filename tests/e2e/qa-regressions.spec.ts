// =============================================================
// Regressões da revisão de QA (outubro/2026)
//
// Cada teste reproduz um problema encontrado na revisão, para garantir que
// ele não volte. Os que dependem do back-end são pulados se a API estiver fora.
// =============================================================

import { test, expect } from "@playwright/test";
import {
  backendIsUp,
  confirmEmail,
  deleteAccountViaApi,
  login,
  PASSWORD,
  randomCpf,
  randomCrn,
  registerPatient,
  uniqueEmail,
} from "./helpers";

test.describe("sem back-end", () => {
  for (const width of [414, 1024]) {
    test(`home termina de carregar em ${width}px (carrossel não trava)`, async ({ browser }) => {
      // Aba nova, como a primeira visita de alguém
      const context = await browser.newContext({ viewport: { width, height: 800 } });
      const page = await context.newPage();
      await page.goto("/", { waitUntil: "load", timeout: 15_000 });
      await context.close();
    });
  }

  test("404 tem cabeçalho e rodapé", async ({ page }) => {
    await page.goto("/pagina-que-nao-existe");
    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.getByRole("contentinfo")).toBeVisible();
  });

  test("páginas públicas têm rodapé e um único h1", async ({ page }) => {
    for (const path of ["/", "/professionals", "/about", "/terms", "/privacy"]) {
      await page.goto(path);
      await expect(page.getByRole("contentinfo"), path).toBeVisible();
      await expect(page.locator("h1"), path).toHaveCount(1);
    }
  });

  test("menu público usa 'Início' (como a área logada)", async ({ page }) => {
    await page.goto("/about");
    await expect(page.getByRole("navigation", { name: "Navegação principal" }).getByRole("link", { name: "Início" })).toBeVisible();
  });

  test("aba de 'Esqueci minha senha' tem título próprio", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page).toHaveTitle("Esqueci minha senha | NutriMente");
  });
});

test.describe("com back-end", () => {
  test.beforeAll(async () => {
    test.skip(!(await backendIsUp()), "API/Mailpit fora do ar: rode `docker compose up -d --build`");
  });

  test("cadastro com erro leva o foco ao primeiro campo errado", async ({ page }) => {
    await page.goto("/register/patient");
    await page.getByRole("button", { name: "Criar conta" }).click();
    await expect(page.getByLabel("Nome completo")).toBeFocused();
    await expect(page.getByLabel("Nome completo")).toHaveAttribute("aria-invalid", "true");
  });

  test("API recusa nome com números e mostra a regra no campo", async ({ page }) => {
    await page.goto("/register/patient");
    await page.getByLabel("Nome completo").fill("Ana 123");
    await page.getByRole("button", { name: "Criar conta" }).click();
    await expect(page.getByText("Informe nome e sobrenome, usando só letras")).toBeVisible();
  });

  test("sessão: depois do login volta para a página que a pessoa queria", async ({ page }) => {
    const email = uniqueEmail("next");
    await registerPatient(page, email);
    await confirmEmail(page, email);

    await page.goto("/account");
    await expect(page).toHaveURL(/\/login\?next=%2Faccount$/);
    await expect(page.getByRole("main").getByRole("status")).toContainText("Entre para continuar");
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Senha", { exact: true }).fill(PASSWORD);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/account$/);
    await deleteAccountViaApi(email);
  });

  test("login não redireciona para fora do site (?next=//site-falso)", async ({ page }) => {
    const email = uniqueEmail("redirect");
    await registerPatient(page, email);
    await confirmEmail(page, email);
    await page.goto("/login?next=//site-falso.com");
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Senha", { exact: true }).fill(PASSWORD);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/localhost:\d+\/dashboard$/);
    await deleteAccountViaApi(email);
  });

  test("valor da consulta aceita formato brasileiro e recusa texto sem apagar o preço", async ({ page }) => {
    const email = uniqueEmail("preco");
    await page.goto("/register/professional");
    await page.getByLabel("Nome completo").fill("Carla Preço Teste");
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Senha", { exact: true }).fill(PASSWORD);
    await page.getByLabel("Repita a senha").fill(PASSWORD);
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.getByLabel("CPF").fill(randomCpf());
    await page.getByLabel("Celular").fill("11977776666");
    await page.getByLabel("Data de nascimento").fill("1985-07-01");
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.getByText("Nutricionista", { exact: true }).click();
    await page.getByLabel("Número do CRN").fill(randomCrn());
    await page.getByLabel(/Li e aceito/).check();
    await page.getByRole("button", { name: /Concluir cadastro/ }).click();
    await expect(page.getByText("nossa equipe vai verificar")).toBeVisible();
    await confirmEmail(page, email);
    await login(page, email);
    await expect(page).toHaveURL(/\/dashboard$/);

    const price = page.getByLabel("Valor da consulta (R$)");
    await price.fill("1.000,50");
    await page.getByRole("button", { name: "Salvar perfil" }).click();
    await expect(page.getByRole("main").getByRole("status")).toContainText("Perfil profissional atualizado");
    await page.reload();
    await expect(page.getByLabel("Valor da consulta (R$)")).toHaveValue("1.000,50");

    await page.getByLabel("Valor da consulta (R$)").fill("abc");
    await page.getByRole("button", { name: "Salvar perfil" }).click();
    await expect(page.getByText("Valor inválido. Use só números")).toBeVisible();
    await expect(page.getByLabel("Valor da consulta (R$)")).toBeFocused();
    await page.reload();
    await expect(page.getByLabel("Valor da consulta (R$)")).toHaveValue("1.000,50"); // não apagou
    await deleteAccountViaApi(email);
  });
});
