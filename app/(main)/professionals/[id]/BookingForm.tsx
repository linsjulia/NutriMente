"use client";

import { useActionState, useRef, useState } from "react";
import { bookAppointment } from "@/app/actions/appointments";
import { FormAlert, SubmitButton } from "@/app/components/form/FormParts";
import { useFocusOnError } from "@/app/components/form/useFocusOnError";
import type { FormState } from "@/app/lib/form";
import { formatBRL } from "@/app/lib/money";
import { MOOD_TEXT, type SlotDay } from "@/app/lib/agenda";

type Props = {
  professionalId: number;
  days: SlotDay[];
  offersOnline: boolean;
  offersInPerson: boolean;
  price: number | null;
};

/**
 * Agendamento: escolher o dia, o horário e a modalidade; a triagem
 * (motivo e sintomas) é opcional e fica num bloco que abre.
 * Os horários são botões de rádio agrupados por dia (<fieldset>): o leitor
 * de tela anuncia "segunda-feira, 13/10, grupo" antes de ler cada horário.
 */
export default function BookingForm({ professionalId, days, offersOnline, offersInPerson, price }: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(bookAppointment, {});
  const ref = useRef<HTMLFormElement>(null);
  useFocusOnError(ref, state);
  const [dayIndex, setDayIndex] = useState(0);
  const day = days[dayIndex];
  const values = state.values;

  return (
    <form ref={ref} action={action} className="flex flex-col gap-5" noValidate>
      <FormAlert ok={state.ok} message={state.message} />
      <input type="hidden" name="professionalId" value={professionalId} />

      <div className="flex flex-col gap-2">
        <label htmlFor="day" className="font-semibold">Dia</label>
        <select id="day" className="form-input sm:w-80" value={dayIndex} onChange={(e) => setDayIndex(Number(e.target.value))}>
          {days.map((d, i) => (
            <option key={d.date} value={i}>
              {d.weekday}, {d.date.split("-").reverse().slice(0, 2).join("/")} ({d.slots.length}{" "}
              {d.slots.length === 1 ? "horário" : "horários"})
            </option>
          ))}
        </select>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 font-semibold">Horário</legend>
        <div className="flex flex-wrap gap-2">
          {day.slots.map((s) => (
            <label key={s.startsAt} className="chip-link cursor-pointer has-checked:bg-blue1 has-checked:text-white has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-blue1">
              <input
                type="radio"
                name="startsAt"
                value={s.startsAt}
                defaultChecked={values?.startsAt === s.startsAt}
                className="sr-only"
              />
              {s.time}
            </label>
          ))}
        </div>
        {state.errors?.startsAt && <p className="text-sm font-semibold text-red-700">{state.errors.startsAt}</p>}
      </fieldset>

      {offersOnline && offersInPerson ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 font-semibold">Como prefere?</legend>
          <div className="flex flex-wrap gap-4">
            {[
              ["ONLINE", "Online (videochamada)"],
              ["PRESENCIAL", "Presencial"],
            ].map(([value, label]) => (
              <label key={value} className="flex items-center gap-2">
                <input type="radio" name="modality" value={value} defaultChecked={(values?.modality ?? "ONLINE") === value} className="h-5 w-5 accent-blue1" />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
      ) : (
        <p className="text-gray-700">
          Consulta {offersOnline ? "online, por videochamada" : "presencial"}.
          <input type="hidden" name="modality" value={offersOnline ? "ONLINE" : "PRESENCIAL"} />
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="notes" className="font-semibold">Observação para o profissional <span className="font-normal text-gray-600">(opcional)</span></label>
        <textarea id="notes" name="notes" rows={2} maxLength={1000} defaultValue={values?.notes} className="form-input" />
      </div>

      <details className="rounded-xl border border-gray-300 p-4" open={Boolean(state.errors?.reason || values?.reason)}>
        <summary className="cursor-pointer py-1 font-semibold">Contar ao profissional como você está (opcional)</summary>
        <div className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="reason" className="font-semibold">Motivo da consulta</label>
            <textarea id="reason" name="reason" rows={2} maxLength={1000} defaultValue={values?.reason}
              aria-invalid={state.errors?.reason ? true : undefined} className="form-input" />
            {state.errors?.reason && <p className="text-sm font-semibold text-red-700">{state.errors.reason}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="symptoms" className="font-semibold">Sintomas atuais</label>
            <textarea id="symptoms" name="symptoms" rows={2} maxLength={2000} defaultValue={values?.symptoms} className="form-input" />
          </div>
          <fieldset>
            <legend className="mb-2 font-semibold">Como você está se sentindo?</legend>
            <div className="flex flex-wrap gap-3">
              {[1, 2, 3, 4, 5].map((n) => (
                <label key={n} className="flex items-center gap-2">
                  <input type="radio" name="moodScore" value={n} defaultChecked={values?.moodScore === String(n)} className="h-5 w-5 accent-blue1" />
                  {MOOD_TEXT[n]}
                </label>
              ))}
            </div>
          </fieldset>
          <p className="text-sm text-gray-700">Só o profissional desta consulta lê. Os textos são guardados de forma criptografada.</p>
        </div>
      </details>

      <p className="font-semibold">Valor: {price != null ? `R$ ${formatBRL(price)}` : "a combinar"}</p>
      <SubmitButton pending={pending} className="self-start">Agendar consulta</SubmitButton>
    </form>
  );
}
