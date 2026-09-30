// =============================================================
// Configuração dos testes de integração do front-end (Playwright)
//
// O Playwright abre um navegador de verdade, acessa o site e interage como
// uma pessoa (clica, digita, aperta Tab...). Assim testamos as páginas
// funcionando de ponta a ponta, não só funções isoladas.
//
// Rodar:   npm run test:e2e
// Na 1ª vez, baixe o navegador de teste: npx playwright install chromium
// (ou use o Chrome instalado: PLAYWRIGHT_CHANNEL=chrome npm run test:e2e)
// =============================================================

import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

export default defineConfig({
  testDir: "./tests/e2e",
  // Se um teste falhar no CI, tenta de novo uma vez (evita falso negativo)
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    // Grava um "filme" do teste quando ele falha, para investigar
    trace: "retain-on-failure",
    ...devices["Desktop Chrome"],
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
  },
  // Sobe o site automaticamente antes dos testes (versão de produção)
  webServer: {
    command: `npm run build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
