"use client";

import { useActionState, useRef } from "react";
import { Star } from "lucide-react";
import { appointmentAction, reviewAppointment, saveRecord, saveScreening } from "@/app/actions/appointments";
import { FormAlert, SubmitButton } from "@/app/components/form/FormParts";
import { useFocusOnError } from "@/app/components/form/useFocusOnError";
import type { FormState } from "@/app/lib/form";
import { MOOD_TEXT, type Appointment, type AppointmentRecord, type Screening } from "@/app/lib/agenda";

/** Textarea com rótulo, dica e erro ligados (mesmas regras do Field) */
function TextArea({ name, label, hint, error, defaultValue, rows = 3, max }: {
  name: string; label: string; hint?: string; error?: string; defaultValue?: string | null; rows?: number; max: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="font-semibold">{label}</label>
      <textarea id={name} name={name} rows={rows} maxLength={max} defaultValue={defaultValue ?? ""}
        aria-invalid={error ? true : undefined} aria-describedby={hint ? `${name}-hint` : undefined} className="form-input" />
      {hint && <p id={`${name}-hint`} className="text-sm text-gray-600">{hint}</p>}
      {error && <p className="text-sm font-semibold text-red-700">{error}</p>}
    </div>
  );
}

/** Confirmar / concluir (um clique) e cancelar (com motivo, confirmação na própria tela) */
export function AppointmentActions({ appointment: a, isPatient }: { appointment: Appointment; isPatient: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(appointmentAction, {});
  if (!a.canConfirm && !a.canComplete && !a.canCancel) return state.message ? <FormAlert ok={state.ok} message={state.message} /> : null;
  return (
    <div className="flex flex-col gap-3 border-t border-gray-200 pt-4">
      <FormAlert ok={state.ok} message={state.message} />
      <div className="flex flex-wrap gap-3">
        {a.canConfirm && (
          <form action={action}>
            <input type="hidden" name="id" value={a.id} />
            <input type="hidden" name="action" value="confirm" />
            <SubmitButton pending={pending}>Confirmar consulta</SubmitButton>
          </form>
        )}
        {a.canComplete && (
          <form action={action}>
            <input type="hidden" name="id" value={a.id} />
            <input type="hidden" name="action" value="complete" />
            <SubmitButton pending={pending}>Marcar como realizada</SubmitButton>
          </form>
        )}
      </div>
      {a.canCancel && (
        <details className="rounded-xl border border-gray-300 p-4">
          <summary className="cursor-pointer py-1 font-semibold">Cancelar consulta</summary>
          <form action={action} className="mt-3 flex flex-col gap-3">
            <input type="hidden" name="id" value={a.id} />
            <input type="hidden" name="action" value="cancel" />
            <TextArea name="reason" label="Motivo (opcional)" max={500} rows={2}
              hint={isPatient ? "O profissional recebe o aviso por e-mail." : "O paciente recebe o aviso por e-mail."} />
            <button type="submit" disabled={pending} className="btn-danger self-start">Confirmar cancelamento</button>
          </form>
        </details>
      )}
    </div>
  );
}

export function ScreeningForm({ appointmentId, screening }: { appointmentId: number; screening: Screening }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveScreening, {});
  const ref = useRef<HTMLFormElement>(null);
  useFocusOnError(ref, state);
  const v = state.values;
  return (
    <form ref={ref} action={action} className="flex flex-col gap-4" noValidate>
      <p className="text-gray-700">Conte ao profissional como você está. Você pode ajustar até o horário da consulta.</p>
      <FormAlert ok={state.ok} message={state.message} />
      <input type="hidden" name="id" value={appointmentId} />
      <TextArea name="reason" label="Motivo da consulta" max={1000} rows={2} defaultValue={v?.reason ?? screening.reason} error={state.errors?.reason} />
      <TextArea name="symptoms" label="Sintomas atuais (opcional)" max={2000} rows={2} defaultValue={v?.symptoms ?? screening.symptoms} />
      <fieldset>
        <legend className="mb-2 font-semibold">Como você está se sentindo? <span className="font-normal text-gray-600">(opcional)</span></legend>
        <div className="flex flex-wrap gap-3">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="flex items-center gap-2">
              <input type="radio" name="moodScore" value={n} defaultChecked={(v?.moodScore ?? String(screening.moodScore ?? "")) === String(n)} className="h-5 w-5 accent-blue1" />
              {MOOD_TEXT[n]}
            </label>
          ))}
        </div>
      </fieldset>
      <SubmitButton pending={pending} className="self-start">Salvar triagem</SubmitButton>
    </form>
  );
}

export function RecordForm({ appointmentId, record }: { appointmentId: number; record: AppointmentRecord }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveRecord, {});
  const ref = useRef<HTMLFormElement>(null);
  useFocusOnError(ref, state);
  const v = state.values;
  return (
    <form ref={ref} action={action} className="flex flex-col gap-4" noValidate>
      <FormAlert ok={state.ok} message={state.message} />
      <input type="hidden" name="id" value={appointmentId} />
      <TextArea name="privateNotes" label="Anotações privadas" rows={6} max={20000} defaultValue={v?.privateNotes ?? record.privateNotes}
        hint="Só você vê. Evolução, hipóteses, anotações técnicas." error={state.errors?.privateNotes} />
      <TextArea name="patientGuidance" label="Orientações para o paciente" rows={4} max={20000} defaultValue={v?.patientGuidance ?? record.patientGuidance}
        hint="O paciente vê na consulta e recebe um aviso." error={state.errors?.patientGuidance} />
      <p className="text-sm text-gray-700">Guardado de forma criptografada, por pelo menos 5 anos (exigência dos conselhos).</p>
      <SubmitButton pending={pending} className="self-start">Salvar registro</SubmitButton>
    </form>
  );
}

export function ReviewForm({ appointmentId }: { appointmentId: number }) {
  const [state, action, pending] = useActionState<FormState, FormData>(reviewAppointment, {});
  const ref = useRef<HTMLFormElement>(null);
  useFocusOnError(ref, state);
  if (state.ok) return <FormAlert ok message={state.message} />;
  return (
    <form ref={ref} action={action} className="flex flex-col gap-4" noValidate>
      <FormAlert ok={state.ok} message={state.message} />
      <input type="hidden" name="id" value={appointmentId} />
      <fieldset>
        <legend className="mb-2 font-semibold">Sua nota</legend>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="flex cursor-pointer items-center gap-1 rounded-full border-2 border-gray-300 px-3 py-2 has-checked:border-amber-500 has-checked:bg-amber-50 has-focus-visible:outline-3 has-focus-visible:outline-blue1">
              <input type="radio" name="rating" value={n} defaultChecked={state.values?.rating === String(n)} className="sr-only" />
              <Star aria-hidden size={18} className="fill-amber-400 text-amber-500" /> {n}
              <span className="sr-only">{n === 1 ? "estrela" : "estrelas"}</span>
            </label>
          ))}
        </div>
        {state.errors?.rating && <p className="mt-1 text-sm font-semibold text-red-700">{state.errors.rating}</p>}
      </fieldset>
      <TextArea name="comment" label="Comentário (opcional)" max={1000} rows={3} defaultValue={state.values?.comment}
        hint="Aparece no perfil do profissional com seu nome abreviado (ex.: Ana S.)." error={state.errors?.comment} />
      <SubmitButton pending={pending} className="self-start">Publicar avaliação</SubmitButton>
    </form>
  );
}
