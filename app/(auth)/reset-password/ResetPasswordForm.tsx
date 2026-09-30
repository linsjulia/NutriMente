"use client";

import Link from "next/link";
import { useActionState } from "react";
import { resetPassword } from "@/app/actions/auth";
import Field from "@/app/components/form/Field";
import { FormAlert, SubmitButton } from "@/app/components/form/FormParts";
import type { FormState } from "@/app/lib/form";

export default function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(resetPassword, {});

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-fraunces text-4xl font-medium">Criar nova senha</h1>
      {!token ? (
        <FormAlert ok={false} message="Link incompleto. Abra novamente o link que enviamos por e-mail." />
      ) : (
        <>
          <FormAlert ok={false} message={state.message}>
            {state.code === "INVALID_TOKEN" && (
              <Link href="/forgot-password" className="font-bold underline">
                Pedir um novo link
              </Link>
            )}
          </FormAlert>
          <form action={action} className="flex flex-col gap-5" noValidate>
            <input type="hidden" name="token" value={token} />
            <Field
              label="Nova senha"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              hint="Mínimo de 8 caracteres, com letras e números."
              error={state.errors?.password}
            />
            <Field label="Repita a nova senha" name="confirmPassword" type="password" autoComplete="new-password" required error={state.errors?.confirmPassword} />
            <SubmitButton pending={pending}>Salvar nova senha</SubmitButton>
          </form>
        </>
      )}
    </div>
  );
}
