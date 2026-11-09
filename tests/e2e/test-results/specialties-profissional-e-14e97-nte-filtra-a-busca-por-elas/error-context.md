# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: specialties.spec.ts >> profissional escolhe especialidades (limite de 5) e o paciente filtra a busca por elas
- Location: tests\e2e\specialties.spec.ts:78:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('listitem').filter({ hasText: 'Dra. Especialista Utrfcwfu' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('listitem').filter({ hasText: 'Dra. Especialista Utrfcwfu' }) with timeout 5000ms
  - waiting for getByRole('listitem').filter({ hasText: 'Dra. Especialista Utrfcwfu' })

```

```yaml
- link "Pular para o conteúdo principal":
  - /url: "#conteudo"
- button "Menu de acessibilidade"
- paragraph
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
  - complementary:
    - heading "Filtros" [level=2]
    - button "Limpar filtros"
    - heading "Área" [level=3]:
      - button "Área" [expanded]
    - region "Área":
      - checkbox "Psicologia"
      - text: Psicologia
      - checkbox "Nutrição"
      - text: Nutrição
      - checkbox "Psiconutrição"
      - text: Psiconutrição
    - heading "Tipo de Consulta" [level=3]:
      - button "Tipo de Consulta" [expanded]
    - region "Tipo de Consulta":
      - checkbox "Online"
      - text: Online
    - heading "Tema" [level=3]:
      - button "Tema" [expanded]
    - region "Tema":
      - textbox "Buscar tema":
        - /placeholder: Buscar tema...
      - button "Buscar tema"
      - checkbox "Compulsão alimentar"
      - text: Compulsão alimentar
      - checkbox "Anorexia e bulimia"
      - text: Anorexia e bulimia
      - checkbox "Imagem corporal"
      - text: Imagem corporal
      - checkbox "Ansiedade"
      - text: Ansiedade
      - button "Ver todos os temas"
    - heading "Público" [level=3]:
      - button "Público" [expanded]
    - region "Público":
      - checkbox "Criança"
      - text: Criança
      - checkbox "Adolescente"
      - text: Adolescente
      - checkbox "Adulto"
      - text: Adulto
      - checkbox "Idoso"
      - text: Idoso
    - heading "Preço da Consulta" [level=3]:
      - button "Preço da Consulta" [expanded]
    - region "Preço da Consulta":
      - group:
        - slider "Preço máximo da consulta": "60"
      - text: R$60 R$0
    - heading "Horário Disponível" [level=3]:
      - button "Horário Disponível" [expanded]
    - region "Horário Disponível":
      - checkbox "Hoje"
      - text: Hoje
      - checkbox "Amanhã"
      - text: Amanhã
      - group:
        - button "Manhã"
        - button "Tarde"
        - button "Noite"
      - button "Selecionar data"
    - heading "Duração da Consulta" [level=3]:
      - button "Duração da Consulta" [expanded]
    - region "Duração da Consulta":
      - group:
        - button "Até 30 min"
        - button "Até 60 min"
        - button "Acima de 60 min"
    - heading "Perfil do Profissional" [level=3]:
      - button "Perfil do Profissional" [expanded]
    - region "Perfil do Profissional":
      - checkbox "Feminino"
      - text: Feminino
      - checkbox "Masculino"
      - text: Masculino
  - region "Encontre seu profissional":
    - heading "Encontre seu profissional" [level=1]
    - text: Especialidade
    - combobox "Especialidade":
      - option "Todas"
      - option "Alimentação consciente (mindful eating)"
      - option "Anorexia e bulimia"
      - option "Compulsão alimentar"
      - option "Culpa alimentar"
      - option "Diabetes"
      - option "Dietas restritivas e efeito sanfona"
      - option "Emagrecimento"
      - option "Fome emocional e fome física"
      - option "Ganho de massa muscular"
      - option "Hipertensão e colesterol"
      - option "Imagem corporal"
      - option "Nutrição Clínica"
      - option "Nutrição Comportamental"
      - option "Nutrição Esportiva" [selected]
      - option "Nutrição Materno-Infantil"
      - option "Ortorexia"
      - option "Psiconutrição"
      - option "Reeducação alimentar"
      - option "Saúde intestinal"
      - option "Vegetarianismo e Veganismo"
      - option "Vigorexia"
    - button "Filtrar"
    - paragraph: 2 profissionais encontrados
    - text: Nutricionista
    - link "Remover filtro Nutricionista":
      - /url: /professionals?specialty=2
    - text: Nutrição Esportiva
    - link "Remover filtro Nutrição Esportiva":
      - /url: /professionals?type=NUTRICIONISTA
    - link "Limpar tudo":
      - /url: /professionals
    - navigation "Ordenar":
      - text: "Ordenar:"
      - link "Mais relevantes":
        - /url: /professionals?type=NUTRICIONISTA&specialty=2
      - link "Menor preço":
        - /url: /professionals?type=NUTRICIONISTA&specialty=2&sort=PRICE_ASC
      - link "Maior preço":
        - /url: /professionals?type=NUTRICIONISTA&specialty=2&sort=PRICE_DESC
    - article:
      - text: RC
      - paragraph: Nutricionista
      - heading "Rafael Costa" [level=3]:
        - link "Rafael Costa":
          - /url: /professionals/60039
      - paragraph: ★ 4.5 (2)
      - paragraph: "Principais áreas de atuação:"
      - text: Ganho de massa muscular Nutrição Clínica Nutrição Esportiva
      - paragraph: Sem horário hoje
      - paragraph: R$ 150,00
      - paragraph: por consulta
      - link "Agendar consulta com Rafael Costa":
        - /url: /appointments?professional=60039
        - text: Agendar Consulta
    - article:
      - text: DE
      - paragraph: Nutricionista
      - heading "Dra. Especialista Utrfcwfu" [level=3]:
        - link "Dra. Especialista Utrfcwfu":
          - /url: /professionals/90204
      - paragraph: ★ 0.0 (0)
      - paragraph: "Principais áreas de atuação:"
      - text: Alimentação consciente (mindful eating) Nutrição Esportiva
      - paragraph: Sem horário hoje
      - paragraph: Valor a combinar
      - paragraph: por consulta
      - link "Agendar consulta com Dra. Especialista Utrfcwfu":
        - /url: /appointments?professional=90204
        - text: Agendar Consulta
- alert
```

# Test source

```ts
  29  |   test.skip(!(await backendIsUp()), "API/Mailpit fora do ar: rode `docker compose up -d --build`");
  30  | });
  31  | 
  32  | /** Especialidades criadas pelos testes: removidas no fim, mesmo se o teste falhar no meio */
  33  | const createdSpecialties: string[] = [];
  34  | 
  35  | test.afterAll(async () => {
  36  |   if (!createdSpecialties.length || !adminEmail || !adminPassword) return;
  37  |   const login = await fetch(`${API_URL}/api/auth/login`, {
  38  |     method: "POST",
  39  |     headers: { "Content-Type": "application/json" },
  40  |     body: JSON.stringify({ email: adminEmail, password: adminPassword }),
  41  |   });
  42  |   if (!login.ok) return;
  43  |   const { accessToken } = await login.json();
  44  |   const all: { id: number; name: string }[] = await (await fetch(`${API_URL}/api/specialties`)).json();
  45  |   for (const s of all.filter((s) => createdSpecialties.includes(s.name))) {
  46  |     await fetch(`${API_URL}/api/admin/specialties/${s.id}`, {
  47  |       method: "DELETE",
  48  |       headers: { Authorization: `Bearer ${accessToken}` },
  49  |     });
  50  |   }
  51  | });
  52  | 
  53  | /** Nome só com letras (a API recusa números), diferente a cada execução */
  54  | function uniqueName(prefix: string) {
  55  |   const letters = Array.from({ length: 8 }, () => String.fromCharCode(97 + Math.floor(Math.random() * 26))).join("");
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
> 129 |   await expect(card).toBeVisible();
      |                      ^ Error: expect(locator).toBeVisible() failed
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
  156 |   await expect(page.getByRole("main").getByRole("status")).toContainText(`"${specialty}" cadastrada`);
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