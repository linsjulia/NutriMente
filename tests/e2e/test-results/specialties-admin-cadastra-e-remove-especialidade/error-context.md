# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: specialties.spec.ts >> admin cadastra e remove especialidade
- Location: tests\e2e\specialties.spec.ts:140:5

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByRole('main').getByRole('status')
Expected substring: "\"Teste Vdeempya\" cadastrada"
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toContainText" getByRole('main').getByRole('status') with timeout 5000ms
  - waiting for getByRole('main').getByRole('status')

```

```yaml
- link "Pular para o conteúdo principal":
  - /url: "#conteudo"
- button "Menu de acessibilidade"
- paragraph
- alert: Especialidades | NutriMente
- banner:
  - 'link "NutriMente: página inicial"':
    - /url: /
  - navigation "Área logada":
    - list:
      - listitem:
        - link "Profissionais":
          - /url: /admin/professionals
      - listitem:
        - link "Especialidades":
          - /url: /admin/specialties
      - listitem:
        - link "Minha conta":
          - /url: /account
  - text: Olá, Administrador
  - button "Sair"
  - link "Minha conta":
    - /url: /account
- main:
  - heading "Especialidades" [level=1]
  - paragraph: Os profissionais escolhem até 5 destas no perfil, e os pacientes filtram a busca por elas.
  - region "Nova especialidade":
    - heading "Nova especialidade" [level=2]
    - alert:
      - paragraph: Revise os campos destacados.
    - text: Nome da especialidade
    - textbox "Nome da especialidade" [invalid]: Teste Vdeempya
    - paragraph: "Ex.: Nutrição Funcional, Terapia de Casal."
    - paragraph: Informe o nome da especialidade
    - text: Profissão
    - combobox "Profissão" [invalid]:
      - option "Escolha..." [disabled]
      - option "Nutricionista"
      - option "Psicólogo(a)" [selected]
    - paragraph: Escolha a profissão
    - button "Enviando..." [disabled]
  - region "Nutricionista (21)":
    - heading "Nutricionista (21)" [level=2]
    - list:
      - listitem:
        - text: Alimentação consciente (mindful eating)
        - group: Remover
      - listitem:
        - text: Anorexia e bulimia
        - group: Remover
      - listitem:
        - text: Compulsão alimentar
        - group: Remover
      - listitem:
        - text: Culpa alimentar
        - group: Remover
      - listitem:
        - text: Diabetes
        - group: Remover
      - listitem:
        - text: Dietas restritivas e efeito sanfona
        - group: Remover
      - listitem:
        - text: Emagrecimento
        - group: Remover
      - listitem:
        - text: Fome emocional e fome física
        - group: Remover
      - listitem:
        - text: Ganho de massa muscular
        - group: Remover
      - listitem:
        - text: Hipertensão e colesterol
        - group: Remover
      - listitem:
        - text: Imagem corporal
        - group: Remover
      - listitem:
        - text: Nutrição Clínica
        - group: Remover
      - listitem:
        - text: Nutrição Comportamental
        - group: Remover
      - listitem:
        - text: Nutrição Esportiva
        - group: Remover
      - listitem:
        - text: Nutrição Materno-Infantil
        - group: Remover
      - listitem:
        - text: Ortorexia
        - group: Remover
      - listitem:
        - text: Psiconutrição
        - group: Remover
      - listitem:
        - text: Reeducação alimentar
        - group: Remover
      - listitem:
        - text: Saúde intestinal
        - group: Remover
      - listitem:
        - text: Vegetarianismo e Veganismo
        - group: Remover
      - listitem:
        - text: Vigorexia
        - group: Remover
  - region "Psicólogo(a) (23)":
    - heading "Psicólogo(a) (23)" [level=2]
    - list:
      - listitem:
        - text: Alimentação consciente (mindful eating)
        - group: Remover
      - listitem:
        - text: Anorexia e bulimia
        - group: Remover
      - listitem:
        - text: Ansiedade
        - group: Remover
      - listitem:
        - text: Autoestima e Imagem Corporal
        - group: Remover
      - listitem:
        - text: Compulsão alimentar
        - group: Remover
      - listitem:
        - text: Culpa alimentar
        - group: Remover
      - listitem:
        - text: Depressão
        - group: Remover
      - listitem:
        - text: Dietas restritivas e efeito sanfona
        - group: Remover
      - listitem:
        - text: Estresse e burnout
        - group: Remover
      - listitem:
        - text: Fobias
        - group: Remover
      - listitem:
        - text: Fome emocional e fome física
        - group: Remover
      - listitem:
        - text: Imagem corporal
        - group: Remover
      - listitem:
        - text: Luto e perdas
        - group: Remover
      - listitem:
        - text: Ortorexia
        - group: Remover
      - listitem:
        - text: Psicologia da Saúde
        - group: Remover
      - listitem:
        - text: Psiconutrição
        - group: Remover
      - listitem:
        - text: TDAH
        - group: Remover
      - listitem:
        - text: Terapia Cognitivo-Comportamental
        - group: Remover
      - listitem:
        - text: TOC
        - group: Remover
      - listitem:
        - text: Transtorno bipolar
        - group: Remover
      - listitem:
        - text: Transtorno do pânico
        - group: Remover
      - listitem:
        - text: Transtornos Alimentares
        - group: Remover
      - listitem:
        - text: Vigorexia
        - group: Remover
```

# Test source

```ts
  56  |   return `${prefix} ${letters[0].toUpperCase()}${letters.slice(1)}`;
  57  | }
  58  | 
  59  | async function registerNutritionist(page: Page, email: string, name: string) {
  60  |   await page.goto("/register/professional");
  61  |   await page.getByLabel("Nome completo").fill(name);
  62  |   await page.getByLabel("E-mail").fill(email);
  63  |   await page.getByLabel("Senha", { exact: true }).fill(PASSWORD);
  64  |   await page.getByLabel("Repita a senha").fill(PASSWORD);
  65  |   await page.getByRole("button", { name: "Continuar" }).click();
  66  |   await page.getByLabel("CPF").fill(randomCpf());
  67  |   await page.getByLabel("Celular").fill("11977776666");
  68  |   await page.getByLabel("Data de nascimento").fill("1985-07-01");
  69  |   await page.getByRole("button", { name: "Continuar" }).click();
  70  |   await page.getByText("Nutricionista", { exact: true }).click();
  71  |   await page.getByLabel("Número do CRN").fill(randomCrn());
  72  |   await page.getByLabel(/Li e aceito/).check();
  73  |   await page.getByRole("button", { name: /Concluir cadastro/ }).click();
  74  |   await expect(page.getByText("nossa equipe vai verificar")).toBeVisible();
  75  |   await confirmEmail(page, email);
  76  | }
  77  | 
  78  | test("profissional escolhe especialidades (limite de 5) e o paciente filtra a busca por elas", async ({ page }) => {
  79  |   test.skip(!adminEmail || !adminPassword, "ADMIN_EMAIL/ADMIN_PASSWORD não configurados no .env");
  80  |   const email = uniqueEmail("especialidade");
  81  |   const name = uniqueName("Dra. Especialista");
  82  |   await registerNutritionist(page, email, name);
  83  |   await login(page, email);
  84  |   await expect(page).toHaveURL(/\/dashboard$/);
  85  | 
  86  |   const specialties = page.getByRole("group", { name: "Especialidades" });
  87  |   await expect(specialties).toBeVisible();
  88  |   // Só especialidades de nutrição aparecem para nutricionista
  89  |   await expect(specialties.getByLabel("Nutrição Esportiva")).toBeVisible();
  90  |   await expect(specialties.getByLabel("Ansiedade")).toHaveCount(0);
  91  | 
  92  |   // Clica na "pílula" (o label), como a pessoa faz: o checkbox em si fica escondido
  93  |   const pills = specialties.locator("label.chip");
  94  |   const boxes = specialties.getByRole("checkbox");
  95  | 
  96  |   // Limite: com 5 marcadas, as outras ficam desabilitadas
  97  |   for (let i = 0; i < 5; i++) await pills.nth(i).click();
  98  |   await expect(specialties.getByText("5 de 5 escolhidas")).toBeVisible();
  99  |   await expect(boxes.nth(5)).toBeDisabled();
  100 |   for (let i = 1; i < 5; i++) await pills.nth(i).click();
  101 |   await expect(specialties.getByText("1 de 5 escolhidas")).toBeVisible();
  102 | 
  103 |   // Fica com duas: a primeira e "Nutrição Esportiva"
  104 |   await specialties.locator("label.chip", { hasText: "Nutrição Esportiva" }).click();
  105 |   const first = (await boxes.nth(0).getAttribute("id"))!;
  106 |   await page.getByRole("button", { name: "Salvar perfil" }).click();
  107 |   await expect(page.getByRole("main").getByRole("status")).toContainText("Perfil profissional atualizado");
  108 |   await reloadAndSettle(page, page.locator(`#${first}`));
  109 |   await expect(page.locator(`#${first}`)).toBeChecked();
  110 |   await expect(specialties.getByLabel("Nutrição Esportiva")).toBeChecked();
  111 |   await expect(specialties.getByText("2 de 5 escolhidas")).toBeVisible();
  112 | 
  113 |   // Acessibilidade do painel com a escolha de especialidades
  114 |   const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  115 |   expect(axe.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
  116 |   await logout(page);
  117 | 
  118 |   // Admin aprova
  119 |   await login(page, adminEmail!, adminPassword!);
  120 |   await page.getByRole("button", { name: `Aprovar ${name}` }).click();
  121 |   await expect(page.getByRole("button", { name: `Aprovar ${name}` })).toHaveCount(0);
  122 | 
  123 |   // Admin logado filtra por especialidade
  124 |   await page.goto("/professionals?type=NUTRICIONISTA");
  125 |   await page.getByLabel("Especialidade", { exact: true }).selectOption({ label: "Nutrição Esportiva" });
  126 |   await page.getByRole("button", { name: "Filtrar" }).click();
  127 |   await expect(page).toHaveURL(/specialty=\d+/);
  128 |   const card = page.getByRole("listitem").filter({ hasText: name });
  129 |   await expect(card).toBeVisible();
  130 |   await expect(card.getByRole("list", { name: "Especialidades" })).toContainText("Nutrição Esportiva");
  131 | 
  132 |   // Outra especialidade (que ele não marcou): não aparece
  133 |   await page.getByLabel("Especialidade", { exact: true }).selectOption({ label: "Vegetarianismo e Veganismo" });
  134 |   await page.getByRole("button", { name: "Filtrar" }).click();
  135 |   await expect(page.getByRole("listitem").filter({ hasText: name })).toHaveCount(0);
  136 | 
  137 |   await deleteAccountViaApi(email);
  138 | });
  139 | 
  140 | test("admin cadastra e remove especialidade", async ({ page }) => {
  141 |   test.skip(!adminEmail || !adminPassword, "ADMIN_EMAIL/ADMIN_PASSWORD não configurados no .env");
  142 |   const specialty = uniqueName("Teste");
  143 |   createdSpecialties.push(specialty);
  144 | 
  145 |   await login(page, adminEmail!, adminPassword!);
  146 |   await page.getByRole("navigation", { name: "Área logada" }).getByRole("link", { name: "Especialidades" }).click();
  147 |   await expect(page).toHaveTitle("Especialidades | NutriMente");
  148 | 
  149 |   // Sem preencher: erros nos campos, foco no primeiro
  150 |   await page.getByRole("button", { name: "Cadastrar especialidade" }).click();
  151 |   await expect(page.getByLabel("Nome da especialidade")).toBeFocused();
  152 | 
  153 |   await page.getByLabel("Nome da especialidade").fill(specialty);
  154 |   await page.getByLabel("Profissão").selectOption("PSICOLOGO");
  155 |   await page.getByRole("button", { name: "Cadastrar especialidade" }).click();
> 156 |   await expect(page.getByRole("main").getByRole("status")).toContainText(`"${specialty}" cadastrada`);
      |                                                            ^ Error: expect(locator).toContainText(expected) failed
  157 |   const psychology = page.getByRole("region", { name: /Psicólogo/ });
  158 |   await expect(psychology.getByText(specialty, { exact: true })).toBeVisible();
  159 | 
  160 |   // Repetida: conflito no campo
  161 |   await page.getByLabel("Nome da especialidade").fill(specialty.toLowerCase());
  162 |   await page.getByLabel("Profissão").selectOption("PSICOLOGO");
  163 |   await page.getByRole("button", { name: "Cadastrar especialidade" }).click();
  164 |   await expect(page.getByRole("main").getByRole("alert")).toContainText("Essa especialidade já existe para esta profissão");
  165 |   await expect(page.getByLabel("Nome da especialidade")).toHaveAttribute("aria-invalid", "true");
  166 | 
  167 |   // Aparece no filtro público
  168 |   await page.goto("/professionals?type=PSICOLOGO");
  169 |   await expect(page.getByLabel("Especialidade", { exact: true }).locator("option", { hasText: specialty })).toHaveCount(1);
  170 | 
  171 |   // Remover pede confirmação
  172 |   await page.goto("/admin/specialties");
  173 |   const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  174 |   expect(axe.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
  175 |   await page.locator(`summary[aria-label="Remover ${specialty}"]`).click();
  176 |   await page.getByRole("button", { name: "Confirmar remoção" }).filter({ visible: true }).click();
  177 |   await expect(psychology.getByText(specialty, { exact: true })).toHaveCount(0);
  178 | });
  179 | 
```