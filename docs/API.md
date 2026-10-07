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

## Outras rotas já existentes

Cadastro, login, confirmação de e-mail, minha conta, perfil do profissional e área do admin já estão em uso pelas telas atuais. A lista completa fica em [backend/README.md](../backend/README.md#rotas). Os exemplos de uso estão nas Server Actions em `app/actions/`.

## Em breve (back-end em andamento)

| Entrega | Rotas | Previsão |
|---|---|---|
| Agenda e consultas (Etapa 3) | horários de atendimento, horários livres, agendar, cancelar, minhas consultas | até 20/10 |
| Acompanhamento (Etapa 4) | avaliações, plano de ação, notificações | até 26/10 |
