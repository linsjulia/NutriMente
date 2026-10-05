"use client";

import Link from "next/link";
import { useActionState, useRef } from "react";
import { forgotPassword } from "@/app/actions/auth";
import Field from "@/app/components/form/Field";
import { FormAlert, SubmitButton } from "@/app/components/form/FormParts";
import type { FormState } from "@/app/lib/form";
import { useFocusOnError } from "@/app/components/form/useFocusOnError";

// "Esqueci minha senha". A resposta é sempre a mesma, exista a conta ou
// não, para ninguém usar esta tela para descobrir quais e-mails estão cadastrados.
export default function ForgotPasswordForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(forgotPassword, {});
  const resultRef = useRef<HTMLDivElement>(null);
  useFocusOnError(resultRef, state);

  return (
    <div ref={resultRef} className="flex flex-col gap-6">
      <h1 className="font-fraunces text-4xl font-medium">Esqueceu sua senha?</h1>
      <p>Informe o e-mail da sua conta. Enviaremos um link para você criar uma senha nova.</p>

      <FormAlert ok={state.ok} message={state.message} />

      {!state.ok && (
        <form action={action} className="flex flex-col gap-5" noValidate>
          <Field label="E-mail" name="email" type="email" autoComplete="email" required defaultValue={state.values?.email} error={state.errors?.email} />
          <SubmitButton pending={pending}>Enviar link</SubmitButton>
        </form>
      )}

      <Link href="/login" className="inline-block py-2.5 font-semibold underline">
        Voltar para o login
      </Link>
    </div>
  );
}
