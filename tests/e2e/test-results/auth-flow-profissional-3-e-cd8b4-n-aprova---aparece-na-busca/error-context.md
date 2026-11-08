# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth-flow.spec.ts >> profissional: 3 etapas -> confirmação -> em análise -> admin aprova -> aparece na busca
- Location: tests\e2e\auth-flow.spec.ts:173:5

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByRole('listitem').filter({ hasText: 'Dra. Teste Dvazfifz' })
Expected substring: "R$ 180,00"
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toContainText" getByRole('listitem').filter({ hasText: 'Dra. Teste Dvazfifz' }) with timeout 5000ms
  - waiting for getByRole('listitem').filter({ hasText: 'Dra. Teste Dvazfifz' })

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
      - option "Todas" [selected]
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
      - option "Nutrição Esportiva"
      - option "Nutrição Materno-Infantil"
      - option "Ortorexia"
      - option "Psiconutrição"
      - option "Reeducação alimentar"
      - option "Saúde intestinal"
      - option "Vegetarianismo e Veganismo"
      - option "Vigorexia"
    - button "Filtrar"
    - paragraph: 5 profissionais encontrados
    - text: Nutricionista
    - link "Remover filtro Nutricionista":
      - /url: /professionals
    - link "Limpar tudo":
      - /url: /professionals
    - navigation "Ordenar":
      - text: "Ordenar:"
      - link "Mais relevantes":
        - /url: /professionals?type=NUTRICIONISTA
      - link "Menor preço":
        - /url: /professionals?type=NUTRICIONISTA&sort=PRICE_ASC
      - link "Maior preço":
        - /url: /professionals?type=NUTRICIONISTA&sort=PRICE_DESC
    - article:
      - text: LS
      - paragraph: Nutricionista
      - heading "Larissa Santos" [level=3]:
        - link "Larissa Santos":
          - /url: /professionals/60040
      - paragraph: ★ 5.0 (2)
      - paragraph: "Principais áreas de atuação:"
      - text: Nutrição Materno-Infantil Reeducação alimentar Vegetarianismo e Veganismo
      - paragraph: Sem horário hoje
      - paragraph: R$ 130,00
      - paragraph: por consulta
      - link "Agendar consulta com Larissa Santos":
        - /url: /appointments?professional=60040
        - text: Agendar Consulta
    - article:
      - text: CR
      - paragraph: Nutricionista
      - heading "Camila Rocha" [level=3]:
        - link "Camila Rocha":
          - /url: /professionals/60038
      - paragraph: ★ 4.8 (4)
      - paragraph: "Principais áreas de atuação:"
      - text: Compulsão alimentar Emagrecimento Nutrição Comportamental Psiconutrição
      - paragraph: Sem horário hoje
      - paragraph: R$ 180,00
      - paragraph: por consulta
      - link "Agendar consulta com Camila Rocha":
        - /url: /appointments?professional=60038
        - text: Agendar Consulta
    - article:
      - text: HM
      - paragraph: Nutricionista
      - heading "Helena Martins" [level=3]:
        - link "Helena Martins":
          - /url: /professionals/60041
      - paragraph: ★ 4.7 (3)
      - paragraph: "Principais áreas de atuação:"
      - text: Diabetes Emagrecimento Hipertensão e colesterol Nutrição Clínica
      - paragraph: Sem horário hoje
      - paragraph: R$ 220,00
      - paragraph: por consulta
      - link "Agendar consulta com Helena Martins":
        - /url: /appointments?professional=60041
        - text: Agendar Consulta
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
      - text: DT
      - paragraph: Nutricionista
      - heading "Dra. Teste Dvazfifz" [level=3]:
        - link "Dra. Teste Dvazfifz":
          - /url: /professionals/90197
      - paragraph: ★ 0.0 (0)
      - paragraph: "Principais áreas de atuação:"
      - paragraph: Sem horário hoje
      - paragraph: R$ 180,00
      - paragraph: por consulta
      - link "Agendar consulta com Dra. Teste Dvazfifz":
        - /url: /appointments?professional=90197
        - text: Agendar Consulta
- alert
```

# Test source

```ts
  143 |   await expect(page.getByRole("button", { name: /Tentar de novo|Confirmar meu e-mail/ })).toHaveCount(0);
  144 | });
  145 | 
  146 | test("cadastro mostra os erros da API no campo certo", async ({ page }) => {
  147 |   await page.goto("/register/patient");
  148 |   await page.getByLabel("Nome completo").fill("Ana Paciente");
  149 |   await page.getByLabel("E-mail").fill(uniqueEmail("invalido"));
  150 |   await page.getByLabel("CPF").fill("11111111111"); // CPF inválido
  151 |   await page.getByLabel("Celular").fill("11988887777");
  152 |   await page.getByLabel("Data de nascimento").fill("2015-01-01"); // menor de idade
  153 |   await page.getByLabel("Senha", { exact: true }).fill(PASSWORD);
  154 |   await page.getByLabel("Repita a senha").fill("OutraSenha1");
  155 |   await page.getByLabel(/Li e aceito/).check();
  156 |   await page.getByLabel(/Autorizo o uso/).check();
  157 |   await page.getByRole("button", { name: "Criar conta" }).click();
  158 | 
  159 |   // Primeiro a confirmação de senha (conferida no Next)
  160 |   await expect(page.getByText("As senhas não são iguais")).toBeVisible();
  161 |   await expect(page.getByLabel("Nome completo")).toHaveValue("Ana Paciente"); // não apagou o que foi digitado
  162 | 
  163 |   await page.getByLabel("Senha", { exact: true }).fill(PASSWORD);
  164 |   await page.getByLabel("Repita a senha").fill(PASSWORD);
  165 |   await page.getByRole("button", { name: "Criar conta" }).click();
  166 | 
  167 |   // Depois as regras da API, cada uma embaixo do seu campo
  168 |   await expect(page.getByText("CPF inválido")).toBeVisible();
  169 |   await expect(page.getByText("É preciso ter 18 anos ou mais", { exact: true })).toBeVisible();
  170 |   await expect(page.getByLabel("CPF")).toHaveAttribute("aria-invalid", "true");
  171 | });
  172 | 
  173 | test("profissional: 3 etapas -> confirmação -> em análise -> admin aprova -> aparece na busca", async ({ page }) => {
  174 |   const adminEmail = process.env.ADMIN_EMAIL;
  175 |   const adminPassword = process.env.ADMIN_PASSWORD;
  176 |   test.skip(!adminEmail || !adminPassword, "ADMIN_EMAIL/ADMIN_PASSWORD não configurados no .env");
  177 | 
  178 |   const email = uniqueEmail("profissional");
  179 |   // Nome só com letras (a API recusa números) e já no formato padronizado
  180 |   const suffix = Array.from({ length: 8 }, () => String.fromCharCode(97 + Math.floor(Math.random() * 26))).join("");
  181 |   const name = `Dra. Teste ${suffix[0].toUpperCase()}${suffix.slice(1)}`;
  182 |   created.push(email);
  183 | 
  184 |   await page.goto("/register/professional");
  185 |   // Etapa 1
  186 |   await page.getByLabel("Nome completo").fill(name);
  187 |   await page.getByLabel("E-mail").fill(email);
  188 |   await page.getByLabel("Senha", { exact: true }).fill(PASSWORD);
  189 |   await page.getByLabel("Repita a senha").fill(PASSWORD);
  190 |   await page.getByRole("button", { name: "Continuar" }).click();
  191 |   // Etapa 2
  192 |   await expect(page.getByRole("heading", { name: /Etapa 2 de 3/ })).toBeFocused();
  193 |   await page.getByLabel("CPF").fill(randomCpf());
  194 |   await page.getByLabel("Celular").fill("11977776666");
  195 |   await page.getByLabel("Data de nascimento").fill("1985-07-01");
  196 |   await page.getByRole("button", { name: "Continuar" }).click();
  197 |   // Etapa 3: a escolha da profissão muda o campo para CRN
  198 |   await page.getByText("Nutricionista", { exact: true }).click();
  199 |   // Digitado no formato da carteira; a tela mostra igual (a API guarda "R-NNNNN")
  200 |   const crn = randomCrn();
  201 |   const [crnRegion, crnNumber] = crn.split("-");
  202 |   await page.getByLabel("Número do CRN").fill(`CRN-${crnRegion} ${crnNumber}`);
  203 |   await page.getByLabel(/Li e aceito/).check();
  204 |   await page.getByRole("button", { name: /Concluir cadastro/ }).click();
  205 |   await expect(page.getByText("nossa equipe vai verificar")).toBeVisible();
  206 | 
  207 |   await confirmEmail(page, email);
  208 |   await login(page, email);
  209 |   await expect(page.getByRole("heading", { name: "Cadastro: Em análise" })).toBeVisible();
  210 |   await expect(page.getByText(`CRN-${crnRegion} ${crnNumber}`)).toBeVisible();
  211 | 
  212 |   // Completa o perfil profissional (só PROFESSIONAL tem este formulário)
  213 |   await page.getByLabel("Bio").fill("Nutrição comportamental para adultos.");
  214 |   await page.getByLabel("Valor da consulta (R$)").fill("180,00");
  215 |   // Duração e público (filtros da busca)
  216 |   await page.getByLabel("Duração da consulta").selectOption("60");
  217 |   await page.getByLabel("Adultos").check();
  218 |   await page.getByLabel("Idosos").check();
  219 |   await page.getByRole("button", { name: "Salvar perfil" }).click();
  220 |   await expect(page.getByRole("main").getByRole("status")).toContainText("Perfil profissional atualizado");
  221 |   await expect(page.getByText("Cada consulta dura 60 minutos")).toBeVisible();
  222 | 
  223 |   // Ainda não aparece na busca pública
  224 |   await page.goto("/professionals?type=NUTRICIONISTA");
  225 |   await expect(page.getByText(name)).toHaveCount(0);
  226 |   await page.goto("/dashboard");
  227 |   await logout(page);
  228 | 
  229 |   // Admin aprova
  230 |   await login(page, adminEmail!, adminPassword!);
  231 |   await expect(page).toHaveURL(/\/admin\/professionals$/);
  232 |   // Atalho para conferir o registro no site oficial do conselho
  233 |   const review = page.getByRole("listitem").filter({ hasText: name });
  234 |   await expect(review.getByRole("link", { name: /Consultar no CFN/ })).toHaveAttribute("href", /cnn\.cfn\.org\.br/);
  235 |   await expect(review.getByRole("link", { name: /Consultar no CFN/ })).toHaveAttribute("target", "_blank");
  236 |   await expect(review.getByRole("button", { name: /Copiar número/ })).toBeVisible();
  237 |   await page.getByRole("button", { name: `Aprovar ${name}` }).click();
  238 |   await expect(page.getByRole("button", { name: `Aprovar ${name}` })).toHaveCount(0);
  239 | 
  240 |   // Agora aparece na busca logada, sem dados pessoais
  241 |   await page.goto("/professionals?type=NUTRICIONISTA");
  242 |   const card = page.getByRole("listitem").filter({ hasText: name });
> 243 |   await expect(card).toContainText("R$ 180,00");
      |                      ^ Error: expect(locator).toContainText(expected) failed
  244 |   await expect(card).not.toContainText(email);
  245 |   await logout(page);
  246 | });
  247 | 
  248 | test("esqueci a senha -> link por e-mail -> nova senha -> login", async ({ page }) => {
  249 |   const email = uniqueEmail("senha");
  250 |   created.push(email);
  251 |   await registerPatient(page, email);
  252 |   await confirmEmail(page, email);
  253 | 
  254 |   await page.goto("/login");
  255 |   await page.getByRole("link", { name: "Esqueceu sua senha?" }).click();
  256 |   // Espera a tela nova: o login também tem um campo "E-mail", e preencher
  257 |   // antes da troca de página deixava o formulário de recuperação vazio
  258 |   await expect(page.getByRole("heading", { level: 1, name: "Esqueceu sua senha?" })).toBeVisible();
  259 |   await page.getByLabel("E-mail").fill(email);
  260 |   await page.getByRole("button", { name: "Enviar link" }).click();
  261 |   await expect(page.getByRole("main").getByRole("status")).toContainText("Se houver uma conta");
  262 | 
  263 |   await page.goto(await linkFromEmail(email, "/reset-password"));
  264 |   await page.getByLabel("Nova senha", { exact: true }).fill("NovaSenha99");
  265 |   await page.getByLabel("Repita a nova senha").fill("NovaSenha99");
  266 |   await page.getByRole("button", { name: "Salvar nova senha" }).click();
  267 |   await expect(page.getByRole("main").getByRole("status")).toContainText("Senha alterada");
  268 | 
  269 |   await login(page, email, "NovaSenha99");
  270 |   await expect(page).toHaveURL(/\/dashboard$/);
  271 |   await logout(page);
  272 |   // Limpeza usa a senha nova
  273 |   await deleteAccountViaApi(email, "NovaSenha99");
  274 | });
  275 | 
  276 | test("excluir conta pela tela apaga o acesso", async ({ page }) => {
  277 |   const email = uniqueEmail("excluir");
  278 |   await registerPatient(page, email);
  279 |   await confirmEmail(page, email);
  280 |   await login(page, email);
  281 |   await expect(page).toHaveURL(/\/dashboard$/); // espera o login terminar (cookie gravado)
  282 | 
  283 |   await page.goto("/account");
  284 |   await page.getByRole("button", { name: "Quero excluir minha conta" }).click();
  285 |   await page.getByLabel('Digite "EXCLUIR" para confirmar').fill("EXCLUIR");
  286 |   await page.getByLabel("Sua senha").fill(PASSWORD);
  287 |   await page.getByRole("button", { name: "Excluir definitivamente" }).click();
  288 |   await expect(page).toHaveURL(/\/\?account-deleted=1$/);
  289 | 
  290 |   await login(page, email);
  291 |   await expect(page.getByRole("main").getByRole("alert")).toContainText("E-mail ou senha incorretos");
  292 | });
  293 | 
```