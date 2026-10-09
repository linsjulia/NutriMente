# 🎤 Apresentação do NutriMente (30/10)

Guia da equipe para a apresentação: **roteiro com falas**, **checklist técnico** (véspera e dia), **plano B** e **perguntas prováveis da banca**.

A demonstração roda **na máquina local** (Docker + site em modo de produção), com os **dados de demonstração** já carregados. Não depende de internet.

> As telas citadas abaixo são as do front que está sendo construído. Se alguma não ficar pronta a tempo, use o **plano B** (seção 4): a mesma jornada narrada no terminal, com a API de verdade.

---

## 1. Mensagem central

Em uma frase, o que a banca precisa lembrar:

> **O NutriMente junta nutrição e psicologia num só lugar: o paciente encontra o profissional, agenda, recebe um plano de ação e é acompanhado no dia a dia, e o profissional enxerga a evolução.**

Três diferenciais para repetir ao longo da apresentação:

1. **Cuidado integrado:** nutricionista e psicóloga acompanhando a mesma paciente, cada uma com seu plano.
2. **Acompanhamento contínuo:** o cuidado não acaba na consulta (checklist diário, metas, adesão da semana, registro de peso e humor).
3. **Confiável e acessível:** profissionais verificados pelo admin, LGPD desde o início, acessibilidade (tamanho da fonte e alto contraste) e 133 testes automáticos rodando a cada mudança.

## 2. Contas da demonstração

Senha de todas: **`Demo1234`** (o admin usa a senha do `.env`).

| Quem | E-mail | O que já tem |
|---|---|---|
| Ana Souza (paciente) | `ana@nutrimente.demo` | 2 consultas futuras (1 confirmada, com link de vídeo), histórico, **1 consulta para avaliar**, **2 planos de ação** com o **checklist de hoje em aberto**, notificações |
| Camila Rocha (nutricionista) | `camila@nutrimente.demo` | Agenda cheia (consultas para confirmar), plano da Ana com 71% de adesão, notificações |
| Mariana Ribeiro (psicóloga) | `mariana@nutrimente.demo` | Plano de autocuidado da Ana |
| Admin | `ADMIN_EMAIL` do `.env` | **André Nogueira** aguardando aprovação |

E-mails enviados pelo sistema aparecem no **Mailpit**: http://localhost:8025.

## 3. Roteiro (cerca de 15 minutos)

Ajuste os tempos ao limite da banca. Os papéis abaixo são sugestão: combinem quem faz cada parte e **ensaiem com o computador da apresentação**.

| # | Tempo | Quem | O que mostrar | Conta |
|---|---|---|---|---|
| 1 | 1 min | Pessoa 1 | Abertura: o problema e a proposta | — |
| 2 | 1 min | Pessoa 1 | Página inicial e acessibilidade | visitante |
| 3 | 2 min | Pessoa 2 | Busca e perfil do profissional | visitante |
| 4 | 2 min | Pessoa 2 | Agendamento, e-mail e notificação | Ana |
| 5 | 2 min | Pessoa 3 | Visão do profissional: confirmar e plano de ação | Camila |
| 6 | 2 min | Pessoa 3 | Paciente no dia a dia: checklist, progresso e avaliação | Ana |
| 7 | 1 min | Pessoa 4 | Admin: verificação do profissional | Admin |
| 8 | 3 min | Pessoa 5 | Como foi construído: arquitetura, segurança, LGPD e testes | — |
| 9 | 1 min | Pessoa 1 | Encerramento e próximos passos | — |

### Passo a passo com falas

**1. Abertura (Pessoa 1)**
- Fala: "Alimentação e saúde mental andam juntas, mas o cuidado costuma ser separado: um profissional não sabe do outro, e o paciente fica sem acompanhamento entre as consultas. O NutriMente reúne os dois e acompanha o paciente no dia a dia."
- Citar o alinhamento com a **ODS 3 (Saúde e Bem-Estar)**.

**2. Página inicial e acessibilidade (Pessoa 1)**
- Mostrar a home rolando e o botão de acessibilidade: **aumentar a fonte** e **alto contraste**.
- Fala: "As preferências ficam salvas e valem em todas as páginas. Seguimos as diretrizes WCAG, e um teste automático confere a acessibilidade de cada página."

**3. Busca e perfil (Pessoa 2)**
- Na busca: filtrar **Nutricionista** → especialidade **Nutrição Comportamental** → ordenar por **preço**.
- Abrir o perfil da **Camila**: foto, especialidades, valor, **nota média** e **avaliações** (nome do paciente abreviado, "Ana S.", por privacidade).
- Fala: "Só aparecem profissionais com registro no conselho verificado pela nossa equipe."

**4. Agendamento (Pessoa 2)**
- Entrar como **Ana** → no perfil da Camila, escolher um **horário livre** → confirmar (online).
- Mostrar: a consulta em "Próximas consultas", com o **link da videochamada**. **Não abra a chamada ao vivo:** o Jitsi pede login (Google, GitHub ou Facebook) de quem abre a sala e depende de internet. Se a banca pedir, abra a aba do Jitsi já preparada no ensaio (ver checklist).
- Fala: "A consulta online usa o Jitsi Meet, que abre no navegador. O NutriMente **não grava** a chamada: gravar teleconsulta exige autorização expressa do paciente (CFN 666/2020), e o sigilo é dever ético do profissional."
- Abrir o **Mailpit** e mostrar os **dois e-mails** (para a Ana e para a Camila).
- Fala: "O sistema impede dois agendamentos no mesmo horário, mesmo que duas pessoas cliquem ao mesmo tempo."

**5. Visão do profissional (Pessoa 3)**
- Entrar como **Camila** → o **sininho** mostra "Nova consulta agendada" → **Confirmar** a consulta.
- Abrir **Meus pacientes** → **Ana** → plano "Reeducação alimentar sem neura": metas, cardápio, checklist e **adesão da semana (71%)**, mais as pesagens (72,4 → 71,6 kg).
- Fala: "A nutricionista enxerga se o plano está funcionando entre uma consulta e outra."

**6. Paciente no dia a dia (Pessoa 3)**
- Entrar como **Ana** → sininho: "Consulta confirmada" e "Novo plano de ação".
- Abrir o plano da Camila → **marcar o checklist de hoje ao vivo** → a adesão sobe na hora.
- **Registrar progresso** (peso e humor).
- Mostrar o **segundo plano**, da psicóloga **Mariana**: "Aqui está o diferencial, a mesma paciente acompanhada pela nutrição e pela psicologia."
- No histórico, **avaliar** a consulta com a Mariana → a nota dela muda na busca.

**7. Admin (Pessoa 4)**
- Entrar como **admin** → fila de verificação → **André Nogueira** (pendente) → mostrar o número do conselho → **Aprovar** (ou **Recusar** com motivo, que vai por e-mail).
- Fala: "Nenhum profissional aparece para os pacientes sem essa verificação."

**8. Como foi construído (Pessoa 5)**, com slide ou o desenho abaixo:

```text
Navegador ──► Next.js (site + "BFF")        ──► API Java (Spring Boot) ──► SQL Server (dados)
              token num cookie httpOnly           regras de negócio      └─► serviço Node.js ──► MongoDB (logs e auditoria LGPD)
                                                   e segurança               e-mails (Mailpit na demo)
```

- **Segurança:** senha com hash (BCrypt), login com token que o JavaScript da página não consegue ler (cookie httpOnly), limite de tentativas por IP, cada pessoa só enxerga os próprios dados (uma consulta de outra pessoa "não existe" para ela).
- **LGPD:** consentimentos registrados, nome abreviado nas avaliações, exclusão de conta por anonimização e trilha de auditoria (quem acessou ou alterou dados de quem) no MongoDB.
- **Qualidade:** **133 testes automáticos** (48 da API, 51 do site no navegador, 23 do banco e 11 do serviço de logs) que rodam sozinhos no GitHub a cada mudança, antes do merge.

**9. Encerramento (Pessoa 1)**
- Próximos passos: chat entre paciente e profissional, pagamento online, publicação na internet.
- Agradecer e abrir para perguntas.

---

## 4. Plano B

| Se acontecer | Faça |
|---|---|
| Uma tela não está pronta ou travou | Use a **jornada narrada no terminal** (abaixo), que mostra o mesmo fluxo pela API de verdade |
| O site não abre | `docker compose ps`: todos `healthy`? Se a API não estiver, `docker compose restart api` e espere 1 min |
| Login dá erro de "muitas tentativas" | Espere 1 minuto (limite de segurança por IP) e tente de novo |
| Os dados da demo se bagunçaram durante o ensaio | `cd database/demo && npm run seed` (~1 min) |
| Nada funciona | Mostrar o **vídeo de backup** gravado no ensaio (ver checklist) |

**Jornada narrada no terminal:**

```bash
cd database/demo
npm run jornada
```

Ela percorre, em cerca de 1 minuto: busca → perfil e avaliações → agendamento (com link de vídeo e e-mails no Mailpit) → confirmação pela nutricionista → plano de ação e adesão → marcar o checklist de hoje → avaliação → testes de segurança → cancelamento. **Ela altera os dados**: depois, rode `npm run seed` para voltar ao estado da demonstração.

---

## 5. Checklist técnico

### Na véspera (29/10), no computador da apresentação

- [ ] `git checkout main && git pull`: versão final do código.
- [ ] Docker Desktop com pelo menos **6 GB de memória** (Settings → Resources).
- [ ] **Banco limpo:** `docker compose down -v` e depois `docker compose up -d --build`; esperar todos `healthy` (`docker compose ps`).
- [ ] `cd database/demo && npm install && npm run seed`.
- [ ] Gerar o site em **modo de produção** (mais rápido, sem o botão de desenvolvimento do Next na tela e sem depender de internet para as fontes): `npm install`, `npm run build` (precisa de internet nesta etapa) e `npm run start`.
- [ ] **Ensaio completo** com o roteiro, cronometrado. Depois, `npm run seed` de novo.
- [ ] Gravar um **vídeo de backup** da demonstração (Win + G no Windows grava a tela).
- [ ] (Opcional) Se quiserem mostrar a videochamada: com internet, abrir o link de uma consulta, **entrar com uma conta Google** (vira moderador) e deixar a aba aberta para o dia.
- [ ] Testar o computador no **projetor** (resolução e tamanho da letra) e a **rede**: a demo não precisa de internet, mas confirmem.

### No dia, cerca de 30 minutos antes

- [ ] Ligar o Docker Desktop e rodar `docker compose up -d`; esperar `healthy`.
- [ ] `cd database/demo && npm run seed`: dados frescos, com as datas relativas a hoje.
- [ ] `npm run start` na raiz do projeto: site em http://localhost:3000.
- [ ] Abrir as abas na ordem do roteiro: site (visitante), **janela anônima** para a Ana, **outro navegador ou perfil** para a Camila e o admin, Mailpit.
- [ ] Zoom do navegador em **125%** (legível no projetor).
- [ ] Desligar notificações do sistema (modo "Não perturbe") e fechar programas que possam abrir janelas.
- [ ] **Não rodar os testes automáticos** nessa máquina depois do `seed`: eles criam contas de teste.
- [ ] Deixar um terminal aberto em `database/demo`, pronto para o `npm run jornada` (plano B).

---

## 6. Perguntas prováveis da banca

| Pergunta | Resposta curta |
|---|---|
| Por que dois bancos (SQL Server e MongoDB)? | SQL Server para os dados do negócio (relações, integridade, transações). MongoDB para logs e auditoria: volume grande, formato flexível e expiração automática. Cada um no que faz melhor. |
| Por que Java e Node.js? | A API principal em Java (Spring Boot) pela robustez em regras e segurança; o serviço de logs em Node.js, leve e independente. Se o serviço de logs cair, a aplicação continua funcionando. |
| Como vocês garantem a segurança do login? | Senha com hash BCrypt, token JWT guardado num cookie httpOnly (o JavaScript da página não consegue ler), limite de tentativas por IP e bloqueio de conta após erros seguidos. |
| E a LGPD? | Consentimento registrado no cadastro, coleta mínima (gênero opcional, CPF mascarado na tela), exclusão de conta por anonimização, nome abreviado nas avaliações e auditoria de quem acessou cada dado. |
| Como sabem que funciona? | 133 testes automáticos (API, banco, logs e o site no navegador, incluindo acessibilidade) rodando no GitHub a cada Pull Request. Nada entra na versão principal com teste falhando. |
| O que impede dois pacientes no mesmo horário? | A API confere a sobreposição de horários, e o banco tem uma regra de unicidade: mesmo dois cliques no mesmo instante resultam em um só agendamento. |
| Como um profissional entra na plataforma? | Ele se cadastra com o número do conselho (CRN ou CRP), e o admin confere no site do conselho antes de aprovar. Só então ele aparece na busca. |
| Funciona no celular? | Sim: todas as telas são responsivas, e testamos em larguras de celular, tablet e computador. |
| A consulta por vídeo é gravada? Onde fica salva? | Não é gravada. A chamada acontece no Jitsi Meet, direto entre os dois navegadores e o servidor do Jitsi, e nada passa pelo NutriMente. Guardamos só os dados da consulta (data, situação, valor, link) e o histórico de quem fez o quê. Gravar teleconsulta exige autorização expressa do paciente (CFN 666/2020), e o conteúdo da sessão é sigiloso. O registro que o profissional é obrigado a manter é o **prontuário** (CFP 01/2009, CFN 594/2017), e esse é o próximo passo do projeto. |
| Está publicado na internet? | Ainda não: a apresentação roda localmente. O deploy já está preparado (Docker, HTTPS automático, backups; guia em `docs/DEPLOY-HOSTINGER.md`) e é o próximo passo. |
| O que falta? | Chat entre paciente e profissional, pagamento online (em modo de teste) e o envio de foto e documento pela tela. |
