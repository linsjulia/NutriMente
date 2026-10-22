"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { verifyEmail } from "@/app/actions/auth";
import { FormAlert, SubmitButton } from "@/app/components/form/FormParts";
import type { FormState } from "@/app/lib/form";
import { useFocusOnError } from "@/app/components/form/useFocusOnError";

export default function VerifyEmailForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(verifyEmail, {});
  const resultRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const sent = useRef(false);
  useFocusOnError(resultRef, state);

  // Confirma sozinho ao abrir o link (uma vez só). Se der certo, a ação já
  // entra na conta e leva para o início; o botão abaixo fica de reserva
  // (JavaScript desligado ou erro de rede).
  useEffect(() => {
    if (!token || sent.current) return;
    sent.current = true;
    formRef.current?.requestSubmit();
  }, [token]);

  const failed = Boolean(state.message);
  return (
    <div ref={resultRef} className="flex flex-col gap-6">
      <h1 className="font-fraunces text-4xl font-medium">{failed ? "Não deu para confirmar" : "Confirmando seu e-mail"}</h1>
      {!token ? (
        <FormAlert ok={false} message="Link incompleto. Abra novamente o link que enviamos por e-mail." />
      ) : (
        <>
          {!failed && (
            <p role="status">
              {pending ? "Só um instante, estamos ativando sua conta..." : "Se a página não avançar sozinha, clique no botão abaixo."}
            </p>
          )}
          <FormAlert ok={false} message={state.message}>
            {state.code === "INVALID_TOKEN" && (
              <Link href="/login" className="font-bold underline">
                Entre com seu e-mail e senha para receber um novo link
              </Link>
            )}
          </FormAlert>
          <form ref={formRef} action={action}>
            <input type="hidden" name="token" value={token} />
            {state.code !== "INVALID_TOKEN" && (
              <SubmitButton pending={pending}>{failed ? "Tentar de novo" : "Confirmar meu e-mail"}</SubmitButton>
            )}
          </form>
        </>
      )}
    </div>
  );
}
