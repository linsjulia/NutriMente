# 🧠🥗 NutriMente

> **Tecnologia para conectar cuidado psicológico, alimentação e pessoas.**

O **NutriMente** é uma plataforma Web desenvolvida como **Projeto Semestral Universitário** do curso superior de **Desenvolvimento de Software Multiplataforma (DSM)** da **FATEC Luigi Papaiz**.

A proposta é aproximar **profissionais de Psicologia e Nutrição** de seus clientes em um único ambiente digital, oferecendo ferramentas para acompanhamento, comunicação, consultas e gerenciamento de planos personalizados.

---

## ✦ Sobre o projeto

O NutriMente nasceu da ideia de integrar duas áreas que frequentemente se encontram no cotidiano: **saúde mental e alimentação**.

A plataforma foi projetada para proporcionar uma experiência mais personalizada e organizada tanto para clientes quanto para profissionais.

Em vez de tratar consulta, acompanhamento e comunicação como partes isoladas, o sistema busca reunir essas experiências em um único ecossistema.

```text
             NUTRIMENTE
                  │
       ┌──────────┴──────────┐
       │                     │
   🧠 Psicologia         🥗 Nutrição
       │                     │
       └──────────┬──────────┘
                  │
            👤 Cliente
                  │
          ┌───────┴───────┐
          │               │
      Acompanhamento   Comunicação
          │               │
          └───────┬───────┘
                  │
             📈 Progresso
```

---

## 🌱 Objetivos de Desenvolvimento Sustentável

O projeto está alinhado aos **Objetivos de Desenvolvimento Sustentável (ODS)** da Organização das Nações Unidas.

### ODS 3 • Saúde e Bem-Estar

> Promover saúde e bem-estar, contribuindo para ampliar o acesso a serviços relacionados à saúde mental e nutricional.

### ODS 16 • Paz, Justiça e Instituições Eficazes

> Aplicar princípios de segurança, privacidade e conformidade legal no desenvolvimento da plataforma, especialmente em relação à proteção de dados.

🔐 O projeto também considera a **Lei Geral de Proteção de Dados (LGPD), Lei nº 13.709/2018**, como parte dos requisitos de segurança e privacidade da aplicação.

---

# ✧ Funcionalidades

O NutriMente foi planejado a partir de diferentes necessidades de clientes e profissionais.

Seus recursos futuros serão:

### 📅 Gestão de consultas e agenda

* Agendamento de consultas
* Reagendamento e cancelamento
* Visualização da agenda
* Consultas online por videoconferência
* Definição de horários disponíveis
* Definição de valores das consultas

### 🔎 Perfis e busca de profissionais

* Cadastro de clientes
* Cadastro de profissionais
* Perfis profissionais personalizados
* Verificação de documentação profissional
* Busca por especialidade
* Filtros por preço
* Informações profissionais e áreas de atuação

### 🎯 Plano de ação personalizado

* Criação de planos personalizados
* Rotinas alimentares
* Definição de metas
* Checklists de acompanhamento
* Registro de progresso
* Acompanhamento periódico

### 💬 Comunicação e engajamento

* Chat interno em tempo real
* Comunicação entre cliente e profissional
* Sistema de notificações
* Avaliação dos usuários
* Histórico de interações

### 💳 Gestão financeira e legal

* Carteira digital
* Pagamentos
* Solicitação de reembolso
* Histórico financeiro
* Gerenciamento de informações de pagamento
* Recursos relacionados à privacidade e proteção de dados

---

# 🛠️ Tecnologias

A arquitetura do projeto utiliza diferentes tecnologias para construir a aplicação de forma modular.

### Front-end

<p>
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white"/>
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB"/>
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white"/>
</p>

**Next.js + React + TypeScript**

Responsável pela interface e experiência de interação dos usuários.

### Back-end

<p>
  <img src="https://img.shields.io/badge/Java-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white"/>
  <img src="https://img.shields.io/badge/Spring_Boot-6DB33F?style=for-the-badge&logo=springboot&logoColor=white"/>
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white"/>
</p>

**Java + Spring Boot**

Responsável pela API REST e pelas regras de negócio da aplicação.

**Node.js**

Serviço de logs (`services/logs-service`): recebe os logs da aplicação por HTTP e grava no MongoDB.

### Banco de dados

<p>
  <img src="https://img.shields.io/badge/SQL_Server-CC2927?style=for-the-badge&logo=microsoftsqlserver&logoColor=white"/>
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white"/>
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white"/>
</p>

**SQL Server**

Banco relacional com os dados da plataforma: usuários, consultas, planos de ação, chat e financeiro.

**MongoDB**

Banco não relacional usado para os logs: aplicação, acessos e trilha de auditoria da LGPD.

**Docker**

Sobe os bancos e o serviço de logs com um único comando, sem instalar nada além do Docker. Detalhes em [database/README.md](database/README.md).

```text
 Next.js (front) ──► API Java (Spring Boot) ──► SQL Server   (dados)
                              │
                              └──► logs-service (Node.js) ──► MongoDB   (logs)
```

---

# 🚀 Instalação e execução

> 📘 **Primeira vez?** Siga o guia completo, com requisitos de computador, instalação de cada programa e solução de problemas: **[docs/INSTALACAO.md](docs/INSTALACAO.md)**. Abaixo está o resumo.

### 1. Pré-requisitos

Instale uma vez no seu computador:

| Ferramenta | Versão | Para quê | Download |
|---|---|---|---|
| Git | qualquer recente | Baixar o código | https://git-scm.com/downloads |
| Node.js | 20 ou superior (LTS) | Rodar o front-end | https://nodejs.org |
| Docker Desktop | qualquer recente | Rodar SQL Server, MongoDB e serviço de logs | https://www.docker.com/products/docker-desktop/ |

Para conferir se deu certo, abra um terminal e rode:

```bash
git --version
node --version
docker --version
```

Cada comando deve mostrar um número de versão. No Windows, o Docker Desktop pode pedir para ativar o **WSL 2**: aceite e reinicie o computador.

### 2. Baixar o projeto

```bash
git clone https://github.com/linsjulia/NutriMentee.git
cd NutriMentee
```

### 3. Configurar as variáveis de ambiente

Copie o arquivo de exemplo para criar o seu `.env`:

```bash
# Linux, macOS ou Git Bash
cp .env.example .env

# Windows (PowerShell)
Copy-Item .env.example .env
```

Abra o `.env` e troque as senhas. A senha do SQL Server precisa ter **8 ou mais caracteres, com maiúscula, minúscula, número e símbolo**; se não tiver, o banco não liga.

> 🔐 O `.env` guarda senhas e **nunca** deve ser enviado ao GitHub. Ele já está no `.gitignore`.

### 4. Subir os bancos de dados

Com o **Docker Desktop aberto**, rode na pasta do projeto:

```bash
docker compose up -d --build
```

Na primeira vez ele baixa as imagens (alguns minutos). Depois, confira se está tudo no ar:

```bash
docker compose ps
```

Os três serviços (`nutrimente-sqlserver`, `nutrimente-mongodb` e `nutrimente-logs-service`) devem aparecer como **healthy**. O SQL Server leva uns 30 segundos para ficar pronto.

O banco, as tabelas e os dados iniciais são criados automaticamente. Para ver o andamento:

```bash
docker compose logs -f sqlserver
```

Quando aparecer `Banco de dados criado com sucesso`, está pronto. Aperte `Ctrl + C` para sair dos logs (os containers continuam rodando).

### 5. Rodar o front-end

```bash
npm install
npm run dev
```

Acesse http://localhost:3000 no navegador.

### 6. Endereços locais

| Serviço | Endereço |
|---|---|
| Front-end (Next.js) | http://localhost:3000 |
| SQL Server | `localhost,1433` |
| MongoDB | `mongodb://localhost:27017` |
| Serviço de logs | http://localhost:4000/health |

### Comandos do dia a dia

| Comando | O que faz |
|---|---|
| `npm run dev` | Roda o front-end em modo de desenvolvimento |
| `npm run build` e `npm start` | Gera e roda a versão de produção do front |
| `npm run lint` | Procura problemas no código |
| `docker compose up -d` | Liga os bancos |
| `docker compose down` | Desliga os bancos (os dados continuam salvos) |
| `docker compose down -v` | Desliga e **apaga** os dados; na próxima subida tudo é recriado do zero |
| `cd database/tests && npm test` | Roda os testes de integração dos bancos (containers ligados; `npm install` na 1ª vez) |
| `cd services/logs-service && npm test` | Roda os testes de integração do serviço de logs (containers ligados; `npm install` na 1ª vez) |

### Problemas comuns

| Sintoma | Solução |
|---|---|
| `error during connect` ou `cannot find the file specified` | O Docker Desktop não está aberto. Abra e espere o ícone ficar verde. |
| `port is already allocated` | A porta já está em uso (ex.: um SQL Server instalado no PC). Mude `MSSQL_PORT`, `MONGO_PORT` ou `LOGS_SERVICE_PORT` no `.env`. |
| `nutrimente-sqlserver` reiniciando sem parar | A senha `MSSQL_SA_PASSWORD` é fraca. Troque no `.env` e rode `docker compose down -v` e depois `docker compose up -d --build`. |
| Alterei um script `.sql` e nada mudou | Os scripts só rodam na criação do banco. Rode `docker compose down -v` e suba de novo (apaga os dados locais). |

### Fluxo de contribuição

Nunca envie alterações direto para a `main`. Crie uma branch para cada mudança:

```bash
git switch main
git pull
git switch -c feature/nome-da-funcionalidade   # ou fix/nome-do-bug
# ... faça as alterações ...
git add .
git commit -m "feat: descreve a mudança"
git push -u origin feature/nome-da-funcionalidade
```

Depois abra um **Pull Request** no GitHub para a equipe revisar antes de juntar na `main`.

---

# 🎨 Design & Desenvolvimento

A experiência do usuário também faz parte da construção do NutriMente.

### Ferramentas

<p>
  <img src="https://img.shields.io/badge/Figma-F24E1E?style=for-the-badge&logo=figma&logoColor=white"/>
  <img src="https://img.shields.io/badge/Inkscape-000000?style=for-the-badge&logo=inkscape&logoColor=white"/>
  <img src="https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white"/>
  <img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white"/>
</p>

**Figma**
Prototipação e desenvolvimento da interface.

**Inkscape**
Criação de elementos vetoriais e identidade visual.

**Git & GitHub**
Versionamento, colaboração e gerenciamento do código-fonte.

**Acessibilidade & Responsividade**
A interface é planejada para diferentes dispositivos e busca seguir boas práticas de acessibilidade e usabilidade.

---

# 👥 Equipe

<a href="https://github.com/deivid-afonso"> Daivid da Silva Afonso </a>

<a href="https://github.com/gabymonteiiro"> Gabriely Benito Monteiro</a> 

Helder Virissio Araujo

<a href="https://github.com/linsjulia"> Julia Lins Pereira da Silva (Líder)</a>

<a href="https://github.com/vitorromualdo2009-boop"> Vitor Antonio Romualdo</a> 

---

# 🎓 Orientadores

**Lucio Nunes de Lira**

**Bruno Zolotareff dos Santos**

**Patricia Gallo**

**Luiz Antonio**

**Rafael Miranda**

---

<div align="center">

### 🧠 + 🥗 + 💻

**NutriMente**

*Conectando tecnologia, cuidado e acompanhamento.*

---

Desenvolvido como projeto acadêmico da
**FATEC Luigi Papaiz • DSM**

</div>
