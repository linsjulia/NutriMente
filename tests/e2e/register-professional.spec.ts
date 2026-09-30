// =============================================================
// Testes de integração: cadastro de profissional (3 etapas)
//
// Preenche o formulário como uma pessoa faria, usando os RÓTULOS dos
// campos (getByLabel). Se um label não estiver ligado ao campo certo
// (htmlFor/id), o teste falha — foi exatamente o bug corrigido aqui.
// =============================================================

import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("https://vlibras.gov.br/**", (route) => route.abort());
  await page.goto("/register");
});

test("página tem conteúdo principal para o 'Pular para o conteúdo'", async ({ page }) => {
  await expect(page.locator("main#conteudo")).toHaveCount(1);
});

test("fluxo completo usando os rótulos dos campos", async ({ page }) => {
  const continuar = page.getByRole("button", { name: /Continuar/ });

  // Etapa 1: botão só habilita com dados válidos
  await expect(continuar).toBeDisabled();
  await page.getByLabel("Nome Completo").fill("Maria Souza");
  await page.getByLabel("E-mail").fill("maria@exemplo.com");
  await page.getByLabel("Senha").fill("123456");
  await expect(continuar).toBeEnabled();
  await continuar.click();

  // O leitor de tela é avisado da troca de etapa
  await expect(page.getByText("Etapa 2 de 3", { exact: true })).toBeAttached();

  // Etapa 2: máscaras de telefone e CPF
  await page.getByLabel("Telefone").fill("11999998888");
  await expect(page.getByLabel("Telefone")).toHaveValue("(11) 99999-8888");
  await page.getByLabel("CPF").fill("12345678901");
  await expect(page.getByLabel("CPF")).toHaveValue("123.456.789-01");
  await page.getByLabel("Data de Nascimento").fill("1990-05-10");

  // Gênero: radios acessíveis por teclado dentro de um grupo rotulado
  const genero = page.getByRole("radiogroup", { name: "Gênero" });
  await expect(genero.getByRole("radio")).toHaveCount(2);
  await genero.getByLabel("Masculino").check();
  await expect(genero.getByLabel("Masculino")).toBeChecked();

  await continuar.click();

  // Etapa 3: escolha da profissão pelo teclado (Enter no botão)
  const psicologo = page.getByRole("button", { name: /Psicólogo/ });
  await psicologo.focus();
  await page.keyboard.press("Enter");
  await expect(psicologo).toHaveAttribute("aria-pressed", "true");

  await page.getByLabel("N° do CRP").fill("06/123456");
  await expect(page.getByRole("button", { name: /Concluir cadastro/ })).toBeEnabled();

  // Trocar de profissão limpa o número do conselho (CRP ≠ CRN)
  await page.getByRole("button", { name: /Nutricionista/ }).click();
  await expect(page.getByLabel("N° do CRN")).toHaveValue("");
  await expect(page.getByRole("button", { name: /Concluir cadastro/ })).toBeDisabled();
});
