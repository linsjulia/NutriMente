// =============================================================
// Cliente da API Java (roda SÓ no servidor do Next)
//
// Arquitetura "Backend for Frontend" (BFF):
//   navegador ──► servidor do Next (Server Actions / páginas) ──► API Java
//
// O navegador nunca fala direto com a API e nunca vê o token JWT: o token
// fica num cookie httpOnly (ver session.ts) que o JavaScript da página não
// consegue ler. Isso protege a sessão contra roubo por XSS.
//
// "server-only": se alguém importar este arquivo num componente do
// navegador ("use client"), o build falha. Evita vazar código de servidor.
// =============================================================
import "server-only";

import { headers } from "next/headers";

const API_URL = process.env.API_URL ?? "http://localhost:8080";

/** Se a API não responder neste tempo, desistimos (senão a página trava para sempre) */
const TIMEOUT_MS = 10_000;

/** Formato de erro da API (Problem Details, RFC 9457) */
export type ApiError = {
  status: number;
  code: string;
  detail: string;
  /** Erros por campo do formulário, ex.: { email: "E-mail inválido" } */
  errors?: Record<string, string>;
};

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError };

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  /** Token JWT da sessão; ausente nas rotas públicas */
  token?: string;
};

/**
 * IP confiável do visitante a partir do X-Forwarded-For.
 *
 * O visitante pode mandar esse cabeçalho com qualquer valor ("6.6.6.6, ...").
 * O proxy da NOSSA infraestrutura (nginx, Caddy, a hospedagem) acrescenta o IP
 * real no FIM da lista, então só a última entrada é confiável. Repassar a
 * lista inteira deixava qualquer pessoa forjar o próprio IP.
 *
 * Em produção é obrigatório ter esse proxy na frente do Next: sem ele, o Next
 * mantém o cabeçalho que o visitante mandou (ver docs/REVISAO-QA.md).
 */
export function trustedClientIp(forwardedFor: string | null): string | null {
  const last = forwardedFor?.split(",").pop()?.trim();
  return last ? last : null;
}

export async function api<T>(path: string, { method = "GET", body, token }: RequestOptions = {}): Promise<ApiResult<T>> {
  const requestHeaders: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) requestHeaders["Content-Type"] = "application/json";
  if (token) requestHeaders.Authorization = `Bearer ${token}`;

  // Repassa o IP de quem acessou o site (a API registra nos logs, nos
  // consentimentos da LGPD e usa no limite de tentativas).
  const clientIp = trustedClientIp((await headers()).get("x-forwarded-for"));
  if (clientIp) requestHeaders["X-Forwarded-For"] = clientIp;

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store", // dados de conta nunca podem vir de cache
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === "TimeoutError";
    return {
      ok: false,
      error: {
        status: timedOut ? 504 : 503,
        code: timedOut ? "API_TIMEOUT" : "API_UNAVAILABLE",
        detail: timedOut
          ? "O servidor demorou demais para responder. Tente de novo em instantes."
          : "Não foi possível falar com o servidor. Verifique se a API está rodando e tente de novo.",
      },
    };
  }

  // 204 No Content: sucesso sem corpo
  if (response.status === 204) return { ok: true, data: undefined as T };

  const json = await response.json().catch(() => null);
  if (response.ok) return { ok: true, data: json as T };

  return {
    ok: false,
    error: {
      status: response.status,
      code: json?.code ?? (response.status === 401 ? "UNAUTHORIZED" : "UNKNOWN_ERROR"),
      detail: json?.detail ?? "Algo deu errado. Tente novamente.",
      errors: json?.errors,
    },
  };
}
