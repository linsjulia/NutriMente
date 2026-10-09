# 🔌 Contrato da API (para o front-end)

Referência das rotas da API Java para quem está construindo as telas. Cada rota tem o que enviar, o que volta e os erros possíveis.

Este arquivo cresce a cada entrega do back-end. **Rotas novas aparecem marcadas com 🆕.**

## Dados para testar as telas

Para não montar telas com o banco vazio, rode o script de demonstração (com o back-end no ar):

```bash
cd database/demo && npm install && npm run seed
```

Ele cria profissionais com foto, preço, especialidades, agenda e avaliações, pacientes e consultas. Logins prontos (senha `Demo1234`): **`ana@nutrimente.demo`** (paciente) e **`camila@nutrimente.demo`** (nutricionista). Detalhes em [database/README.md](../database/README.md#dados-de-demonstração).

## Como chamar a API no front

O navegador **nunca** chama a API direto. Quem chama é o servidor do Next, em páginas (Server Components) ou Server Actions, usando o helper `api()` de `app/lib/api.ts`:

```ts
import { api } from "@/app/lib/api";
import type { Page, PublicProfessional } from "@/app/lib/types";

// Rota pública (sem login)
const result = await api<Page<PublicProfessional>>("/api/professionals?minPrice=100&maxPrice=200");
if (!result.ok) {
  // result.error.detail -> mensagem pronta para mostrar
  // result.error.errors -> erros por campo, ex.: { minPrice: "..." }
} else {
  result.data.items; // a lista
}

// Rota que exige login: passe o token da sessão
const session = await verifySession(); // app/lib/dal.ts
await api("/api/me", { token: session.token });
```

## Erros (iguais em todas as rotas)

Todo erro volta no mesmo formato. O `api()` já entrega isso em `result.error`:

```json
{
  "status": 400,
  "code": "VALIDATION_ERROR",
  "detail": "Revise os campos destacados.",
  "errors": { "minPrice": "O valor mínimo precisa ser menor ou igual ao máximo" }
}
```

| `status` | `code` | Quando |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Algum campo ou parâmetro inválido. **`errors` diz qual**: mostre embaixo do campo |
| 400 | `INVALID_REQUEST` | Corpo da requisição em formato errado |
| 401 | `UNAUTHORIZED` | Chegou sem token: mande para o login |
| 401 | `SESSION_INVALID` | 🆕 O token não vale mais: venceu, **a senha foi trocada** (em qualquer aparelho) ou a conta foi excluída. Apague o cookie e mande para o login (o `getMe()` já faz isso) |
| 401 | `INVALID_CREDENTIALS` | Login com e-mail ou senha errados |
| 403 | `FORBIDDEN` | Logado, mas o papel não permite (ex.: paciente em rota de admin) |
| 404 | `NOT_FOUND` | Não existe, ou não é público |
| 409 | `ALREADY_EXISTS` | Duplicado (e-mail, CPF, CRN, especialidade) |
| 429 | `RATE_LIMITED` | Muitas tentativas de login ou cadastro em pouco tempo (o header `Retry-After` diz quantos segundos esperar) |

Datas e horas vêm em **UTC**, no formato ISO (`"2026-10-20T13:00:00"`). Valores em reais vêm como **número** (`150.00`); para mostrar, use `formatBRL()` de `app/lib/money.ts`.

---

## Profissionais (públicas, sem login)

### `GET /api/professionals`: busca

Lista **paginada** só com profissionais **aprovados** pelo admin, sem dados pessoais (nada de CPF, e-mail ou telefone).

| Parâmetro | Tipo | Exemplo | Descrição |
|---|---|---|---|
| `type` | `NUTRICIONISTA` \| `PSICOLOGO` | `type=PSICOLOGO` | Filtra pela profissão |
| `specialty` | número | `specialty=3` | Só quem marcou essa especialidade (ids em `GET /api/specialties`) |
| 🆕 `minPrice` | número (reais) | `minPrice=100` | Valor mínimo da consulta |
| 🆕 `maxPrice` | número (reais) | `maxPrice=200` | Valor máximo da consulta |
| 🆕 `online` | `true` | `online=true` | Só quem **atende online** (`offersOnline`) |
| 🆕 `sort` | `RELEVANCE` \| `PRICE_ASC` \| `PRICE_DESC` \| `NAME` | `sort=PRICE_ASC` | Ordenação. Padrão: `RELEVANCE` (melhor avaliados primeiro) |
| `page` | número | `page=0` | Página, começando em 0 |
| `size` | número (1 a 50) | `size=12` | Itens por página (padrão 12) |

Regras:
- Com `minPrice` ou `maxPrice`, quem deixou o preço em branco ("valor a combinar") **não aparece**.
- 🆕 `offersOnline`: o profissional declarou ter cadastro no **e-Psi** (psicólogos) ou no **e-Nutricionista** (nutricionistas), exigido pelos conselhos para atender online. Se `false`, ele **só atende presencial**: mostre um selo "Atende online" quando `true`, e na tela de agendamento ofereça só "Presencial" quando `false`.
- Nas ordenações por preço, "valor a combinar" vai para o **fim**.
- Erros: `minPrice` maior que `maxPrice`, valor negativo ou não numérico, ou `sort` desconhecido → **400** com `errors.minPrice` / `errors.sort`.

Resposta:

```json
{
  "items": [
    {
      "id": 42,
      "name": "Carla Souza",
      "photoUrl": "/doctor/pfp3.png",
      "type": "NUTRICIONISTA",
      "document": "3-12345",
      "bio": "Nutrição comportamental para adultos.",
      "consultationPrice": 150.00,
      "ratingAverage": 4.8,
      "ratingCount": 12,
      "specialties": [
        { "id": 3, "name": "Nutrição Comportamental", "type": "NUTRICIONISTA" }
      ],
      "offersOnline": true
    }
  ],
  "page": 0,
  "size": 12,
  "totalItems": 1,
  "totalPages": 1
}
```

- `consultationPrice` pode ser `null`: mostre "Valor a combinar".
- 🆕 `photoUrl`: caminho da foto (por enquanto, arquivos de `public/`, ex.: `/doctor/pfp.png`), pronto para `<Image src={p.photoUrl} ... />`. Pode ser `null`: mostre as iniciais ou um avatar padrão. Também vem em `GET /api/me` e nas consultas (`patient.photoUrl`, `professional.photoUrl`).
- `document` é o número do conselho; mostre com o prefixo `COUNCIL[type]` (`CRN` ou `CRP`, em `app/lib/types.ts`).
- Tipos TypeScript prontos: `Page<PublicProfessional>` em `app/lib/types.ts`.

### `GET /api/professionals/{id}`: perfil público ("Ver perfil")

Mesmo formato de **um item** da lista acima. Responde **404** se o profissional não existe, ainda não foi aprovado ou excluiu a conta. Nesse caso, a página deve chamar `notFound()` do Next.

```ts
const result = await api<PublicProfessional>(`/api/professionals/${id}`);
if (!result.ok && result.error.status === 404) notFound();
```

## Especialidades (pública)

### `GET /api/specialties`

| Parâmetro | Descrição |
|---|---|
| `type` (opcional) | `NUTRICIONISTA` ou `PSICOLOGO`: só as dessa profissão |

```json
[
  { "id": 4, "name": "Emagrecimento", "type": "NUTRICIONISTA" },
  { "id": 8, "name": "Ansiedade", "type": "PSICOLOGO" }
]
```

Vem em ordem alfabética (por profissão, quando sem `type`). Tipo: `Specialty[]`.

---

## Agenda e consultas (Etapa 3)

### Como funciona

```text
Profissional define os horários de atendimento (ex.: segunda 08:00-12:00)
        │
        ▼
Paciente vê os horários LIVRES (GET /slots) ──► escolhe um ──► POST /api/appointments
        │                                                         (SCHEDULED + e-mail para os dois)
        ▼
Profissional confirma (CONFIRMED) ──► depois do horário, conclui (COMPLETED)
Qualquer um pode cancelar (CANCELLED); o paciente pode remarcar (RESCHEDULED + consulta nova)
```

Regras (configuráveis em `application.properties`, `nutrimente.appointments.*`):

| Regra | Valor |
|---|---|
| Duração da consulta | 50 min |
| Intervalo entre os inícios | a cada 1 h (dentro das janelas do profissional) |
| Antecedência mínima para agendar | 2 h |
| Até quando o **paciente** cancela ou remarca | 24 h antes. O profissional cancela até o início |
| Até quantos dias à frente | 60 dias |
| Fuso dos horários de atendimento | America/Sao_Paulo |

**Datas das consultas** vêm como texto ISO em UTC com `Z` (`"2026-10-20T12:00:00Z"`). Para mostrar:

```ts
new Date(c.startsAt).toLocaleString("pt-BR", { dateStyle: "full", timeStyle: "short" });
// "terça-feira, 20 de outubro de 2026 às 09:00"
```

Para **agendar**, devolva o `startsAt` **exatamente como veio** da lista de horários livres.

### `GET /api/me/availability`: meus horários de atendimento (PROFESSIONAL)

```json
[
  { "dayOfWeek": 1, "startTime": "08:00:00", "endTime": "12:00:00" },
  { "dayOfWeek": 3, "startTime": "14:00:00", "endTime": "18:00:00" }
]
```

`dayOfWeek`: **0 = domingo**, 1 = segunda ... 6 = sábado. Vem ordenado por dia e horário.

### `PUT /api/me/availability`: salvar os horários (PROFESSIONAL)

Substitui **a agenda inteira** (mande todas as janelas, não só a que mudou). Lista vazia = sem atendimento.

```json
{ "windows": [
  { "dayOfWeek": 1, "startTime": "08:00", "endTime": "12:00" },
  { "dayOfWeek": 1, "startTime": "14:00", "endTime": "18:00" },
  { "dayOfWeek": 3, "startTime": "14:00", "endTime": "18:00" }
] }
```

Resposta: a lista salva (mesmo formato do GET). Erros **400**, com a mensagem pronta em `errors.windows`:
- término antes do início: "O horário de término precisa ser depois do início (segunda-feira, 12:00 às 08:00).";
- janela menor que uma consulta: "A janela precisa ter pelo menos 50 minutos...";
- janelas sobrepostas no mesmo dia: "Há horários sobrepostos na segunda-feira.".

### `GET /api/professionals/{id}/slots`: horários livres (público)

| Parâmetro | Padrão | Descrição |
|---|---|---|
| `from` | hoje | Data inicial, `AAAA-MM-DD` |
| `days` | 7 | Quantos dias (1 a 31) |

```json
[
  {
    "date": "2026-10-20",
    "weekday": "terça-feira",
    "slots": [
      { "startsAt": "2026-10-20T11:00:00Z", "endsAt": "2026-10-20T11:50:00Z", "time": "08:00" },
      { "startsAt": "2026-10-20T12:00:00Z", "endsAt": "2026-10-20T12:50:00Z", "time": "09:00" }
    ]
  }
]
```

- `time` já é o horário local, pronto para o botão. `weekday` já vem em português.
- Dias sem horário livre **não aparecem**. Lista vazia = nada disponível no período (sem agenda cadastrada, agenda lotada ou **profissional sem valor de consulta definido**).
- **404** se o profissional não existe ou não está aprovado.

### `POST /api/appointments`: agendar (PATIENT)

```json
{ "professionalId": 42, "startsAt": "2026-10-20T12:00:00Z", "modality": "ONLINE", "notes": "Primeira consulta",
  "screening": { "reason": "Quero parar de beliscar à noite", "symptoms": "Ansiedade no fim do dia", "moodScore": 3 } }
```

🆕 `screening` (triagem) é opcional: veja "Triagem antes da consulta" abaixo. Erros dentro dela voltam como `errors["screening.reason"]`.

`modality` é opcional: `ONLINE` ou `PRESENCIAL`. Sem ela, vira `ONLINE` se o profissional atende online (`offersOnline`), senão `PRESENCIAL`. Pedir `ONLINE` a quem não atende online → **409 `ONLINE_NOT_AVAILABLE`**. `notes` também é opcional (até 1000 caracteres). Resposta **201** com a consulta (formato abaixo). A API manda e-mail para o paciente e para o profissional.

| Erro | Quando |
|---|---|
| 409 `SLOT_UNAVAILABLE` | O horário não está mais livre (outra pessoa pegou, passou do horário, fora da agenda). `errors.startsAt` |
| 409 `PATIENT_BUSY` | O paciente já tem outra consulta nesse horário. `errors.startsAt` |
| 409 `PRICE_NOT_SET` | O profissional ainda não definiu o valor da consulta |
| 404 | Profissional inexistente ou não aprovado |
| 403 | Quem está logado não é paciente |

### Formato de uma consulta

```json
{
  "id": 7,
  "startsAt": "2026-10-20T12:00:00Z",
  "endsAt": "2026-10-20T12:50:00Z",
  "status": "SCHEDULED",
  "modality": "ONLINE",
  "videoUrl": "https://meet.jit.si/NutriMente-3f9a1c0e7b2d4a6e8f10",
  "price": 150.00,
  "notes": "Primeira consulta",
  "cancellationReason": null,
  "rescheduledFromId": null,
  "patient": { "id": 15, "name": "Ana Paciente", "photoUrl": null },
  "professional": { "id": 42, "name": "Carla Souza", "photoUrl": "/doctor/pfp3.png", "type": "NUTRICIONISTA" },
  "canCancel": true,
  "canReschedule": true,
  "canConfirm": false,
  "canComplete": false,
  "canReview": false,
  "canWriteRecord": false,
  "canEditScreening": true
}
```

- 🆕 `canEditScreening`: `true` para o **paciente** numa consulta agendada ou confirmada que ainda não começou. Mostre "Triagem" (preencher ou ajustar).

- 🆕 `canWriteRecord`: `true` para o **profissional** a partir do horário de início, se a consulta não foi cancelada nem remarcada. Mostre "Registro da consulta" (ver "Registro da consulta" abaixo).
- `canReview`: `true` para o **paciente** numa consulta `COMPLETED` que ainda não avaliou. Mostre "Avaliar" (ver "Avaliações" abaixo).
- **`can*` dizem quais botões mostrar** para quem está logado agora. Exemplo: `canConfirm` só é `true` para o profissional, numa consulta `SCHEDULED`. A API confere de novo ao receber a ação.
- `status`: `SCHEDULED` (agendada), `CONFIRMED` (confirmada), `COMPLETED` (realizada), `CANCELLED` (cancelada), `RESCHEDULED` (remarcada; a nova consulta aponta para ela em `rescheduledFromId`).
- `videoUrl`: link da videochamada (Jitsi Meet). Abra **numa aba nova** (`target="_blank"`), **não** dentro do site: no meet.jit.si público, a chamada embutida (iframe) cai em 5 minutos. Quem **abre a sala** (o primeiro a entrar) precisa entrar com uma conta Google, GitHub ou Facebook; os outros entram direto. Por isso, oriente na tela: **"O profissional entra primeiro"**. `null` na presencial. Nada da chamada é gravado pelo NutriMente.
- `price`: o valor **combinado no agendamento**. Não muda se o profissional alterar o preço depois.

### `GET /api/appointments`: minhas consultas (PATIENT ou PROFESSIONAL)

| `scope` | O que traz |
|---|---|
| `UPCOMING` (padrão) | Agendadas e confirmadas que ainda não terminaram, **da mais próxima** para a mais distante |
| `PAST` | Realizadas, canceladas, remarcadas ou que já passaram, **da mais recente** para a mais antiga |

Resposta: lista de consultas (até 100). Serve para os dois painéis: o paciente vê `professional.name` e o profissional vê `patient.name`.

### `GET /api/appointments/{id}`

Uma consulta. **404** se não existe **ou se quem pede não participa dela**: ninguém vê consulta de outra pessoa.

### Ações (todas devolvem a consulta atualizada)

| Rota | Quem | Corpo | Erros |
|---|---|---|---|
| `POST /api/appointments/{id}/cancel` | paciente ou profissional | opcional: `{ "reason": "Imprevisto" }` (até 500) | 409 `TOO_LATE` (paciente a menos de 24 h), 409 `INVALID_STATUS` (já cancelada, já começou) |
| `POST /api/appointments/{id}/reschedule` | paciente | `{ "startsAt": "2026-10-22T13:00:00Z" }` (um horário livre) | 409 `TOO_LATE`, `SLOT_UNAVAILABLE`, `PATIENT_BUSY`; 403 se for o profissional |
| `POST /api/appointments/{id}/confirm` | profissional | — | 409 `INVALID_STATUS` (não está `SCHEDULED`) |
| `POST /api/appointments/{id}/complete` | profissional | — | 409 `INVALID_STATUS` (antes do horário de início) |

Cancelar, remarcar e confirmar mandam e-mail para a outra pessoa. Na remarcação, a resposta é a **consulta nova**.

### Sugestão de telas

- **Perfil do profissional:** botão "Agendar" → lista de dias e horários (`/slots`) → confirmação com valor e modalidade → `POST /api/appointments`.
- **Painel do paciente:** "Próximas consultas" (`UPCOMING`) com link da videochamada e botões Cancelar/Remarcar (conforme `canCancel`/`canReschedule`), mais um "Histórico" (`PAST`).
- **Painel do profissional:** "Meus horários" (GET/PUT availability) e "Agenda" (`UPCOMING`, com botões Confirmar e Concluir).

---

## Avaliações (Etapa 4)

### `POST /api/appointments/{id}/review`: avaliar uma consulta (PATIENT)

```json
{ "rating": 5, "comment": "Muito atenciosa, saí com um plano possível de seguir!" }
```

- `rating`: de 1 a 5 (obrigatório). `comment`: opcional, até 1000 caracteres.
- Só vale para consulta **realizada** (`COMPLETED`) de que a pessoa foi a paciente, e **uma vez** por consulta. Use `canReview` da consulta para mostrar o botão.
- A nota média (`ratingAverage`) e a quantidade (`ratingCount`) do profissional são **recalculadas na hora**: a busca e o perfil já mostram a nota nova.

Resposta **201** (mesmo formato da lista abaixo). Erros:

| Erro | Quando |
|---|---|
| 400 `VALIDATION_ERROR` | `errors.rating`: "Escolha de 1 a 5 estrelas"; `errors.comment`: comentário longo demais |
| 409 `NOT_COMPLETED` | A consulta ainda não foi realizada |
| 409 `ALREADY_REVIEWED` | Essa consulta já foi avaliada |
| 403 | O profissional tentando avaliar |
| 404 | A consulta não existe ou não é dessa pessoa |

### `GET /api/professionals/{id}/reviews`: avaliações no perfil (público)

Paginada (`page`, `size` até 50, padrão 10), **das mais recentes para as mais antigas**:

```json
{
  "items": [
    {
      "id": 31,
      "rating": 5,
      "comment": "A Camila é muito acolhedora.",
      "patientName": "Ana S.",
      "createdAt": "2026-09-16T14:50:00Z"
    }
  ],
  "page": 0, "size": 10, "totalItems": 4, "totalPages": 1
}
```

- `patientName` vem **abreviado** ("Ana S.") por privacidade: quem se consulta com quem é dado de saúde (LGPD). Conta excluída aparece como "Paciente".
- `comment` pode ser `null` (avaliação só com estrelas).
- **404** se o profissional não existe ou não está aprovado.

Sugestão de tela: no perfil, a nota média em estrelas (`ratingAverage` / `ratingCount`) e a lista de avaliações. No histórico do paciente, o botão "Avaliar" (quando `canReview`) abre as estrelas e o comentário.

---

## 🆕 Triagem antes da consulta

O paciente conta o **motivo** e os **sintomas atuais** antes da consulta, e o profissional lê para se preparar. Pode ser enviada junto do agendamento (`screening` no `POST /api/appointments`) ou depois, até o início. Os textos são gravados **criptografados**, e a leitura pelo profissional vai para a auditoria. **Ao remarcar, a triagem vai junto** para a consulta nova.

### `GET /api/appointments/{id}/screening` (paciente ou profissional da consulta)

```json
{ "appointmentId": 87, "reason": "Quero parar de beliscar à noite", "symptoms": "Ansiedade no fim do dia",
  "moodScore": 3, "updatedAt": "2026-10-18T22:10:00Z", "canEdit": true }
```

Sem triagem: `reason`, `symptoms`, `moodScore` e `updatedAt` vêm `null` (não é erro). `canEdit` é igual a `canEditScreening` da consulta.

### `PUT /api/appointments/{id}/screening` (PATIENT da consulta)

```json
{ "reason": "Quero parar de beliscar à noite", "symptoms": "Ansiedade no fim do dia", "moodScore": 3 }
```

- `reason` é **obrigatório** (até 1000). `symptoms` vai até 2000, e `moodScore` vai de 1 (muito mal) a 5 (muito bem); os dois são opcionais.
- **409 `SCREENING_CLOSED`**: a consulta já começou, foi cancelada ou foi remarcada (ajuste a da consulta nova). **403**: profissional.

Sugestão de tela: no passo de confirmação do agendamento, um bloco opcional "Conte para o profissional" (motivo, sintomas e cinco carinhas para o humor). Na consulta do profissional, um quadro "Triagem do paciente".

---

## 🆕 Questionário inicial do paciente

Respondido **uma vez, depois do cadastro** (e editável depois). Ajuda o profissional a conhecer o paciente antes da primeira consulta. O `GET /api/me` do paciente traz **`intakeCompleted`** (`true`/`false`; `null` para profissional e admin). Sugestão: depois do primeiro login, se `intakeCompleted` for `false`, mostrar o questionário, com a opção "Responder depois".

### `PUT /api/me/intake` (PATIENT): responder ou editar

```json
{
  "goals": ["RELACAO_COM_A_COMIDA", "ANSIEDADE"],
  "mealsPerDay": 3,
  "waterLitersPerDay": 1.5,
  "activityLevel": "LEVE",
  "sleepQuality": 2,
  "stressLevel": 4,
  "dietaryRestrictions": "Intolerância à lactose",
  "healthConditions": "Hipotireoidismo",
  "expectations": "Comer melhor sem dieta restritiva"
}
```

| Campo | Regra | Opções e textos para a tela |
|---|---|---|
| `goals` | 1 a 4 | `EMAGRECER` (Emagrecer com saúde), `GANHAR_MASSA` (Ganhar massa muscular), `ALIMENTACAO_SAUDAVEL` (Comer de forma mais equilibrada), `RELACAO_COM_A_COMIDA` (Melhorar minha relação com a comida), `ANSIEDADE` (Lidar com ansiedade e estresse), `SONO` (Dormir melhor), `ENERGIA` (Ter mais energia), `AUTOESTIMA` (Autoestima e imagem corporal) |
| `mealsPerDay` | 1 a 10 | Quantas refeições você faz por dia? |
| `waterLitersPerDay` | 0 a 10, uma casa decimal | Quantos litros de água por dia? |
| `activityLevel` | obrigatório | `SEDENTARIO`, `LEVE` (1–2x por semana), `MODERADO` (3–4x), `INTENSO` (5x ou mais) |
| `sleepQuality` | 1 a 5 | Como está seu sono? (1 = muito ruim) |
| `stressLevel` | 1 a 5 | Qual seu nível de estresse? (1 = muito baixo) |
| `dietaryRestrictions`, `healthConditions`, `expectations` | opcionais, até 2000 | Restrições alimentares; doenças e medicamentos; o que espera do acompanhamento |

Resposta: as mesmas respostas, mais `createdAt` e `updatedAt`. Erros de validação: **400** com a mensagem pronta em `errors.<campo>`. Os textos livres são gravados **criptografados**.

### `GET /api/me/intake` (PATIENT)

Minhas respostas. **404 `INTAKE_NOT_ANSWERED`** se ainda não respondeu.

### `GET /api/patients/{id}/intake` (PROFESSIONAL)

As respostas de um paciente que o profissional **atende**, ou seja, com consulta agendada, confirmada ou realizada (mesma regra de "Meus pacientes"). Para os outros: **404**. A leitura vai para a auditoria. Sugestão: em "Meus pacientes" e na consulta, um botão "Questionário inicial".

---

## 🆕 Registro da consulta (prontuário)

O que o profissional anota sobre cada atendimento. Os conselhos exigem esse registro (CFP 01/2009 para psicólogos, CFN 594/2017 para nutricionistas), guardado por pelo menos 5 anos. Ele tem duas partes:

| Campo | Quem lê | Exemplo |
|---|---|---|
| `privateNotes` | **só o profissional** | evolução, hipóteses, anotações técnicas |
| `patientGuidance` | profissional **e paciente** | "Jantar até as 20h; beber 2 L de água por dia" |

Os textos são gravados **criptografados** no banco, e toda leitura e gravação vai para a auditoria.

### `GET /api/appointments/{id}/record` (PATIENT ou PROFESSIONAL da consulta)

```json
{
  "appointmentId": 87,
  "privateNotes": "Relata compulsão à noite. Boa adesão ao plano.",
  "patientGuidance": "Jantar até as 20h.",
  "createdAt": "2026-10-20T13:05:00Z",
  "updatedAt": "2026-10-20T13:40:00Z",
  "canEdit": true
}
```

- Sem registro ainda: os textos e as datas vêm `null` (não é erro).
- Para o **paciente**, `privateNotes` vem **sempre `null`**.
- `canEdit`: mostrar o formulário (só para o profissional, com as mesmas regras de `canWriteRecord`).
- **404** se quem pede não participa da consulta.

### `PUT /api/appointments/{id}/record` (PROFESSIONAL da consulta)

```json
{ "privateNotes": "Relata compulsão à noite.", "patientGuidance": "Jantar até as 20h." }
```

- Cria ou edita: existe **um registro por consulta**, e o PUT **substitui os dois textos**. Envie sempre os dois; campo vazio ou ausente apaga aquele texto.
- Até 20000 caracteres em cada campo (400 com `errors.privateNotes` / `errors.patientGuidance`).
- **409 `RECORD_NOT_ALLOWED`**: antes do horário de início, ou consulta cancelada ou remarcada. **403**: paciente.
- Quando as orientações mudam, o paciente recebe uma **notificação** ("Orientações da consulta"), sem o texto. O texto só aparece com login, no site.

Sugestão de tela: na consulta do profissional (quando `canWriteRecord`), um botão "Registro da consulta" abre duas caixas de texto ("Anotações privadas", com o aviso "só você vê", e "Orientações para o paciente"). Na consulta do paciente, um quadro "Orientações do profissional" quando `patientGuidance` não for `null`.

---

## Plano de ação (Etapa 4)

O profissional monta um plano para o paciente: **metas**, **rotina alimentar** e **checklist de hábitos**. O paciente marca o checklist todo dia e os dois acompanham o progresso.

| Quem | Pode |
|---|---|
| Profissional | Criar (só para paciente com consulta marcada ou realizada com ele), editar, pausar/concluir |
| Paciente | Marcar o checklist (hoje e até 6 dias atrás) |
| Os dois | Marcar metas como cumpridas, registrar progresso (peso, humor, observações) |

Quem não participa do plano recebe **404**. "Hoje" é o dia no fuso do Brasil (a resposta traz `today`).

### `GET /api/me/patients`: meus pacientes (PROFESSIONAL)

Para o profissional escolher o paciente ao criar um plano.

```json
[ { "id": 15, "name": "Ana Souza", "photoUrl": "/patient/paciente2.png", "lastAppointmentAt": "2026-10-09T19:00:00Z" } ]
```

### `POST /api/plans`: criar (PROFESSIONAL) · `PUT /api/plans/{id}`: editar

O plano inteiro num envio só (um formulário):

```json
{
  "patientId": 15,
  "title": "Reeducação alimentar",
  "description": "Foco em hidratação e regularidade.",
  "startDate": "2026-10-20",
  "endDate": "2026-12-20",
  "goals": [
    { "description": "Perder 3 kg", "targetValue": 3, "unit": "kg", "dueDate": "2026-12-20" },
    { "description": "Caminhar 3 vezes por semana" }
  ],
  "meals": [
    { "mealType": "CAFE_DA_MANHA", "mealTime": "07:30", "description": "Pão integral com ovo e uma fruta" },
    { "mealType": "ALMOCO", "mealTime": "12:30", "description": "Arroz, feijão, salada e frango" }
  ],
  "checklist": [
    { "description": "Beber 2 litros de água", "frequency": "DAILY" },
    { "description": "Planejar as refeições da semana", "frequency": "WEEKLY" },
    { "description": "Fazer exame de sangue", "frequency": "ONCE" }
  ]
}
```

- `mealType`: `CAFE_DA_MANHA`, `LANCHE_MANHA`, `ALMOCO`, `LANCHE_TARDE`, `JANTAR`, `CEIA`. `dayOfWeek` (0 = domingo ... 6) é opcional; sem ele, vale todo dia.
- `frequency`: `DAILY` (padrão), `WEEKLY` ou `ONCE`.
- **Na edição (PUT)** mande o plano inteiro (sem `patientId`). Metas e itens do checklist **com `id`** são mantidos e atualizados; **sem `id`**, criados; os que **não vierem** saem do plano. Itens do checklist retirados só são desativados: as marcações antigas não se perdem.
- Erros: 403 `NOT_YOUR_PATIENT` (`errors.patientId`); 400 com `errors.title`, `errors.endDate` ("A data de término precisa ser depois do início") etc.
- O paciente recebe um e-mail "Novo plano de ação".

Resposta (**201** na criação): o plano completo, abaixo.

### `GET /api/plans`: meus planos · `GET /api/plans/{id}`: plano completo

A lista traz só o `summary` de cada plano (paciente: os planos que recebeu; profissional: os que criou). O plano completo:

```json
{
  "summary": {
    "id": 3, "title": "Reeducação alimentar", "status": "ACTIVE",
    "startDate": "2026-10-20", "endDate": "2026-12-20",
    "patient": { "id": 15, "name": "Ana Souza", "photoUrl": "/patient/paciente2.png" },
    "professional": { "id": 42, "name": "Camila Rocha", "photoUrl": "/doctor/nutricionista3.jpg", "type": "NUTRICIONISTA" },
    "goalsCompleted": 1, "goalsTotal": 2,
    "checklistDoneToday": 2, "checklistTotalToday": 3,
    "adherence7d": 71,
    "updatedAt": "2026-10-22T13:10:00Z"
  },
  "description": "Foco em hidratação e regularidade.",
  "today": "2026-10-22",
  "goals": [
    { "id": 7, "description": "Perder 3 kg", "targetValue": 3, "unit": "kg", "dueDate": "2026-12-20", "completed": false, "completedAt": null }
  ],
  "meals": [
    { "id": 11, "mealType": "CAFE_DA_MANHA", "mealLabel": "Café da manhã", "mealTime": "07:30:00", "dayOfWeek": null, "description": "Pão integral com ovo e uma fruta" }
  ],
  "checklist": [
    { "id": 21, "description": "Beber 2 litros de água", "frequency": "DAILY", "doneToday": true,
      "history": [ { "date": "2026-10-16", "completed": true }, { "date": "2026-10-17", "completed": false } ] }
  ],
  "progress": [
    { "id": 5, "recordDate": "2026-10-22", "weightKg": 70.5, "moodScore": 4, "notes": "Me sentindo bem", "recordedBy": "Ana Souza" }
  ],
  "canEdit": false,
  "canCheck": true
}
```

- **O `summary` já traz os números para a tela:** metas cumpridas (`goalsCompleted`/`goalsTotal`), checklist feito hoje (`checklistDoneToday`/`checklistTotalToday`) e a **adesão dos últimos 7 dias** (`adherence7d`, em %, só dos itens diários; `null` se não houver).
- `doneToday`: diário = marcado hoje; semanal = marcado nesta semana (segunda a domingo); único = marcado alguma vez.
- `history`: os **7 últimos dias** de cada item, do mais antigo até hoje, prontos para desenhar os quadradinhos.
- `meals` já vêm **na ordem do dia** e com `mealLabel` em português.
- `progress`: do mais recente para o mais antigo. `moodScore`: 1 (muito mal) a 5 (muito bem).
- `canEdit`: o profissional dono pode editar. `canCheck`: o paciente pode marcar (plano `ACTIVE`).

### Ações (todas devolvem o plano completo atualizado)

| Rota | Quem | Corpo | Erros |
|---|---|---|---|
| `PUT /api/plans/{id}/checklist/{itemId}/{data}` | paciente | `{ "completed": true }` (ou `false` para desmarcar); `{data}` no formato `AAAA-MM-DD` | 400 `errors.date` (futuro ou mais de 6 dias atrás), 409 `PLAN_NOT_ACTIVE` |
| `PUT /api/plans/{id}/goals/{goalId}` | os dois | `{ "completed": true }` | 404 |
| `POST /api/plans/{id}/progress` | os dois | `{ "recordDate": "2026-10-22", "weightKg": 70.5, "moodScore": 4, "notes": "..." }` (data opcional = hoje; ao menos um dos outros campos) | 400 (`errors.moodScore`: "Escolha de 1 a 5") |
| `PATCH /api/plans/{id}/status` | profissional | `{ "status": "PAUSED" }` (`ACTIVE`, `PAUSED`, `COMPLETED`, `CANCELLED`) | 403 |

### Sugestão de telas

- **Painel do paciente:** card "Meu plano" com a barra de progresso (`checklistDoneToday` de `checklistTotalToday`) e a adesão da semana → página do plano com o checklist de hoje (cada caixinha chama o PUT), as metas, a rotina alimentar por refeição e o botão "Registrar progresso".
- **Painel do profissional:** "Meus pacientes" (`/api/me/patients`) → "Criar plano" (formulário com listas de metas, refeições e checklist) → acompanhar a adesão e os registros de progresso de cada paciente.

---

## 🆕 Notificações (Etapa 4)

Avisos do "sininho" da área logada. Servem para **qualquer papel** (paciente, profissional, admin) e são gerados sozinhos pela API quando algo acontece:

| Evento | Quem recebe | `type` | `linkUrl` |
|---|---|---|---|
| Consulta agendada | profissional (e o paciente, como comprovante) | `APPOINTMENT` | `/appointments/{id}` |
| Consulta confirmada / remarcada / cancelada | a outra pessoa | `APPOINTMENT` | `/appointments/{id}` |
| 🆕 **Lembrete**: a consulta começa nas próximas 24 h (sai uma vez, automático, também por e-mail; não sai se a consulta foi agendada com menos de 24 h de antecedência) | paciente e profissional | `APPOINTMENT` | `/appointments/{id}` |
| 🆕 Orientações da consulta registradas pelo profissional | paciente | `APPOINTMENT` | `/appointments/{id}` |
| Plano de ação novo ou atualizado; observação do profissional no plano | paciente | `PLAN` | `/plans/{id}` |
| Avaliação recebida | profissional | `REVIEW` | `/professionals/{id}` |
| Cadastro aprovado ou recusado | profissional | `SYSTEM` | `/dashboard` |

> Os `linkUrl` são **sugestões de rota** para as telas. Se o front usar outras rotas, avise: elas ficam num lugar só na API (`NotificationLinks.java`).

### `GET /api/notifications/unread-count`

```json
{ "count": 3 }
```

Para o número no sininho. É leve: pode ser chamado em toda página da área logada.

### `GET /api/notifications`

Paginada (`page`, `size` até 50, padrão 20), **mais recentes primeiro**:

```json
{
  "items": [
    {
      "id": 51,
      "type": "APPOINTMENT",
      "title": "Consulta confirmada",
      "body": "Camila Rocha confirmou sua consulta de sexta-feira, 09/10 às 16:00.",
      "linkUrl": "/appointments/7",
      "read": false,
      "createdAt": "2026-10-07T20:30:00Z"
    }
  ],
  "page": 0, "size": 20, "totalItems": 4, "totalPages": 1
}
```

### `POST /api/notifications/{id}/read` · `POST /api/notifications/read-all`

- Marca **uma** como lida (devolve a notificação com `read: true`). A notificação de outra pessoa dá **404**.
- Marca **todas** como lidas: `{ "updated": 3 }`.

Sugestão de tela: sino no cabeçalho com o contador; ao abrir, a lista (ícone por `type`); clicar numa notificação marca como lida e leva ao `linkUrl`; botão "Marcar todas como lidas".

Na demonstração (`npm run seed`), as contas já têm notificações reais: a Ana tem "Consulta confirmada" e "Novo plano de ação"; a Camila, "Nova consulta agendada".

---

## 🆕 Atendimento online no perfil do profissional

`PUT /api/me/professional-profile` (PROFESSIONAL) aceita um campo novo, `telehealthRegistered`:

```json
{ "bio": "...", "consultationPrice": 150.00, "specialtyIds": [3], "telehealthRegistered": true }
```

- `true` = "Tenho cadastro no e-Psi / e-Nutricionista e atendo online". Sugestão: uma caixa de seleção com esse texto e um link explicando o cadastro do conselho (psicólogos: e-Psi, CFP 11/2018; nutricionistas: e-Nutricionista, CFN 666/2020).
- Campo ausente (`null`): não muda nada. O formulário atual continua funcionando sem ele.
- `GET /api/me` devolve em `professional`: `telehealthRegistered` e `telehealthDeclaredAt` (quando declarou).
- Desmarcar não cancela as consultas online já marcadas; só impede novas.

---

## 🆕 Baixar meus dados (LGPD)

### `GET /api/me/export` (qualquer pessoa logada)

Devolve um arquivo JSON com **tudo o que o NutriMente guarda sobre a pessoa** (LGPD, art. 18: direito de acesso e de portabilidade). A resposta vem com `Content-Disposition: attachment; filename="nutrimente-meus-dados-2026-10-09.json"`.

```json
{
  "aviso": "Dados que o NutriMente guarda sobre você (LGPD, art. 18). Datas em UTC.",
  "geradoEm": "2026-10-09T03:40:13Z",
  "conta": { "id": 15, "name": "Ana Souza", "email": "...", "cpf": "...", "birth_date": "1995-04-12", "...": "..." },
  "consentimentos": [ ... ],
  "consultas": [ { "id": 87, "starts_at": "2026-10-20T13:00:00Z", "professional_name": "Camila Rocha", "...": "..." } ],
  "registrosDasConsultas": [ { "appointment_id": 87, "patient_guidance": "Jantar até as 20h.", "...": "..." } ],
  "planosDeAcao": [ ... ], "metas": [ ... ], "checklist": [ ... ], "marcacoesDoChecklist": [ ... ], "progresso": [ ... ],
  "notificacoes": [ ... ], "avaliacoes": [ ... ], "...": "..."
}
```

- Os campos internos usam os **nomes das colunas do banco** (`starts_at`, `patient_id`...): é uma cópia fiel do que está guardado.
- Ficam de fora: hash da senha, tokens de e-mail e, para o paciente, as **anotações privadas** do prontuário (mesma regra da tela). O profissional recebe tudo o que escreveu.
- Toda exportação vai para a auditoria.

**Como baixar no front.** Um link `<a href>` não serve, porque a rota exige o token. No navegador, use `fetch` com o token e salve o resultado. Pelo BFF, uma Route Handler pode repassar o corpo e o cabeçalho `Content-Disposition`. Sugestão de tela: em "Minha conta", um botão "Baixar meus dados" ao lado de "Excluir conta".

---

## 🆕 Trocar a senha encerra as outras sessões

`PUT /api/me/password` agora **encerra todas as sessões abertas** da pessoa, em todos os aparelhos. É o que se espera quando alguém troca a senha porque desconfia que ela vazou. A redefinição por e-mail ("esqueci a senha") faz o mesmo.

A resposta mudou de **204 (vazio)** para **200**, com um token novo no mesmo formato do login:

```json
{ "accessToken": "eyJ...", "expiresAt": "2026-10-09T12:00:00Z", "user": { "id": 15, "name": "Ana Souza", "role": "PATIENT" } }
```

**Para o front (`changePassword` em `app/actions/account.ts`):** salve o token novo no lugar do antigo, senão a pessoa é deslogada na próxima página:

```ts
if (!result.ok) return fromApiError(result.error);
await createSession(result.data.accessToken, result.data.expiresAt);
return { ok: true, message: "Senha alterada. As outras sessões foram encerradas." };
```

---

## Outras rotas já existentes

Cadastro, login, confirmação de e-mail, minha conta, perfil do profissional e área do admin já estão em uso pelas telas atuais. A lista completa fica em [backend/README.md](../backend/README.md#rotas). Os exemplos de uso estão nas Server Actions em `app/actions/`.

## Situação do back-end

Todas as rotas planejadas para a apresentação de **30/10** estão prontas: busca com filtros, perfil, agenda e consultas, avaliações, plano de ação e notificações. Ficam para depois: chat entre paciente e profissional, pagamento (modo de teste), envio de foto e de documento do conselho pela tela.
