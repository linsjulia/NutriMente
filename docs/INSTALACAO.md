# 🛠️ Guia de instalação do NutriMente

Passo a passo para rodar o projeto inteiro (site, API, bancos e e-mail) no seu computador, **do zero**. Siga na ordem; cada passo diz como conferir se deu certo antes de ir para o próximo.

> ⏱️ Na primeira vez leva de 30 a 60 minutos, a maior parte esperando downloads. Depois, para rodar no dia a dia, são 2 comandos.

---

## 1. O que você vai precisar

### Computador

| | Mínimo | Recomendado |
|---|---|---|
| **Sistema** | Windows 10 (64 bits, versão 22H2) ou 11, macOS 13+ ou Linux | Windows 11 ou macOS recente |
| **Memória (RAM)** | 8 GB | 16 GB |
| **Espaço livre em disco** | 15 GB | 25 GB |
| **Internet** | Necessária na primeira instalação (≈ 6 GB de downloads) | — |

Por que tanto? Os containers usam cerca de **1,7 GB de RAM** (só o SQL Server usa 1 GB), e as imagens do Docker ocupam cerca de **5 GB**.

> 💻 **Windows**: a virtualização precisa estar ligada na BIOS (quase sempre já vem ligada). Confira em *Gerenciador de Tarefas > Desempenho > CPU > Virtualização: Habilitado*.
>
> 🍎 **Mac com chip Apple (M1, M2, M3...)**: funciona, mas o SQL Server roda em modo de emulação. No Docker Desktop, ative *Settings > General > "Use Rosetta for x86/amd64 emulation on Apple Silicon"*.

### Programas

| Programa | Versão | Para quê | Obrigatório? |
|---|---|---|---|
| [Git](https://git-scm.com/downloads) | qualquer recente | Baixar o código e enviar alterações | ✅ |
| [Node.js](https://nodejs.org) | **22 LTS ou mais nova** | Rodar o site (Next.js) e os testes | ✅ |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | qualquer recente | Rodar SQL Server, MongoDB, API Java, serviço de logs e e-mail | ✅ |
| [VS Code](https://code.visualstudio.com/) | qualquer | Editar o código | Recomendado |
| [JDK 25](https://adoptium.net/) | 25 | Só para **programar a API Java** na IDE | Opcional |

**Não precisa instalar** SQL Server, MongoDB, Java nem Maven para *rodar* o projeto: tudo isso roda dentro do Docker.

### Portas usadas

O projeto usa estas portas do seu computador. Se algum outro programa já usa uma delas, veja "Problemas comuns" no final.

| Porta | Serviço |
|---|---|
| 3000 | Site (Next.js) |
| 8080 | API Java |
| 4000 | Serviço de logs (Node.js) |
| 8025 | Mailpit: página com os e-mails de teste |
| 1025 | Mailpit: recebimento dos e-mails |
| 1433 | SQL Server |
| 27017 | MongoDB |

---

## 2. Instalando os programas

### 2.1 Git

1. Baixe em https://git-scm.com/downloads e instale com as opções padrão (no Windows, ele instala também o **Git Bash**).
2. Configure seu nome e e-mail (os mesmos do GitHub):

   ```bash
   git config --global user.name "Seu Nome"
   git config --global user.email "seu-email@exemplo.com"
   ```

**Conferir:** `git --version` mostra um número de versão.

### 2.2 Node.js

1. Baixe a versão **LTS** (22 ou mais nova) em https://nodejs.org e instale com as opções padrão.
2. **Feche e abra o terminal de novo** (senão ele não encontra o `node`).

**Conferir:** `node --version` deve mostrar `v22` ou maior, e `npm --version` mostra um número.

> Se aparecer `v18` ou `v20`, desinstale e instale a LTS atual: o serviço de logs e os testes do banco precisam do Node 22.

### 2.3 Docker Desktop

**Windows:**

1. Abra o **PowerShell como administrador** e instale o WSL 2 (o Linux que o Docker usa por baixo):

   ```powershell
   wsl --install
   ```

2. **Reinicie o computador.**
3. Baixe e instale o Docker Desktop. Na instalação, deixe marcado **"Use WSL 2 instead of Hyper-V"**.
4. Abra o Docker Desktop e espere aparecer **"Engine running"** (ícone da baleia verde no canto da barra de tarefas).

**macOS:** baixe a versão do seu chip (Apple ou Intel), arraste para *Aplicativos* e abra. Lembre de ligar o Rosetta (ver acima) se o seu Mac for Apple Silicon.

**Linux:** siga https://docs.docker.com/engine/install/ e instale também o plugin `docker compose`.

**Conferir:**

```bash
docker --version
docker compose version
docker run --rm hello-world
```

O último comando deve imprimir *"Hello from Docker!"*.

> ⚠️ O Docker Desktop precisa estar **aberto** sempre que você for rodar o projeto.

---

## 3. Baixando o projeto

Escolha uma pasta **sem acentos nem espaços** no caminho (ex.: `C:\Projetos`) e rode:

```bash
git clone https://github.com/linsjulia/NutriMentee.git
cd NutriMentee
```

**Conferir:** dentro da pasta existem `app/`, `backend/`, `database/`, `services/` e `docker-compose.yml`.

> Se a pasta `backend/` não existir, a `main` ainda não recebeu a API. As branches entram na `main` nesta ordem: `feat/database-sqlserver-mongodb` → `feat/backend-logs-service` → `feat/backend-api-auth` → `feat/frontend-accessibility` → `feat/frontend-auth-crud`. Peça para a equipe aceitar os Pull Requests que faltam.

---

## 4. Configurando o `.env`

O `.env` guarda senhas e configurações. Ele **nunca vai para o GitHub** (já está no `.gitignore`); cada pessoa cria o seu a partir do modelo.

### 4.1 Criar o arquivo

```bash
# Git Bash, macOS ou Linux
cp .env.example .env
```

```powershell
# Windows (PowerShell)
Copy-Item .env.example .env
```

### 4.2 Trocar os valores

Abra o `.env` no VS Code e troque **pelo menos** estes:

| Variável | Regra | Exemplo |
|---|---|---|
| `MSSQL_SA_PASSWORD` | 8+ caracteres, com **maiúscula, minúscula, número e símbolo**. Senha fraca = o SQL Server não liga | `Nutri_Sa_2026!` |
| `NUTRIMENTE_DB_PASSWORD` | Mesma regra acima | `Nutri_App_2026!` |
| `MONGO_ROOT_PASSWORD` e `MONGO_APP_PASSWORD` | Qualquer senha | — |
| `LOGS_API_KEY` | Qualquer texto | — |
| `JWT_SECRET` | **32 ou mais caracteres aleatórios** (ver abaixo) | — |
| `ADMIN_EMAIL` e `ADMIN_PASSWORD` | Login do primeiro administrador. Senha com letras e números, 8+ caracteres | `admin@nutrimente.local` |

**Gerar o `JWT_SECRET`** (funciona em qualquer sistema, porque usa o Node):

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

Copie o resultado e cole depois de `JWT_SECRET=`.

> ⚠️ Não use aspas nem espaços em volta dos valores: `JWT_SECRET=abc123...`, e não `JWT_SECRET = "abc123..."`.

---

## 5. Subindo o back-end (Docker)

Com o **Docker Desktop aberto**, na pasta do projeto:

```bash
docker compose up -d --build
```

Na primeira vez ele baixa as imagens e compila a API Java: **de 5 a 15 minutos**, dependendo da internet. Depois, confira:

```bash
docker compose ps
```

Espere até os 5 serviços aparecerem como **healthy**:

```text
nutrimente-api            Up (healthy)
nutrimente-logs-service   Up (healthy)
nutrimente-mailpit        Up (healthy)
nutrimente-mongodb        Up (healthy)
nutrimente-sqlserver      Up (healthy)
```

Se algum ficar como *starting* por mais de 3 minutos, ou *restarting*, veja o motivo:

```bash
docker compose logs sqlserver    # ou api, mongodb, logs-service
```

**Conferir no navegador:** http://localhost:8080/actuator/health deve mostrar um texto com `"status":"UP"`.

---

## 6. Rodando o site (Next.js)

Ainda na pasta do projeto:

```bash
npm install      # só na primeira vez (ou quando o package.json mudar)
npm run dev
```

Quando aparecer `✓ Ready`, abra **http://localhost:3000**.

> O terminal fica "preso" mostrando os logs do site: é normal. Para parar, aperte `Ctrl + C`.

---

## 7. Primeiro acesso: testando tudo

1. **Entre como administrador**: http://localhost:3000/login com o `ADMIN_EMAIL` e o `ADMIN_PASSWORD` do seu `.env`. Você cai na tela "Verificação de profissionais".
2. Clique em **Sair**.
3. **Cadastre um paciente** em http://localhost:3000/register → *Sou paciente*. Use um CPF válido (gere um em qualquer "gerador de CPF" de teste) e uma data de nascimento de alguém com 18 anos ou mais.
4. **Confirme o e-mail**: os e-mails **não** vão para a sua caixa de entrada. Abra o **Mailpit** em http://localhost:8025, abra a mensagem "Confirme seu e-mail" e clique no botão.
5. **Entre** com o paciente.
6. Para testar o profissional: cadastre em *Sou profissional*, confirme pelo Mailpit, entre como admin e clique em **Aprovar**. O profissional passa a aparecer em http://localhost:3000/professionals.

Se tudo isso funcionou, a instalação está completa. 🎉

---

## 8. No dia a dia

### Para começar a trabalhar

```bash
# 1. Abra o Docker Desktop e espere "Engine running"
# 2. Na pasta do projeto:
git switch main && git pull     # pega as novidades da equipe
docker compose up -d            # liga o back-end
npm run dev                     # liga o site
```

### Para parar

```bash
# Ctrl + C no terminal do site, e depois:
docker compose down             # desliga o back-end (os dados continuam salvos)
```

### Depois de puxar alterações da equipe (`git pull`)

| O que mudou | O que fazer |
|---|---|
| `package.json` | `npm install` |
| Algo em `backend/` ou `services/` | `docker compose up -d --build` |
| Algo em `database/` (tabelas) | `docker compose down -v` e `docker compose up -d --build` (⚠️ **apaga os dados locais**) |
| `.env.example` | Compare com o seu `.env` e copie as variáveis novas |

### Criando uma alteração

Nunca trabalhe direto na `main`:

```bash
git switch main && git pull
git switch -c feat/frontend-minha-tela    # ou feat/backend-..., fix/...
# ... alterações ...
git add .
git commit -m "feat(frontend): descreve a mudança"
git push -u origin feat/frontend-minha-tela
```

Depois abra um **Pull Request** no GitHub.

---

## 9. Rodando os testes (opcional)

Todos precisam do back-end ligado (`docker compose up -d`).

| Parte | Comando | Primeira vez |
|---|---|---|
| Site (fluxos completos + acessibilidade) | `npm run test:e2e` | `npx playwright install chromium` |
| Bancos | `cd database/tests && npm test` | `npm install` dentro da pasta |
| Serviço de logs | `cd services/logs-service && npm test` | `npm install` dentro da pasta |
| API Java | ver [`backend/README.md`](../backend/README.md) | — |

---

## 10. Problemas comuns

| Sintoma | Causa | Solução |
|---|---|---|
| `error during connect` / `cannot find the file specified` / `Cannot connect to the Docker daemon` | Docker Desktop fechado | Abra o Docker Desktop e espere "Engine running" |
| `WSL 2 installation is incomplete` (Windows) | Falta o WSL | `wsl --install` no PowerShell como administrador e reinicie |
| `port is already allocated` / `address already in use` | Outro programa usa a porta (ex.: um SQL Server instalado no PC) | Mude a porta no `.env` (`MSSQL_PORT`, `API_PORT`, `MONGO_PORT`...) ou feche o outro programa |
| `nutrimente-sqlserver` reiniciando sem parar | Senha `MSSQL_SA_PASSWORD` fraca, ou pouca memória | Troque a senha no `.env`, rode `docker compose down -v` e suba de novo. Feche programas pesados |
| `nutrimente-api` reiniciando | `JWT_SECRET` vazio ou com menos de 32 caracteres | Gere um novo (passo 4.2) e rode `docker compose up -d` |
| Site mostra "Não foi possível falar com o servidor" | API desligada ou ainda subindo | `docker compose ps`; espere a API ficar *healthy* |
| Porta 3000 ocupada ao rodar `npm run dev` | Já existe outro `npm run dev` aberto | Feche o outro terminal, ou rode `npm run dev -- -p 3001` **e** mude `FRONTEND_URL=http://localhost:3001` no `.env` (depois `docker compose up -d`) para os links dos e-mails funcionarem |
| E-mail de confirmação não chega | Os e-mails de teste não saem do seu computador | Abra http://localhost:8025 (Mailpit) |
| `node: bad option: --env-file` ao rodar testes | Node antigo | Instale o Node 22 LTS |
| Alterei uma tabela (`.sql`) e nada mudou | Os scripts só rodam quando o banco é criado | `docker compose down -v` e `docker compose up -d --build` (apaga os dados locais) |
| Testar pelo celular na mesma rede | O Next bloqueia endereços que não conhece | Coloque o IP de "Network:" do `npm run dev` em `ALLOWED_DEV_ORIGINS` no `.env` e reinicie o `npm run dev` |
| Espaço em disco acabando | Imagens e caches antigos do Docker | `docker system prune` (não apaga os dados do banco) |

Ainda travou? Mande no grupo a saída de `docker compose ps` e de `docker compose logs <serviço>`.
