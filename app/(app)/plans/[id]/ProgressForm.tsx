"use client";

import { useActionState, useRef } from "react";
import { addProgress } from "@/app/actions/followup";
import Field from "@/app/components/form/Field";
import { FormAlert, SubmitButton } from "@/app/components/form/FormParts";
import { useFocusOnError } from "@/app/components/form/useFocusOnError";
import type { FormState } from "@/app/lib/form";
import { MOOD_TEXT } from "@/app/lib/agenda";

/** Registrar peso, humor e uma anotação de hoje (pelo menos um dos três) */
export default function ProgressForm({ planId }: { planId: number }) {
  const [state, action, pending] = useActionState<FormState, FormData>(addProgress, {});
  const ref = useRef<HTMLFormElement>(null);
  useFocusOnError(ref, state);
  return (
    <form ref={ref} action={action} className="flex flex-col gap-4" noValidate>
      <FormAlert ok={state.ok} message={state.message} />
      <input type="hidden" name="planId" value={planId} />
      <Field label="Peso (kg)" name="weightKg" inputMode="decimal" placeholder="70,5" className="max-w-40"
        defaultValue={state.ok ? "" : state.values?.weightKg} error={state.errors?.weightKg} />
      <fieldset>
        <legend className="mb-2 font-semibold">Como você está hoje?</legend>
        <div className="flex flex-wrap gap-3">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="flex items-center gap-2">
              <input type="radio" name="moodScore" value={n} className="h-5 w-5 accent-blue1" />
              {MOOD_TEXT[n]}
            </label>
          ))}
        </div>
        {state.errors?.moodScore && <p className="mt-1 text-sm font-semibold text-red-700">{state.errors.moodScore}</p>}
      </fieldset>
      <Field label="Anotação (opcional)" name="notes" maxLength={500} defaultValue={state.ok ? "" : state.values?.notes} error={state.errors?.notes} />
      <SubmitButton pending={pending} className="self-start">Registrar progresso</SubmitButton>
    </form>
  );
}
