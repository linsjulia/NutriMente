"use client";

import Link from "next/link";
import { useActionState, useRef } from "react";
import { login, resendVerification } from "@/app/actions/auth";
import Field from "@/app/components/form/Field";
import { FormAlert, SubmitButton } from "@/app/components/form/FormParts";
import type { FormState } from "@/app/lib/form";
import { useFocusOnError } from "@/app/components/form/useFocusOnError";

/**
 * useActionState(acao, estadoInicial) devolve:
 *   state   -> o que a Server Action retornou (erros, mensagem)
 *   action  -> a função para colocar no <form action>
 *   pending -> true enquanto espera a resposta
 */
export default function LoginForm({ notice, next }: { notice?: string; next?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(login, {});
  const resultRef = useRef<HTMLDivElement>(null);
  useFocusOnError(resultRef, state);
  const [resendState, resendAction, resendPending] = useActionState<FormState, FormData>(resendVerification, {});

  return (
    <div ref={resultRef} className="flex flex-col gap-8">
      <div>
        <h1 className="font-fraunces text-4xl font-medium sm:text-5xl">Que bom ver você de novo</h1>
        <p className="mt-3 text-gray-700">Entre para acompanhar suas consultas e seu plano.</p>
      </div>

      {notice && !state.message && <FormAlert ok message={notice} />}

      <FormAlert ok={false} message={state.message}>
        {/* E-mail ainda não confirmado: oferece reenviar o link */}
        {state.code === "EMAIL_NOT_VERIFIED" && (
          <form action={resendAction}>
            <input type="hidden" name="email" value={state.values?.email ?? ""} />
            <button type="submit" disabled={resendPending} className="font-bold underline">
              {resendPending ? "Enviando..." : "Reenviar e-mail de confirmação"}
            </button>
          </form>
        )}
        {state.code === "ACCOUNT_LOCKED" && (
          <Link href="/forgot-password" className="font-bold underline">
            Redefinir minha senha
          </Link>
        )}
      </FormAlert>
      <FormAlert ok message={resendState.ok ? resendState.message : undefined} />

      <form action={action} className="flex flex-col gap-5" noValidate>
        {/* Página para onde voltar depois de entrar (validada no servidor) */}
        {next && <input type="hidden" name="next" value={next} />}
        <Field
          label="E-mail"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state.values?.email}
          error={state.errors?.email}
        />
        <Field
          label="Senha"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          error={state.errors?.password}
        />
        <div className="flex justify-end">
          <Link href="/forgot-password" className="inline-block py-2.5 font-semibold underline">
            Esqueceu sua senha?
          </Link>
        </div>
        <SubmitButton pending={pending}>Entrar</SubmitButton>
      </form>

      <p className="text-center">
        Ainda não tem conta?{" "}
        <Link href="/register" className="font-bold underline">
          Cadastre-se
        </Link>
      </p>
    </div>
  );
}
