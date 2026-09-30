// Tipos e utilidades compartilhados pelos formulários (Server Actions).

import type { ApiError } from "./api";

/**
 * O que uma Server Action devolve para o formulário:
 * - message: aviso geral (erro ou sucesso)
 * - errors: erro de cada campo, mostrado embaixo dele
 * - values: o que a pessoa digitou, para não precisar digitar de novo
 *   (senhas NUNCA voltam)
 */
export type FormState = {
  ok?: boolean;
  message?: string;
  code?: string;
  errors?: Record<string, string>;
  values?: Record<string, string>;
};

/** Lê os campos de texto do formulário, sem os de senha */
export function formValues(formData: FormData, ...skip: string[]): Record<string, string> {
  const values: Record<string, string> = {};
  formData.forEach((value, key) => {
    if (typeof value === "string" && !key.toLowerCase().includes("password") && !skip.includes(key)) {
      values[key] = value;
    }
  });
  return values;
}

export function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/** Converte o erro da API no estado do formulário */
export function fromApiError(error: ApiError, values?: Record<string, string>): FormState {
  return { ok: false, message: error.detail, code: error.code, errors: error.errors, values };
}
