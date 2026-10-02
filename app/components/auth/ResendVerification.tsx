"use client";

import { useActionState, useRef } from "react";
import { resendVerification } from "@/app/actions/auth";
import { FormAlert } from "@/app/components/form/FormParts";
import type { FormState } from "@/app/lib/form";
import { useFocusOnError } from "@/app/components/form/useFocusOnError";

/** "Não recebeu? Reenviar" — usado depois do cadastro e na confirmação expirada */
export default function ResendVerification({ email }: { email: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(resendVerification, {});
  const resultRef = useRef<HTMLFormElement>(null);
  useFocusOnError(resultRef, state);

  if (state.ok) return <FormAlert ok message={state.message} />;

  return (
    <form ref={resultRef} action={action} className="flex flex-col gap-2">
      <FormAlert ok={false} message={state.message} />
      <input type="hidden" name="email" value={email} />
      <p>
        Não recebeu?{" "}
        <button type="submit" disabled={pending || !email} className="py-2.5 font-bold underline">
          {pending ? "Enviando..." : "Reenviar e-mail"}
        </button>
      </p>
    </form>
  );
}
