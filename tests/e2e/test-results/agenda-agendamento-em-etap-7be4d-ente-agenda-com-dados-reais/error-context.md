# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: agenda.spec.ts >> agendamento em etapas (/appointment): visitante entra e o paciente agenda com dados reais
- Location: tests\e2e\agenda.spec.ts:263:5

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/appointments\/\d+\?agendada=1$/
Received string:  "http://localhost:3100/appointment?professional=90191"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    13 × locator resolved to <html lang="pt-BR" class="T19VSG_variable _8Li5zG_variable pjfs-a_variable Q65xMG_variable text-blue2 font-open-sans h-full antialiased">…</html>
       - unexpected value "http://localhost:3100/appointment?professional=90191"

```

```yaml
- link "Pular para o conteúdo principal":
  - /url: "#conteudo"
- button "Menu de acessibilidade"
- paragraph
- banner:
  - 'link "NutriMente: página inicial"':
    - /url: /
    - img "Logo do NutriMente"
  - navigation "Navegação principal":
    - link "Início":
      - /url: /
    - link "Sobre nós":
      - /url: /about
  - link "Minha área":
    - /url: /dashboard
- main:
  - heading "Agendar com Renata Ggjhbg" [level=1]
  - button "← Voltar"
  - list "Etapas do agendamento":
    - listitem: "Etapa 1: Profissional (concluída)"
    - listitem: "Etapa 2: Data e horário (concluída)"
    - listitem: "Etapa 3: Confirmação"
  - heading "Confirmação" [level=2]
  - text: Motivo da consulta (opcional)
  - textbox "Motivo da consulta (opcional)": Quero ajuda com a rotina.
  - paragraph: Só Renata lê. Guardamos de forma criptografada.
  - paragraph: Você pode cancelar ou remarcar pelo site até 24 horas antes da consulta.
  - complementary "Resumo do agendamento":
    - paragraph: Renata Ggjhbg
    - paragraph: Nutricionista
    - term: Data
    - definition: segunda-feira, 9 de novembro
    - term: Horário
    - definition: 00:00
    - term: Modalidade
    - definition: Presencial (São Paulo/SP)
    - term: Valor
    - definition: R$ 150,00
    - paragraph: O pagamento é combinado direto com o profissional.
    - button "Agendando..." [disabled]
- contentinfo:
  - heading "Contato" [level=2]
  - paragraph:
    - link "nutrimente@gmail.com":
      - /url: mailto:nutrimente@gmail.com
  - img "NutriMente"
  - 'navigation "Rodapé: navegação"':
    - heading "Navegue" [level=2]
    - link "Início":
      - /url: /
    - link "Profissionais":
      - /url: /professionals
    - link "Cadastre-se":
      - /url: /register
  - 'navigation "Rodapé: institucional"':
    - heading "Institucional" [level=2]
    - link "Política de Privacidade":
      - /url: /privacy
    - link "Termos de Uso":
      - /url: /terms
    - link "Sobre nós":
      - /url: /about
  - paragraph: © 2026 NutriMente. Todos os direitos reservados.
- alert
```

# Test source

```ts
  199 |   await bruna.getByRole("group", { name: "Refeição" }).getByLabel("Almoço").check();
  200 |   await bruna.getByLabel("O que você comeu?").fill("Arroz, feijão e salada");
  201 |   await bruna.getByLabel(/^Foto/).setInputFiles("public/icons/apple.png");
  202 |   await bruna.getByRole("button", { name: "Registrar refeição" }).click();
  203 |   await expect(bruna.getByRole("status")).toContainText("Refeição registrada.");
  204 |   const photo = bruna.getByRole("img", { name: "Foto: Arroz, feijão e salada" });
  205 |   await expect(photo).toBeVisible();
  206 |   await expect.poll(() => photo.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  207 |   await expectAccessible(bruna);
  208 | 
  209 |   // Profissional: ficha da paciente → cria plano
  210 |   const helena = await (await browser.newContext()).newPage();
  211 |   await login(helena, pro.email);
  212 |   await helena.getByRole("link", { name: "Pacientes" }).click();
  213 |   await helena.getByRole("link", { name: /Bruna Paciente/ }).click();
  214 |   await settle(helena);
  215 |   await expect(helena.getByText("Dormir melhor")).toBeVisible();
  216 |   await expect(helena.getByRole("img", { name: "Foto: Arroz, feijão e salada" })).toBeVisible();
  217 |   await expectAccessible(helena);
  218 |   await helena.getByRole("link", { name: "Criar plano" }).click();
  219 |   await settle(helena);
  220 |   await helena.getByLabel("Título").fill("Rotina do sono e alimentação");
  221 |   await helena.getByLabel("Meta 1", { exact: true }).fill("Dormir 7 horas");
  222 |   await helena.getByLabel("Tarefa 1", { exact: true }).fill("Jantar até as 20h");
  223 |   await helena.getByRole("button", { name: "Criar plano" }).click();
  224 |   await expect(helena).toHaveURL(/\/plans\/\d+$/);
  225 |   await settle(helena);
  226 |   const planUrl = new URL(helena.url()).pathname;
  227 |   await expectAccessible(helena);
  228 | 
  229 |   // Paciente marca o checklist de hoje
  230 |   await bruna.goto(planUrl);
  231 |   await settle(bruna);
  232 |   const checklist = bruna.getByRole("heading", { name: /Checklist de hoje/ });
  233 |   await expect(checklist).toContainText("(0/1)");
  234 |   await bruna.getByRole("button", { name: /Jantar até as 20h/ }).click();
  235 |   await expect(checklist).toContainText("(1/1)");
  236 | });
  237 | 
  238 | test("paciente com consulta em menos de 24 h vê por que não pode mais cancelar", async ({ browser }) => {
  239 |   const suffix = letters();
  240 |   const pro = await readyProfessional(`Olivia ${suffix[0].toUpperCase()}${suffix.slice(1)}`);
  241 |   const patient = await createVerified("patient", "Carla Paciente");
  242 |   const slots = await apiCall("GET", `/api/professionals/${pro.id}/slots?days=2`);
  243 |   const soon = slots
  244 |     .flatMap((d: { slots: { startsAt: string }[] }) => d.slots)
  245 |     .find((s: { startsAt: string }) => new Date(s.startsAt).getTime() - Date.now() < 23 * 3600_000);
  246 |   test.skip(!soon, "sem horário livre nas próximas 23 horas");
  247 |   const appt = await apiCall("POST", "/api/appointments", patient.token, { professionalId: pro.id, startsAt: soon.startsAt, modality: "ONLINE" });
  248 | 
  249 |   const carla = await (await browser.newContext()).newPage();
  250 |   await login(carla, patient.email);
  251 |   await expect(carla).toHaveURL(/\/dashboard$/);
  252 |   await carla.goto(`/appointments/${appt.id}`);
  253 |   await settle(carla);
  254 |   await expect(carla.getByText("Faltam menos de 24 horas para a consulta")).toBeVisible();
  255 |   await expect(carla.getByText("Cancelar consulta")).toHaveCount(0);
  256 | 
  257 |   // O formulário de agendamento já avisa a regra
  258 |   await carla.goto(`/professionals/${pro.id}`);
  259 |   await settle(carla);
  260 |   await expect(carla.getByText("até 24 horas antes da consulta")).toBeVisible();
  261 | });
  262 | 
  263 | test("agendamento em etapas (/appointment): visitante entra e o paciente agenda com dados reais", async ({ browser }) => {
  264 |   const suffix = letters();
  265 |   const pro = await readyProfessional(`Renata ${suffix[0].toUpperCase()}${suffix.slice(1)}`);
  266 |   const patient = await createVerified("patient", "Lia Paciente");
  267 | 
  268 |   // Visitante: vê o perfil real e, ao confirmar, é mandado para o login
  269 |   const visitor = await (await browser.newContext()).newPage();
  270 |   await visitor.goto(`/appointment?professional=${pro.id}`);
  271 |   await expect(visitor.getByRole("heading", { level: 1 })).toContainText("Renata");
  272 |   await expect(visitor.getByText("Dra. Marina Alves")).toHaveCount(0); // nada de dado de exemplo
  273 |   await expect(visitor.getByText(/CRN-\d+ \d+/)).toBeVisible(); // registro no formato oficial
  274 |   await expectAccessible(visitor);
  275 |   await visitor.getByRole("button", { name: "Escolher data e horário" }).click();
  276 |   await visitor.locator("fieldset").first().getByRole("button").first().click();
  277 |   await visitor.locator("fieldset").nth(1).getByRole("button").first().click();
  278 |   await visitor.getByRole("button", { name: "Continuar" }).click();
  279 |   await expect(visitor.getByRole("link", { name: "Entrar para agendar" })).toHaveAttribute("href", /\/login\?next=.*startsAt/);
  280 |   await expect(visitor.getByLabel(/número do cartão/i)).toHaveCount(0); // sem formulário de cartão
  281 | 
  282 |   // Paciente: escolhe dia, horário e presencial, conta o motivo e confirma
  283 |   const lia = await (await browser.newContext()).newPage();
  284 |   await login(lia, patient.email);
  285 |   await expect(lia).toHaveURL(/\/dashboard$/);
  286 |   await lia.goto(`/appointment?professional=${pro.id}`);
  287 |   await lia.getByRole("button", { name: "Escolher data e horário" }).click();
  288 |   await lia.locator("fieldset").first().getByRole("button").nth(1).click();
  289 |   const time = lia.locator("fieldset").nth(1).getByRole("button").first();
  290 |   const chosen = (await time.innerText()).trim();
  291 |   await time.click();
  292 |   await expect(time).toHaveAttribute("aria-pressed", "true");
  293 |   await lia.getByLabel("Presencial").check();
  294 |   await expectAccessible(lia);
  295 |   await lia.getByRole("button", { name: "Continuar" }).click();
  296 |   await expect(lia.getByRole("complementary", { name: "Resumo do agendamento" })).toContainText(chosen);
  297 |   await lia.getByLabel(/Motivo da consulta/).fill("Quero ajuda com a rotina.");
  298 |   await lia.getByRole("button", { name: "Confirmar agendamento" }).click();
> 299 |   await expect(lia).toHaveURL(/\/appointments\/\d+\?agendada=1$/);
      |                     ^ Error: expect(page).toHaveURL(expected) failed
  300 |   await expect(lia.getByRole("status")).toContainText("Consulta agendada!");
  301 |   await expect(lia.getByText("Rua das Flores, 100 - Centro, São Paulo/SP")).toBeVisible();
  302 | });
  303 | 
```