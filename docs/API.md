# 🔌 Contrato da API (para o front-end)

Referência das rotas da API Java para quem está construindo as telas. Cada rota tem o que enviar, o que volta e os erros possíveis.

Este arquivo cresce a cada entrega do back-end. **Rotas novas aparecem marcadas com 🆕.**

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
| 401 | (sem corpo) / `SESSION_INVALID` | Sem token, token vencido, ou a conta foi excluída: mande para o login |
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
| 🆕 `sort` | `RELEVANCE` \| `PRICE_ASC` \| `PRICE_DESC` \| `NAME` | `sort=PRICE_ASC` | Ordenação. Padrão: `RELEVANCE` (melhor avaliados primeiro) |
| `page` | número | `page=0` | Página, começando em 0 |
| `size` | número (1 a 50) | `size=12` | Itens por página (padrão 12) |

Regras:
- Com `minPrice` ou `maxPrice`, quem deixou o preço em branco ("valor a combinar") **não aparece**.
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
      ]
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

## 🆕 Agenda e consultas (Etapa 3)

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
{ "professionalId": 42, "startsAt": "2026-10-20T12:00:00Z", "modality": "ONLINE", "notes": "Primeira consulta" }
```

`modality` é opcional (padrão `ONLINE`; ou `PRESENCIAL`) e `notes` também (até 1000 caracteres). Resposta **201** com a consulta (formato abaixo). A API manda e-mail para o paciente e para o profissional.

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
  "canComplete": false
}
```

- **`can*` dizem quais botões mostrar** para quem está logado agora. Exemplo: `canConfirm` só é `true` para o profissional, numa consulta `SCHEDULED`. A API confere de novo ao receber a ação.
- `status`: `SCHEDULED` (agendada), `CONFIRMED` (confirmada), `COMPLETED` (realizada), `CANCELLED` (cancelada), `RESCHEDULED` (remarcada; a nova consulta aponta para ela em `rescheduledFromId`).
- `videoUrl`: link da videochamada (Jitsi, abre no navegador, sem cadastro). `null` na presencial.
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

## Outras rotas já existentes

Cadastro, login, confirmação de e-mail, minha conta, perfil do profissional e área do admin já estão em uso pelas telas atuais. A lista completa fica em [backend/README.md](../backend/README.md#rotas). Os exemplos de uso estão nas Server Actions em `app/actions/`.

## Em breve (back-end em andamento)

| Entrega | Rotas | Previsão |
|---|---|---|
| Acompanhamento (Etapa 4) | avaliações, plano de ação, notificações | até 26/10 |
