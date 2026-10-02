// =============================================================
// Especialidades (Etapa 2)
//   - profissional escolhe até 5 no painel
//   - paciente filtra a busca por especialidade
//   - admin cadastra e remove especialidades
// Precisam do back-end no ar; são pulados se a API estiver fora.
// =============================================================

import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {
  backendIsUp,
  confirmEmail,
  deleteAccountViaApi,
  login,
  logout,
  PASSWORD,
  randomCpf,
  randomCrn,
  uniqueEmail,
} from "./helpers";

const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;

test.beforeAll(async () => {
  test.skip(!(await backendIsUp()), "API/Mailpit fora do ar: rode `docker compose up -d --build`");
});

/** Nome só com letras (a API recusa números), diferente a cada execução */
function uniqueName(prefix: string) {
  const letters = Array.from({ length: 8 }, () => String.fromCharCode(97 + Math.floor(Math.random() * 26))).join("");
  return `${prefix} ${letters[0].toUpperCase()}${letters.slice(1)}`;
}

async function registerNutritionist(page: Page, email: string, name: string) {
  await page.goto("/register/professional");
  await page.getByLabel("Nome completo").fill(name);
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
}

test("profissional escolhe especialidades (limite de 5) e o paciente filtra a busca por elas", async ({ page }) => {
  test.skip(!adminEmail || !adminPassword, "ADMIN_EMAIL/ADMIN_PASSWORD não configurados no .env");
  const email = uniqueEmail("especialidade");
  const name = uniqueName("Dra. Especialista");
  await registerNutritionist(page, email, name);
  await login(page, email);
  await expect(page).toHaveURL(/\/dashboard$/);

  const specialties = page.getByRole("group", { name: "Especialidades" });
  await expect(specialties).toBeVisible();
  // Só especialidades de nutrição aparecem para nutricionista
  await expect(specialties.getByLabel("Nutrição Esportiva")).toBeVisible();
  await expect(specialties.getByLabel("Ansiedade")).toHaveCount(0);

  // Clica na "pílula" (o label), como a pessoa faz: o checkbox em si fica escondido
  const pills = specialties.locator("label.chip");
  const boxes = specialties.getByRole("checkbox");

  // Limite: com 5 marcadas, as outras ficam desabilitadas
  for (let i = 0; i < 5; i++) await pills.nth(i).click();
  await expect(specialties.getByText("5 de 5 escolhidas")).toBeVisible();
  await expect(boxes.nth(5)).toBeDisabled();
  for (let i = 1; i < 5; i++) await pills.nth(i).click();
  await expect(specialties.getByText("1 de 5 escolhidas")).toBeVisible();

  // Fica com duas: a primeira e "Nutrição Esportiva"
  await specialties.locator("label.chip", { hasText: "Nutrição Esportiva" }).click();
  const first = (await boxes.nth(0).getAttribute("id"))!;
  await page.getByRole("button", { name: "Salvar perfil" }).click();
  await expect(page.getByRole("main").getByRole("status")).toContainText("Perfil profissional atualizado");
  await page.reload();
  await expect(page.locator(`#${first}`)).toBeChecked();
  await expect(specialties.getByLabel("Nutrição Esportiva")).toBeChecked();
  await expect(specialties.getByText("2 de 5 escolhidas")).toBeVisible();

  // Acessibilidade do painel com a escolha de especialidades
  const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(axe.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
  await logout(page);

  // Admin aprova
  await login(page, adminEmail!, adminPassword!);
  await page.getByRole("button", { name: `Aprovar ${name}` }).click();
  await expect(page.getByRole("button", { name: `Aprovar ${name}` })).toHaveCount(0);
  await logout(page);

  // Paciente (visitante) filtra por especialidade
  await page.goto("/professionals?type=NUTRICIONISTA");
  await page.getByLabel("Especialidade", { exact: true }).selectOption({ label: "Nutrição Esportiva" });
  await page.getByRole("button", { name: "Filtrar" }).click();
  await expect(page).toHaveURL(/specialty=\d+/);
  const card = page.getByRole("listitem").filter({ hasText: name });
  await expect(card).toBeVisible();
  await expect(card.getByRole("list", { name: "Especialidades" })).toContainText("Nutrição Esportiva");

  // Outra especialidade (que ele não marcou): não aparece
  await page.getByLabel("Especialidade", { exact: true }).selectOption({ label: "Vegetarianismo e Veganismo" });
  await page.getByRole("button", { name: "Filtrar" }).click();
  await expect(page.getByRole("listitem").filter({ hasText: name })).toHaveCount(0);

  await deleteAccountViaApi(email);
});

test("admin cadastra e remove especialidade", async ({ page }) => {
  test.skip(!adminEmail || !adminPassword, "ADMIN_EMAIL/ADMIN_PASSWORD não configurados no .env");
  const specialty = uniqueName("Teste");

  await login(page, adminEmail!, adminPassword!);
  await page.getByRole("navigation", { name: "Área logada" }).getByRole("link", { name: "Especialidades" }).click();
  await expect(page).toHaveTitle("Especialidades | NutriMente");

  // Sem preencher: erros nos campos, foco no primeiro
  await page.getByRole("button", { name: "Cadastrar especialidade" }).click();
  await expect(page.getByLabel("Nome da especialidade")).toBeFocused();

  await page.getByLabel("Nome da especialidade").fill(specialty);
  await page.getByLabel("Profissão").selectOption("PSICOLOGO");
  await page.getByRole("button", { name: "Cadastrar especialidade" }).click();
  await expect(page.getByRole("main").getByRole("status")).toContainText(`"${specialty}" cadastrada`);
  const psychology = page.getByRole("region", { name: /Psicólogo/ });
  await expect(psychology.getByText(specialty, { exact: true })).toBeVisible();

  // Repetida: conflito no campo
  await page.getByLabel("Nome da especialidade").fill(specialty.toLowerCase());
  await page.getByLabel("Profissão").selectOption("PSICOLOGO");
  await page.getByRole("button", { name: "Cadastrar especialidade" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Essa especialidade já existe para esta profissão");
  await expect(page.getByLabel("Nome da especialidade")).toHaveAttribute("aria-invalid", "true");

  // Aparece no filtro público
  await page.goto("/professionals?type=PSICOLOGO");
  await expect(page.getByLabel("Especialidade", { exact: true }).locator("option", { hasText: specialty })).toHaveCount(1);

  // Remover pede confirmação
  await page.goto("/admin/specialties");
  const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(axe.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
  await page.locator(`summary[aria-label="Remover ${specialty}"]`).click();
  await page.getByRole("button", { name: "Confirmar remoção" }).filter({ visible: true }).click();
  await expect(psychology.getByText(specialty, { exact: true })).toHaveCount(0);
});
