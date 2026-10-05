// =============================================================
// Sessão do usuário (cookie httpOnly com o token JWT da API)
//
// Depois do login, a API Java devolve um token JWT. Guardamos esse token
// num cookie com as opções recomendadas:
//   httpOnly -> o JavaScript da página NÃO consegue ler (protege contra XSS)
//   secure   -> só trafega em HTTPS (em produção)
//   sameSite -> não é enviado por outros sites (protege contra CSRF)
//
// Para saber quem está logado sem chamar a API a cada página, conferimos a
// assinatura do token com a mesma chave da API (JWT_SECRET). Um token
// alterado ou vencido é recusado.
// =============================================================
import "server-only";

import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export const SESSION_COOKIE = "nutrimente_session";

export type Role = "PATIENT" | "PROFESSIONAL" | "ADMIN";

export type Session = {
  userId: string;
  role: Role;
  /** Primeiro nome, para o cabeçalho */
  name: string;
  /** O token em si, repassado para a API */
  token: string;
};

function secretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET não configurado (precisa ser igual ao da API, com 32+ caracteres).");
  }
  return new TextEncoder().encode(secret);
}

/** Confere o token e devolve os dados da sessão; null se inválido/vencido */
export async function decodeSession(token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      algorithms: ["HS256"],
      issuer: "nutrimente-api",
    });
    const role = payload.role as Role;
    if (!payload.sub || !["PATIENT", "PROFESSIONAL", "ADMIN"].includes(role)) return null;
    return { userId: payload.sub, role, name: String(payload.name ?? ""), token };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  return decodeSession((await cookies()).get(SESSION_COOKIE)?.value);
}

export async function createSession(token: string, expiresAt: string) {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export async function deleteSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

/** Página inicial de cada papel depois do login */
export function homeFor(role: Role) {
  return role === "ADMIN" ? "/admin/professionals" : "/dashboard";
}
