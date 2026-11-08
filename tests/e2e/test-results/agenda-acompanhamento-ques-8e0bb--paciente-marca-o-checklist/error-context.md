# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: agenda.spec.ts >> acompanhamento: questionário e diário com foto; profissional cria plano e vê a ficha; paciente marca o checklist
- Location: tests\e2e\agenda.spec.ts:170:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Conte um pouco sobre você' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('heading', { name: 'Conte um pouco sobre você' }) with timeout 5000ms
  - waiting for getByRole('heading', { name: 'Conte um pouco sobre você' })

```

```yaml
- link "Pular para o conteúdo principal":
  - /url: "#conteudo"
- button "Menu de acessibilidade"
- paragraph
- banner:
  - 'link "NutriMente: voltar para a página inicial"':
    - /url: /
    - text: NutriMente
- main:
  - heading "Que bom ver você de novo" [level=1]
  - paragraph: Entre para acompanhar suas consultas e seu plano.
  - text: E-mail
  - textbox "E-mail": e2e-patient-1794176015638-711896@teste.local
  - text: Senha
  - textbox "Senha": Senha1234
  - button "Mostrar senha"
  - link "Esqueceu sua senha?":
    - /url: /forgot-password
  - button "Enviando..." [disabled]
  - paragraph:
    - text: Ainda não tem conta?
    - link "Cadastre-se":
      - /url: /register
- alert
```

# Test source

```ts
  82  |     officeCity: "São Paulo",
  83  |     officeState: "SP",
  84  |   });
  85  |   const windows = Array.from({ length: 7 }, (_, d) => ({ dayOfWeek: d, startTime: "00:00", endTime: "23:59" }));
  86  |   await apiCall("PUT", "/api/me/availability", pro.token, { windows });
  87  |   const admin = await apiLogin(adminEmail!, adminPassword!);
  88  |   await apiCall("PATCH", `/api/admin/professionals/${pro.id}/verification`, admin, { status: "APPROVED" });
  89  |   return pro;
  90  | }
  91  | 
  92  | async function expectAccessible(page: Page) {
  93  |   const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  94  |   expect(axe.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
  95  | }
  96  | 
  97  | /** Espera a página trocar o "Carregando..." pelo conteúdo */
  98  | const settle = (page: Page) => expect(page.locator("h1")).toHaveCount(1);
  99  | 
  100 | /** Sobrenome aleatório só com letras (a API recusa nomes com números) */
  101 | const letters = () => Array.from({ length: 6 }, () => String.fromCharCode(97 + Math.floor(Math.random() * 26))).join("");
  102 | 
  103 | test("paciente agenda com triagem pelo perfil; profissional vê a triagem, confirma e cancela", async ({ browser }) => {
  104 |   const suffix = letters();
  105 |   const professionalName = `Camila ${suffix[0].toUpperCase()}${suffix.slice(1)}`;
  106 |   const pro = await readyProfessional(professionalName);
  107 |   const patient = await createVerified("patient", "Ana Paciente");
  108 | 
  109 |   // Paciente: busca → perfil → agendar presencial com triagem
  110 |   const ana = await (await browser.newContext()).newPage();
  111 |   await login(ana, patient.email);
  112 |   await expect(ana).toHaveURL(/\/dashboard$/);
  113 |   await ana.goto(`/professionals/${pro.id}`);
  114 |   await settle(ana);
  115 |   await expect(ana.getByText("Presencial em São Paulo/SP")).toBeVisible();
  116 |   await expectAccessible(ana);
  117 |   await ana.getByLabel("Dia").selectOption({ index: 1 });
  118 |   await ana.locator('input[name="startsAt"]').first().check({ force: true });
  119 |   await ana.getByLabel("Presencial").check();
  120 |   await ana.getByText("Contar ao profissional como você está").click();
  121 |   await ana.getByLabel("Motivo da consulta").fill("Quero organizar os lanches.");
  122 |   await ana.getByLabel("Bem", { exact: true }).check();
  123 |   await ana.getByRole("button", { name: "Agendar consulta" }).click();
  124 |   await expect(ana).toHaveURL(/\/appointments\/\d+\?agendada=1$/);
  125 |   await expect(ana.getByRole("status")).toContainText("Consulta agendada!");
  126 |   await expect(ana.getByText("Rua das Flores, 100 - Centro, São Paulo/SP")).toBeVisible();
  127 |   const appointmentUrl = new URL(ana.url()).pathname;
  128 |   await expectAccessible(ana);
  129 | 
  130 |   // Profissional: notificação, triagem, confirmar
  131 |   const camila = await (await browser.newContext()).newPage();
  132 |   await login(camila, pro.email);
  133 |   await expect(camila.getByRole("link", { name: /Notificações: \d+ não lidas/ })).toBeVisible();
  134 |   await camila.goto(appointmentUrl);
  135 |   await settle(camila);
  136 |   await expect(camila.getByText("Quero organizar os lanches.")).toBeVisible();
  137 |   await camila.getByRole("button", { name: "Confirmar consulta" }).click();
  138 |   await expect(camila.getByRole("status")).toContainText("Consulta confirmada.");
  139 | 
  140 |   // Paciente vê "Confirmada" na lista
  141 |   await ana.goto(`/appointments?professional=${pro.id}`);
  142 |   await expect(ana.getByRole("link", { name: "← Voltar" })).toBeVisible();
  143 |   await ana.getByRole("link", { name: "← Voltar" }).click();
  144 |   await expect(ana).toHaveURL(/\/professionals$/);
  145 |   await ana.goto(`/appointments?professional=${pro.id}`);
  146 |   await expect(ana.getByRole("heading", { name: professionalName })).toBeVisible();
  147 |   await ana.getByRole("button", { name: "Escolher data e horário" }).click();
  148 |   await ana.getByRole("button", { name: "← Voltar" }).click();
  149 |   await expect(ana.getByRole("button", { name: "Escolher data e horário" })).toBeVisible();
  150 |   await ana.getByRole("button", { name: "Escolher data e horário" }).click();
  151 |   await ana.locator("fieldset").nth(1).getByRole("button").first().click();
  152 |   await ana.getByRole("button", { name: "Continuar" }).click();
  153 |   await expect(ana.getByRole("heading", { name: "Confirmação" })).toBeVisible();
  154 |   await ana.getByRole("button", { name: "← Voltar" }).click();
  155 |   await expect(ana.getByRole("heading", { name: "Data e horário" })).toBeVisible();
  156 | 
  157 |   await ana.goto("/appointments/history");
  158 |   await settle(ana);
  159 |   await expect(ana.getByText("Confirmada", { exact: true })).toBeVisible();
  160 |   await expectAccessible(ana);
  161 | 
  162 |   // Profissional cancela (com confirmação na própria tela)
  163 |   await camila.reload();
  164 |   await settle(camila);
  165 |   await camila.getByText("Cancelar consulta").click();
  166 |   await camila.getByRole("button", { name: "Confirmar cancelamento" }).click();
  167 |   await expect(camila.getByRole("status")).toContainText("Consulta cancelada.");
  168 | });
  169 | 
  170 | test("acompanhamento: questionário e diário com foto; profissional cria plano e vê a ficha; paciente marca o checklist", async ({ browser }) => {
  171 |   const suffix = letters();
  172 |   const pro = await readyProfessional(`Helena ${suffix[0].toUpperCase()}${suffix.slice(1)}`);
  173 |   const patient = await createVerified("patient", "Bruna Paciente");
  174 |   // Uma consulta liga os dois (sem ela, o profissional não vê o paciente)
  175 |   const slots = await apiCall("GET", `/api/professionals/${pro.id}/slots?days=3`);
  176 |   const startsAt = slots.flatMap((d: { slots: { startsAt: string }[] }) => d.slots)[2].startsAt;
  177 |   await apiCall("POST", "/api/appointments", patient.token, { professionalId: pro.id, startsAt, modality: "ONLINE" });
  178 | 
  179 |   // Paciente: aviso do questionário → responde
  180 |   const bruna = await (await browser.newContext()).newPage();
  181 |   await login(bruna, patient.email);
> 182 |   await expect(bruna.getByRole("heading", { name: "Conte um pouco sobre você" })).toBeVisible();
      |                                                                                   ^ Error: expect(locator).toBeVisible() failed
  183 |   await bruna.getByRole("link", { name: "Responder questionário" }).click();
  184 |   await settle(bruna);
  185 |   await expectAccessible(bruna);
  186 |   await bruna.getByLabel("Dormir melhor").check();
  187 |   await bruna.getByLabel("Refeições por dia").fill("4");
  188 |   await bruna.getByLabel("Água por dia (litros)").fill("1,5");
  189 |   await bruna.getByLabel("Leve (1 a 2 vezes por semana)").check();
  190 |   await bruna.locator('input[name="sleepQuality"][value="2"]').check();
  191 |   await bruna.locator('input[name="stressLevel"][value="4"]').check();
  192 |   await bruna.getByRole("button", { name: "Salvar respostas" }).click();
  193 |   await expect(bruna).toHaveURL(/\/dashboard\?questionario=1$/);
  194 |   await expect(bruna.getByRole("heading", { name: "Conte um pouco sobre você" })).toHaveCount(0);
  195 | 
  196 |   // Paciente: diário com foto (a foto passa pela rota do site, que põe o token)
  197 |   await bruna.goto("/diary");
  198 |   await settle(bruna);
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
```