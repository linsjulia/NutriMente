// =============================================================
// Testes de integração: menu de acessibilidade
//
// Cada test() é um cenário independente: o Playwright abre uma aba nova
// (com localStorage limpo) para cada um.
//
// Dica: encontramos elementos pelo PAPEL e NOME acessível
// (getByRole("button", { name: "..." })), do mesmo jeito que um leitor de
// tela encontra. Se o teste não acha o botão, provavelmente uma pessoa
// cega também não acharia. Isso faz o teste checar a acessibilidade de graça.
// =============================================================

import { test, expect, Page } from "@playwright/test";

async function openMenu(page: Page) {
  await page.getByRole("button", { name: "Menu de acessibilidade", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Acessibilidade" })).toBeVisible();
}

const html = (page: Page) => page.locator("html");

test("página está em português e o 1º Tab vai para 'Pular para o conteúdo'", async ({ page }) => {
  await page.goto("/");
  await expect(html(page)).toHaveAttribute("lang", "pt-BR");

  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "Pular para o conteúdo principal" });
  await expect(skipLink).toBeFocused();

  // Ao ativar, o foco/URL vai para o conteúdo principal
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#conteudo$/);
});

test("Alt + A abre o menu e Esc fecha devolvendo o foco", async ({ page }) => {
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Menu de acessibilidade", exact: true });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");

  await page.keyboard.press("Alt+a");
  await expect(page.getByRole("dialog", { name: "Acessibilidade" })).toBeVisible();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(toggle).toBeFocused();
});

test("aumentar e diminuir o tamanho do texto", async ({ page }) => {
  await page.goto("/");
  await openMenu(page);

  const fontSize = () => page.evaluate(() => getComputedStyle(document.documentElement).fontSize);
  expect(await fontSize()).toBe("16px");

  await page.getByRole("button", { name: "Aumentar" }).click();
  await expect(page.getByText("Tamanho do texto: 115%")).toBeVisible();
  expect(await fontSize()).toBe("18.4px");

  await page.getByRole("button", { name: "Diminuir" }).click();
  expect(await fontSize()).toBe("16px");
  // No mínimo, "Diminuir" fica desabilitado
  await expect(page.getByRole("button", { name: "Diminuir" })).toBeDisabled();
});

test('botão "Alto contraste" liga e desliga', async ({ page }) => {
  await page.goto("/");
  await openMenu(page);
  const button = page.getByRole("button", { name: /Alto contraste/ });

  await button.click();
  await expect(button).toHaveAttribute("aria-pressed", "true");
  await expect(html(page)).toHaveAttribute("data-a11y-contrast", "high");
  // O leitor de tela é avisado da mudança
  await expect(page.getByText("Alto contraste ativado")).toBeAttached();

  await button.click();
  await expect(button).toHaveAttribute("aria-pressed", "false");
  await expect(html(page)).not.toHaveAttribute("data-a11y-contrast", "high");
});

test("o menu tem só as opções usadas agora: tamanho do texto e contraste", async ({ page }) => {
  await page.goto("/");
  await openMenu(page);
  const dialog = page.getByRole("dialog", { name: "Acessibilidade" });
  await expect(dialog.getByRole("button", { name: "Aumentar" })).toBeVisible();
  await expect(dialog.getByRole("button", { name: /Alto contraste/ })).toBeVisible();
  await expect(dialog.getByRole("button", { name: /Texto legível|Destacar links|Pausar animações|Cursor grande/ })).toHaveCount(0);
});

test("alto contraste deixa o fundo preto", async ({ page }) => {
  await page.goto("/");
  await openMenu(page);
  await page.getByRole("button", { name: /Alto contraste/ }).click();

  const background = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(background).toBe("rgb(0, 0, 0)");
});

test("preferências continuam depois de recarregar a página, sem erro de hidratação", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/");
  await openMenu(page);
  await page.getByRole("button", { name: "Aumentar" }).click();
  await page.getByRole("button", { name: /Alto contraste/ }).click();

  await page.reload();
  // O script inline do <head> aplica antes do React carregar
  await expect(html(page)).toHaveAttribute("data-a11y-contrast", "high");
  await expect(html(page)).toHaveAttribute("data-a11y-font", "1");

  // "Restaurar padrão" limpa tudo
  await openMenu(page);
  await page.getByRole("button", { name: "Restaurar padrão" }).click();
  await expect(html(page)).not.toHaveAttribute("data-a11y-contrast", "high");
  await expect(html(page)).not.toHaveAttribute("data-a11y-font", "1");

  expect(errors).toEqual([]);
});

test("carrossel tem botão para pausar e continuar (WCAG 2.2.2)", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Pausar carrossel" }).click();
  await expect(page.getByRole("button", { name: "Continuar carrossel" })).toBeVisible();
  await page.getByRole("button", { name: "Continuar carrossel" }).click();
  await expect(page.getByRole("button", { name: "Pausar carrossel" })).toBeVisible();
});

test("endereço inexistente mostra a página 404 em português", async ({ page }) => {
  const response = await page.goto("/pagina-que-nao-existe");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1, name: "Página não encontrada" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Ir para o início" })).toHaveAttribute("href", "/");
});
