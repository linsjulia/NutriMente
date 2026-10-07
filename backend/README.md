# ☕ API do NutriMente (Java + Spring Boot)

API REST responsável por cadastro, login, perfis e permissões. Roda no Docker junto com os bancos: `docker compose up -d --build` na raiz do projeto.

| | |
|---|---|
| Endereço | http://localhost:8080 |
| Saúde | http://localhost:8080/actuator/health |
| E-mails enviados (Mailpit) | http://localhost:8025 |
| Stack | Java 25, Spring Boot 4.1, Spring Security (JWT), JPA/Hibernate, SQL Server |

## Papéis (roles)

| Papel | Como é criado | O que pode fazer |
|---|---|---|
| `PATIENT` (cliente) | Cadastro em `/register/patient` | Ver e editar o próprio perfil, excluir a conta |
| `PROFESSIONAL` | Cadastro em `/register/professional` (com CRN ou CRP) | Tudo do paciente + editar bio e valor da consulta. Só aparece na busca **depois de aprovado** por um admin |
| `ADMIN` | Criado sozinho na primeira subida, com `ADMIN_EMAIL` / `ADMIN_PASSWORD` do `.env` | Aprovar ou recusar profissionais |

Todo mundo precisa **confirmar o e-mail** antes do primeiro login.

## Rotas

### Públicas

| Método | Rota | O que faz |
|---|---|---|
| POST | `/api/auth/register/patient` | Cadastro de cliente |
| POST | `/api/auth/register/professional` | Cadastro de profissional |
| POST | `/api/auth/verify-email` | Confirma o e-mail (`{"token": "..."}` do link) |
| POST | `/api/auth/resend-verification` | Reenvia o e-mail de confirmação |
| POST | `/api/auth/login` | Login: devolve o token JWT |
| POST | `/api/auth/forgot-password` | Envia o link de redefinição de senha |
| POST | `/api/auth/reset-password` | Define a nova senha (`{"token", "password"}`) |
| GET | `/api/professionals?type=PSICOLOGO&specialty=3&minPrice=100&maxPrice=200&sort=PRICE_ASC` | Profissionais aprovados (paginado), com as especialidades; filtros e ordenação opcionais (detalhes em [docs/API.md](../docs/API.md)) |
| GET | `/api/specialties?type=NUTRICIONISTA` | Especialidades (todas ou de uma profissão) |
| GET | `/api/professionals/{id}/slots?from=2026-10-20&days=7` | Horários livres para agendar |
| GET | `/api/professionals/{id}` | Um profissional aprovado |

### Com login (header `Authorization: Bearer <token>`)

| Método | Rota | Papel | O que faz |
|---|---|---|---|
| GET | `/api/me` | todos | Meus dados (CPF volta mascarado) |
| PUT | `/api/me` | todos | Editar nome, celular e gênero |
| PUT | `/api/me/password` | todos | Trocar a senha |
| DELETE | `/api/me` | PATIENT, PROFESSIONAL | Excluir a conta (pede a senha; os dados pessoais são anonimizados) |
| PUT | `/api/me/professional-profile` | PROFESSIONAL | Editar bio, valor da consulta e especialidades (`specialtyIds`, até 5, da própria profissão) |
| GET | `/api/admin/professionals?status=PENDING` | ADMIN | Fila de verificação |
| GET / PUT | `/api/me/availability` | PROFESSIONAL | Horários de atendimento semanais |
| POST | `/api/appointments` | PATIENT | Agendar consulta |
| GET | `/api/appointments?scope=UPCOMING\|PAST` | PATIENT, PROFESSIONAL | Minhas consultas (próximas ou histórico) |
| GET | `/api/appointments/{id}` | participantes | Uma consulta |
| POST | `/api/appointments/{id}/cancel` | participantes | Cancelar (paciente até 24 h antes) |
| POST | `/api/appointments/{id}/reschedule` | PATIENT | Remarcar |
| POST | `/api/appointments/{id}/confirm` / `complete` | PROFESSIONAL | Confirmar / concluir |
| PATCH | `/api/admin/professionals/{id}/verification` | ADMIN | `{"status": "APPROVED"}` ou `"REJECTED"` |
| POST | `/api/admin/specialties` | ADMIN | Nova especialidade `{"name", "type"}` |
| DELETE | `/api/admin/specialties/{id}` | ADMIN | Remove (sai também do perfil de quem a marcou) |

### Formato dos erros

Todo erro segue o mesmo formato ([RFC 9457](https://www.rfc-editor.org/rfc/rfc9457)):

```json
{
  "status": 400,
  "code": "VALIDATION_ERROR",
  "detail": "Revise os campos destacados.",
  "errors": { "cpf": "CPF inválido", "birthDate": "É preciso ter 18 anos ou mais" }
}
```

O `code` é estável e o front decide o que fazer por ele: `EMAIL_NOT_VERIFIED` mostra "reenviar e-mail", `ACCOUNT_LOCKED` sugere redefinir a senha, e assim por diante.

## Segurança (o que já está implementado)

- **Senhas com BCrypt**: o banco nunca guarda a senha, só o hash.
- **Token JWT** assinado (HS256), com validade de 8 horas. Contém só o id, o papel e o primeiro nome.
- **Bloqueio após 5 senhas erradas** seguidas, por 15 minutos.
- **Limite de requisições por IP** nas rotas `/api/auth/**` (30 por minuto, `AUTH_RATE_LIMIT_PER_MINUTE`). Passou disso, a API responde `429` com o header `Retry-After`. Complementa o bloqueio por conta: impede que um robô teste uma senha em cada uma de milhares de contas.
- **IP real e não forjável**: a API só aceita o cabeçalho `X-Forwarded-For` vindo da rede interna (`server.forward-headers-strategy=native`).
- **Não revela contas cadastradas**: login errado, "esqueci a senha" e "reenviar e-mail" respondem igual, exista o e-mail ou não. O login leva o mesmo tempo nos dois casos.
- **Links de e-mail de uso único**: só o hash vai para o banco, com validade de 24 h (confirmação) ou 1 h (senha).
- **O id do usuário vem sempre do token**, nunca da URL, então ninguém edita a conta de outra pessoa trocando um número.
- **Cadastro não aceita `role`**: o papel é definido pela rota, não pelo JSON.
- **LGPD**: consentimentos registrados com versão e data, CPF mascarado nas respostas, exclusão de conta por anonimização, auditoria no MongoDB.

## Estrutura

```text
src/main/java/br/com/nutrimente/api/
├── auth/          cadastro, login, confirmação de e-mail, senha
├── account/       "minha conta" (/api/me)
├── professional/  lista pública de profissionais
├── admin/         aprovação de profissionais e cadastro de especialidades
├── specialty/     especialidades (lista pública)
├── appointment/   agenda: horários de atendimento, horários livres e consultas
├── user/          entidades User, Patient, Professional e repositórios
├── notification/  e-mails
├── logging/       envio de logs para o serviço Node.js
├── common/        erros, validações (@Cpf, @Adult, @StrongPassword)
└── config/        segurança, JWT, propriedades, criação do admin
```

## Testes

Testes de integração passam pela API inteira (HTTP → segurança → banco real). Precisam dos containers ligados; cada teste apaga os usuários que criou.

```bash
# Com Java 25 instalado:
cd backend
./mvnw test          # Windows: mvnw.cmd test

# Sem Java instalado (usa o Maven dentro do Docker):
docker run --rm --network nutrimente_default --env-file .env -e DB_HOST=sqlserver \
  -v nutrimente-m2:/root/.m2 -v "$(pwd)/backend:/app" -w /app \
  maven:3.9-eclipse-temurin-25 mvn -B test
```

## Rodando fora do Docker (para desenvolver com a IDE)

1. Suba só a infraestrutura: `docker compose up -d sqlserver mongodb logs-service mailpit`
2. Abra a pasta `backend` no IntelliJ ou no VS Code (Extension Pack for Java).
3. Configure as variáveis de ambiente do `.env` (no mínimo `NUTRIMENTE_DB_PASSWORD`, `JWT_SECRET` e `LOGS_API_KEY`) e rode `NutrimenteApiApplication`.

## Em produção

O passo a passo completo (Hostinger, HTTPS com Caddy, SMTP e backups) está em [docs/DEPLOY-HOSTINGER.md](../docs/DEPLOY-HOSTINGER.md). Os itens abaixo já estão resolvidos no `docker-compose.prod.yml`.

- **Coloque um proxy reverso** (nginx, Caddy ou o da hospedagem) na frente do Next.js, acrescentando o IP do visitante no `X-Forwarded-For`. Sem ele, o Next repassa o cabeçalho que o próprio visitante mandou, e o IP dos logs, dos consentimentos e do limite de tentativas pode ser forjado.
- **Não exponha a porta da API** (8080) na internet: só o servidor do Next deve chamá-la.
- **Troque o Mailpit por um SMTP real** (`MAIL_HOST`, `MAIL_PORT`) e use HTTPS.
- O limite de tentativas fica na memória da API. Com várias cópias da API rodando, use um contador compartilhado (ex.: Redis).
