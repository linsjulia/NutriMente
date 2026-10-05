// =============================================================
// DAL (Data Access Layer): ÚNICO lugar onde páginas e ações buscam dados
// protegidos. Toda função aqui confere a sessão antes de qualquer coisa.
//
// O proxy.ts faz uma checagem rápida ("otimista") para redirecionar cedo,
// mas a proteção de verdade é esta, feita perto dos dados, e a da API Java,
// que confere o token e o papel em toda requisição.
// =============================================================
import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { api } from "./api";
import { getSession, homeFor, type Role, type Session } from "./session";
import type { Me } from "./types";

/**
 * Garante que há alguém logado (senão manda para o login).
 * cache(): se várias partes da mesma página chamarem, roda uma vez só.
 */
export const verifySession = cache(async (): Promise<Session> => {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
});

/** Garante que a pessoa logada tem um dos papéis permitidos */
export async function requireRole(...roles: Role[]): Promise<Session> {
  const session = await verifySession();
  if (!roles.includes(session.role)) redirect(homeFor(session.role));
  return session;
}

/**
 * Dados da conta vindos da API. Se a API disser que a sessão não vale mais
 * (ex.: conta excluída), manda para /logout, que apaga o cookie.
 */
export const getMe = cache(async (): Promise<Me> => {
  const session = await verifySession();
  const result = await api<Me>("/api/me", { token: session.token });
  if (!result.ok) {
    if (result.error.status === 401) redirect("/logout");
    throw new Error(result.error.detail);
  }
  return result.data;
});
