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

// O VLibras é um serviço externo do governo; bloqueamos para o teste não
// depender da internet nem da disponibilidade dele.
test.beforeEach(async ({ page }) => {
  await page.route("https://vlibras.gov.br/**", (route) => route.abort());
});

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

const toggles = [
  { name: "Alto contraste", attribute: "data-a11y-contrast", value: "high" },
  { name: "Texto legível", attribute: "data-a11y-readable", value: "true" },
  { name: "Destacar links", attribute: "data-a11y-links", value: "true" },
  { name: "Pausar animações", attribute: "data-a11y-motion", value: "reduce" },
  { name: "Cursor grande", attribute: "data-a11y-cursor", value: "big" },
];

for (const { name, attribute, value } of toggles) {
  test(`botão "${name}" liga e desliga`, async ({ page }) => {
    await page.goto("/");
    await openMenu(page);
    const button = page.getByRole("button", { name: new RegExp(name) });

    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await expect(html(page)).toHaveAttribute(attribute, value);
    // O leitor de tela é avisado da mudança
    await expect(page.getByText(`${name} ativado`)).toBeAttached();

    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", "false");
    await expect(html(page)).not.toHaveAttribute(attribute, value);
  });
}

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

test("'Pausar animações' para o carrossel e trava o botão de play", async ({ page }) => {
  await page.goto("/");
  const carouselButton = page.getByRole("button", { name: "Pausar carrossel" });
  await expect(carouselButton).toBeEnabled();

  // Pausa manual pelo botão do carrossel
  await carouselButton.click();
  await expect(page.getByRole("button", { name: "Continuar carrossel" })).toBeVisible();
  await page.getByRole("button", { name: "Continuar carrossel" }).click();

  await openMenu(page);
  await page.getByRole("button", { name: /Pausar animações/ }).click();
  await expect(page.getByRole("button", { name: "Continuar carrossel" })).toBeDisabled();
});
