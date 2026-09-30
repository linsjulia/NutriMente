// =============================================================
// Auditoria automática de acessibilidade (axe-core, regras WCAG 2.x A e AA)
//
// O axe confere dezenas de regras em cada página: contraste de cores,
// campos sem rótulo, imagens sem alt, títulos fora de ordem, IDs
// repetidos, etc. Se alguém criar algo inacessível, este teste falha e
// mostra exatamente qual elemento e qual regra.
// =============================================================

import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const PAGES = [
  "/",
  "/login",
  "/register",
  "/register/patient",
  "/register/professional",
  "/forgot-password",
  "/professionals",
  "/terms",
  "/privacy",
  "/about",
];

for (const path of PAGES) {
  for (const contrast of [false, true]) {
    test(`${path} sem problemas de acessibilidade${contrast ? " (alto contraste)" : ""}`, async ({ page }) => {
      if (contrast) {
        await page.addInitScript(() => localStorage.setItem("nutrimente:a11y", JSON.stringify({ fontLevel: 0, highContrast: true })));
      }
      await page.goto(path);
      // Rola a página para as seções com animação de entrada aparecerem
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 400) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 50));
        }
      });
      await page.waitForTimeout(1200);

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        // O carrossel duplica slides (loop): regra desligada só para ele
        .exclude(".swiper-slide-duplicate")
        .analyze();

      const report = results.violations.map((v) => `${v.id} (${v.impact}): ${v.help}\n    ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join("\n    ")}`);
      expect(report, report.join("\n")).toEqual([]);
    });
  }
}
