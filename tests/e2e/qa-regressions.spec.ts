// =============================================================
// Regressões da revisão de QA (outubro/2026)
//
// Cada teste reproduz um problema encontrado na revisão, para garantir que
// ele não volte. Os que dependem do back-end são pulados se a API estiver fora.
// =============================================================

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
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
  reloadAndSettle,
  uniqueEmail,
} from "./helpers";

/** Todos os arquivos de código (recursivo) de uma pasta */
function sourceFiles(dir: string, exts = [".ts", ".tsx", ".mjs", ".css"]): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (name === "node_modules" || name.startsWith(".")) return [];
    if (statSync(full).isDirectory()) return sourceFiles(full, exts);
    return exts.some((e) => name.endsWith(e)) ? [full] : [];
  });
}

// Em 10/2026 imagens foram renomeadas/convertidas em public/ e o código
// continuou apontando para o nome antigo (foto quebrada na home, na página
// Sobre e nos perfis da demonstração). Este teste não precisa de navegador.
test("toda imagem citada no código existe em public/", () => {
  const ref = /["'`(](\/(?:doctor|patient|icons|logo|background|images?)\/[^"'`)\s]+\.(?:png|jpe?g|webp|svg|gif|avif))/g;
  const missing: string[] = [];
  for (const file of [...sourceFiles("app"), ...sourceFiles("database/demo")]) {
    for (const [, img] of readFileSync(file, "utf8").matchAll(ref)) {
      if (!existsSync(path.join("public", img))) missing.push(`${img} (em ${file})`);
    }
  }
  expect(missing).toEqual([]);
});

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

  test("área logada: item inexistente ou de outra conta mostra 404 com um só cabeçalho", async ({ page }) => {
    const email = uniqueEmail("naoencontrado");
    await registerPatient(page, email);
    await confirmEmail(page, email, { stayLoggedIn: true });
    for (const path of ["/plans/abc", "/appointments/999999", "/plans/999999"]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { name: "Não encontramos esta página" })).toBeVisible();
      // Antes vinha o cabeçalho do site público junto (dois "Sair")
      await expect(page.getByRole("button", { name: "Sair" })).toHaveCount(1);
      await expect(page.getByText("Revise os campos destacados")).toHaveCount(0);
    }
    await deleteAccountViaApi(email);
  });

  test("busca do cabeçalho filtra por nome, mostra o filtro real e não vaza no celular", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 740 });
    await page.goto("/patient");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Encontre seu profissional");
    // Visitante vê "Entrar" (antes aparecia o nome "Júlia" fixo para todos)
    await expect(page.getByText("Júlia")).toHaveCount(0);
    // Sem filtros de exemplo fixos
    await expect(page.getByText("Comer emocional")).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);

    await page.getByLabel("O que você procura?").fill("zzz-ninguem");
    await page.getByRole("button", { name: "Buscar", exact: true }).click();
    await expect(page).toHaveURL(/\/patient\?q=zzz-ninguem$/);
    await expect(page.getByText("Nenhum profissional encontrado com esses filtros.")).toBeVisible();
    await page.getByRole("link", { name: "Remover filtro “zzz-ninguem”" }).click();
    await expect(page).toHaveURL(/\/patient$/);
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
    await reloadAndSettle(page, page.getByLabel("Valor da consulta (R$)"));
    await expect(page.getByLabel("Valor da consulta (R$)")).toHaveValue("1.000,50");

    await page.getByLabel("Valor da consulta (R$)").fill("abc");
    await page.getByRole("button", { name: "Salvar perfil" }).click();
    await expect(page.getByText("Valor inválido. Use só números")).toBeVisible();
    await expect(page.getByLabel("Valor da consulta (R$)")).toBeFocused();
    await reloadAndSettle(page, page.getByLabel("Valor da consulta (R$)"));
    await expect(page.getByLabel("Valor da consulta (R$)")).toHaveValue("1.000,50"); // não apagou
    await deleteAccountViaApi(email);
  });
});
