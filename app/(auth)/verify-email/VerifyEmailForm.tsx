"use client";

import Link from "next/link";
import { useActionState, useRef } from "react";
import { verifyEmail } from "@/app/actions/auth";
import { FormAlert, SubmitButton } from "@/app/components/form/FormParts";
import type { FormState } from "@/app/lib/form";
import { useFocusOnError } from "@/app/components/form/useFocusOnError";

export default function VerifyEmailForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(verifyEmail, {});
  const resultRef = useRef<HTMLDivElement>(null);
  useFocusOnError(resultRef, state);

  // Se der certo, a ação já entra na conta e leva para o início (não volta para cá)
  return (
    <div ref={resultRef} className="flex flex-col gap-6">
      <h1 className="font-fraunces text-4xl font-medium">Confirmar e-mail</h1>
      {!token ? (
        <FormAlert ok={false} message="Link incompleto. Abra novamente o link que enviamos por e-mail." />
      ) : (
        <>
          <p>Clique no botão abaixo para ativar sua conta.</p>
          <FormAlert ok={false} message={state.message}>
            {state.code === "INVALID_TOKEN" && (
              <Link href="/login" className="font-bold underline">
                Entre com seu e-mail e senha para receber um novo link
              </Link>
            )}
          </FormAlert>
          <form action={action}>
            <input type="hidden" name="token" value={token} />
            <SubmitButton pending={pending}>Confirmar meu e-mail</SubmitButton>
          </form>
        </>
      )}
    </div>
  );
}
