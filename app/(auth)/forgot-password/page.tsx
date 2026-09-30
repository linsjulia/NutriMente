"use client";

import Link from "next/link";
import { useActionState } from "react";
import { forgotPassword } from "@/app/actions/auth";
import Field from "@/app/components/form/Field";
import { FormAlert, SubmitButton } from "@/app/components/form/FormParts";
import type { FormState } from "@/app/lib/form";

// "Esqueci minha senha". A resposta é sempre a mesma, exista a conta ou
// não, para ninguém usar esta tela para descobrir quais e-mails estão cadastrados.
export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState<FormState, FormData>(forgotPassword, {});

  return (
    <div className="flex flex-col gap-6">
      <title>Esqueci minha senha | NutriMente</title>
      <h1 className="font-fraunces text-4xl font-medium">Esqueceu sua senha?</h1>
      <p>Informe o e-mail da sua conta. Enviaremos um link para você criar uma senha nova.</p>

      <FormAlert ok={state.ok} message={state.message} />

      {!state.ok && (
        <form action={action} className="flex flex-col gap-5" noValidate>
          <Field label="E-mail" name="email" type="email" autoComplete="email" required defaultValue={state.values?.email} error={state.errors?.email} />
          <SubmitButton pending={pending}>Enviar link</SubmitButton>
        </form>
      )}

      <Link href="/login" className="font-semibold underline">
        Voltar para o login
      </Link>
    </div>
  );
}
