"use client";

import { useActionState, useRef } from "react";
import { addMeal } from "@/app/actions/patient";
import { FormAlert, SubmitButton } from "@/app/components/form/FormParts";
import { useFocusOnError } from "@/app/components/form/useFocusOnError";
import type { FormState } from "@/app/lib/form";

const TYPES: [string, string][] = [
  ["CAFE_DA_MANHA", "Café da manhã"],
  ["LANCHE_DA_MANHA", "Lanche da manhã"],
  ["ALMOCO", "Almoço"],
  ["LANCHE_DA_TARDE", "Lanche da tarde"],
  ["JANTAR", "Jantar"],
  ["CEIA", "Ceia"],
  ["OUTRO", "Outro"],
];

/** Hoje e agora no horário de Brasília (valores iniciais dos campos) */
function nowInBrasilia() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}` };
}

export default function MealForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(addMeal, {});
  const ref = useRef<HTMLFormElement>(null);
  useFocusOnError(ref, state);
  const now = nowInBrasilia();
  const v = state.ok ? undefined : state.values;
  const scale = (name: string, legend: string) => (
    <fieldset>
      <legend className="mb-2 font-semibold">{legend} <span className="font-normal text-gray-600">(opcional, 1 = pouco, 5 = muito)</span></legend>
      <div className="flex flex-wrap gap-3">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="flex items-center gap-1.5">
            <input type="radio" name={name} value={n} defaultChecked={v?.[name] === String(n)} className="h-5 w-5 accent-blue1" /> {n}
          </label>
        ))}
      </div>
    </fieldset>
  );

  return (
    // key: depois de salvar, o formulário volta limpo
    <form key={state.ok ? state.message : "form"} ref={ref} action={action} className="flex flex-col gap-4" noValidate>
      <FormAlert ok={state.ok} message={state.message} />
      <div className="flex flex-wrap gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="mealType" className="font-semibold">Refeição</label>
          <select id="mealType" name="mealType" defaultValue={v?.mealType ?? ""} className="form-input"
            aria-invalid={state.errors?.mealType ? true : undefined}>
            <option value="">Escolha</option>
            {TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          {state.errors?.mealType && <p className="text-sm font-semibold text-red-700">{state.errors.mealType}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="date" className="font-semibold">Dia</label>
          <input id="date" name="date" type="date" defaultValue={v?.date ?? now.date} max={now.date} className="form-input"
            aria-invalid={state.errors?.eatenAt ? true : undefined} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="time" className="font-semibold">Hora</label>
          <input id="time" name="time" type="time" defaultValue={v?.time ?? now.time} className="form-input" />
        </div>
      </div>
      {state.errors?.eatenAt && <p className="text-sm font-semibold text-red-700">{state.errors.eatenAt}</p>}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className="font-semibold">O que você comeu?</label>
        <textarea id="description" name="description" rows={2} maxLength={2000} defaultValue={v?.description} className="form-input"
          aria-invalid={state.errors?.description ? true : undefined} />
        {state.errors?.description && <p className="text-sm font-semibold text-red-700">{state.errors.description}</p>}
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="notes" className="font-semibold">Como você se sentiu? <span className="font-normal text-gray-600">(opcional)</span></label>
        <textarea id="notes" name="notes" rows={2} maxLength={2000} defaultValue={v?.notes} className="form-input" />
      </div>
      {scale("hungerLevel", "Fome antes de comer")}
      {scale("satisfactionLevel", "Saciedade depois")}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="photo" className="font-semibold">Foto <span className="font-normal text-gray-600">(opcional)</span></label>
        <input id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" aria-describedby="photo-hint"
          aria-invalid={state.errors?.photo ? true : undefined} className="form-input" />
        <p id="photo-hint" className="text-sm text-gray-600">JPG, PNG ou WebP, até 5 MB. Só você e o profissional que te atende veem.</p>
        {state.errors?.photo && <p className="text-sm font-semibold text-red-700">{state.errors.photo}</p>}
      </div>
      <SubmitButton pending={pending} className="self-start">Registrar refeição</SubmitButton>
    </form>
  );
}
