"use client";

import { useActionState, useEffect, useRef } from "react";
import { addProgress } from "@/app/actions/followup";
import { FormAlert } from "@/app/components/form/FormParts";
import { useFocusOnError } from "@/app/components/form/useFocusOnError";
import type { FormState } from "@/app/lib/form";
import { MOOD_TEXT } from "@/app/lib/agenda";

const BORDER = "border-[#cfdcec]";
const FIELD = `h-[3.25rem] w-full rounded-2xl border ${BORDER} bg-white px-4 text-base outline-none transition placeholder:text-slate-500 hover:border-blue1/50 focus:border-blue1 focus:ring-2 focus:ring-blue1/25 aria-[invalid=true]:border-red-600`;
const LABEL = "font-bold";
const ERROR = "text-sm font-semibold text-red-700";

/** Registrar peso, humor e uma anotação de hoje (pelo menos um dos três) */
export default function ProgressForm({ planId, lastRecord }: { planId: number; lastRecord?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(addProgress, {});
  const ref = useRef<HTMLFormElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  useFocusOnError(ref, state);
  const v = state.ok ? undefined : state.values;

  // O aviso fica perto do botão; leva ele para a vista quando aparece
  useEffect(() => {
    if (state.message) alertRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [state]);

  return (
    // key: depois de salvar, o formulário volta limpo
    <form key={state.ok ? state.message : "form"} ref={ref} action={action} className="mt-7 flex flex-col gap-7" noValidate>
      <input type="hidden" name="planId" value={planId} />

      <div className="grid gap-x-8 gap-y-6 lg:grid-cols-[11rem_1fr_1fr]">
        <div className="flex flex-col gap-2.5">
          <label htmlFor="weightKg" className={LABEL}>Peso<span className="sr-only"> (kg)</span></label>
          <div className="relative">
            <input
              id="weightKg" name="weightKg" inputMode="decimal" placeholder="70,5" defaultValue={v?.weightKg}
              aria-invalid={state.errors?.weightKg ? true : undefined}
              aria-describedby={state.errors?.weightKg ? "weightKg-error" : undefined}
              className={`${FIELD} pr-12`}
            />
            <span aria-hidden className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-semibold">kg</span>
          </div>
          {state.errors?.weightKg && <p id="weightKg-error" className={ERROR}>{state.errors.weightKg}</p>}
        </div>

        <fieldset>
          <legend className={`mb-3 ${LABEL}`}>Como você está hoje?</legend>
          <div className="flex flex-wrap gap-2.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <label key={n} className="cursor-pointer">
                <input
                  type="radio" name="moodScore" value={n} defaultChecked={v?.moodScore === String(n)} className="peer sr-only"
                  aria-describedby={state.errors?.moodScore ? "moodScore-error" : undefined}
                />
                <span className={`flex min-h-11 items-center rounded-full border ${BORDER} bg-white px-5 font-semibold transition hover:border-blue1/60 peer-checked:border-blue1 peer-checked:bg-blue1 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-blue1 peer-focus-visible:ring-offset-2`}>
                  {MOOD_TEXT[n]}
                </span>
              </label>
            ))}
          </div>
          {state.errors?.moodScore && <p id="moodScore-error" className={`mt-2 ${ERROR}`}>{state.errors.moodScore}</p>}
        </fieldset>

        <div className="flex flex-col gap-2.5">
          <label htmlFor="notes" className={LABEL}>Anotação <span className="font-normal text-slate-600">(opcional)</span></label>
          <input
            id="notes" name="notes" maxLength={500} placeholder="Como foi o seu dia?" defaultValue={v?.notes}
            aria-invalid={state.errors?.notes ? true : undefined}
            aria-describedby={state.errors?.notes ? "notes-error" : undefined}
            className={FIELD}
          />
          {state.errors?.notes && <p id="notes-error" className={ERROR}>{state.errors.notes}</p>}
        </div>
      </div>

      <div ref={alertRef}>
        <FormAlert ok={state.ok} message={state.message} />
      </div>

      <div className="flex flex-wrap items-center gap-5">
        <button
          type="submit" disabled={pending} aria-busy={pending}
          className="h-14 rounded-2xl bg-blue1 px-9 text-lg font-bold text-white shadow-[0_12px_26px_-10px_rgba(0,80,176,0.65)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue1 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70"
        >
          {pending ? "Salvando…" : "Registrar progresso"}
        </button>
        {lastRecord && <span className="text-slate-600">Último registro: {lastRecord}.</span>}
      </div>
    </form>
  );
}