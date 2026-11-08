"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";
import { addMeal } from "@/app/actions/patient";
import { FormAlert } from "@/app/components/form/FormParts";
import { useFocusOnError } from "@/app/components/form/useFocusOnError";
import type { FormState } from "@/app/lib/form";
import { MEAL_TYPES } from "./meal-options";

const BORDER = "border-[#cfdcec]";
const FIELD = `w-full rounded-2xl border ${BORDER} bg-white px-4 text-base outline-none transition placeholder:text-slate-500 hover:border-blue1/50 focus:border-blue1 focus:ring-2 focus:ring-blue1/25 aria-[invalid=true]:border-red-600`;
const INPUT = `${FIELD} h-12`;
const TEXTAREA = `${FIELD} py-3 resize-y`;
const LABEL = "font-bold";
const OPTIONAL = "font-normal text-slate-600";
const ERROR = "text-sm font-semibold text-red-700";
const RING = "peer-focus-visible:ring-2 peer-focus-visible:ring-blue1 peer-focus-visible:ring-offset-2";

/** Hoje e agora no horário de Brasília (valores iniciais dos campos) */
function nowInBrasilia() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}` };
}

/** Escala 1–5: quadradinhos arredondados, o selecionado fica verde; "Pouca" sob o 1 e "Muita" sob o 5 */
function Scale({ name, legend, selected }: { name: string; legend: string; selected?: string }) {
  return (
    <fieldset className="min-w-0">
      <legend className={`mb-2.5 ${LABEL}`}>
        {legend} <span className={OPTIONAL}>(opcional)</span>
        <span className="sr-only">: 1 = pouca, 5 = muita</span>
      </legend>
      <div className="grid w-fit grid-cols-[repeat(5,3.25rem)] gap-x-2 gap-y-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="cursor-pointer">
            <input type="radio" name={name} value={n} defaultChecked={selected === String(n)} className="peer sr-only" />
            <span className={`flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-2xl border ${BORDER} bg-white text-lg font-bold transition hover:border-blue1/60 peer-checked:border-[#00dc5a] peer-checked:bg-[#00dc5a] ${RING}`}>
              {n}
            </span>
          </label>
        ))}
        <span aria-hidden className="col-start-1 whitespace-nowrap text-sm text-slate-600">Pouca</span>
        <span aria-hidden className="col-start-5 whitespace-nowrap text-sm text-slate-600">Muita</span>
      </div>
    </fieldset>
  );
}

/** Área tracejada verde-menta; fica dentro do <form>, então volta ao estado inicial quando ele é recriado */
function PhotoField({ error }: { error?: string }) {
  const [fileName, setFileName] = useState("");
  return (
    <div className="flex flex-col gap-2.5">
      <p id="photo-label" className={LABEL}>Foto <span className={OPTIONAL}>(opcional)</span></p>
      <label
        htmlFor="photo"
        className="flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed border-[#7be8cf] bg-[#dcfbe8] p-5 transition hover:bg-[#cdf7de] focus-within:ring-2 focus-within:ring-blue1 focus-within:ring-offset-2"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-blue1 shadow-sm">
          <Camera aria-hidden size={24} />
        </span>
        <span className="min-w-0">
          <span className="block break-words font-bold">{fileName || "Adicionar foto do prato"}</span>
          <span id="photo-hint" className="block text-[15px] text-slate-700">
            JPG, PNG ou WebP, até 5 MB. Só você e o profissional que te atende veem.
          </span>
        </span>
        <input
          id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp"
          aria-labelledby="photo-label" aria-describedby="photo-hint"
          aria-invalid={error ? true : undefined} className="sr-only"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
        />
      </label>
      {error && <p className={ERROR}>{error}</p>}
    </div>
  );
}

export default function MealForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(addMeal, {});
  const ref = useRef<HTMLFormElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  useFocusOnError(ref, state);
  const now = nowInBrasilia();
  const v = state.ok ? undefined : state.values;

  // Leva o aviso para a vista: ele fica perto do botão, no fim do formulário
  useEffect(() => {
    if (state.message) alertRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [state]);

  return (
    // key: depois de salvar, o formulário volta limpo
    <form key={state.ok ? state.message : "form"} ref={ref} action={action} className="flex flex-col gap-8 text-[#14304a]" noValidate>
      <fieldset>
        <legend className={`mb-2.5 ${LABEL}`}>Refeição</legend>
        <div className="flex flex-wrap gap-2.5">
          {MEAL_TYPES.map(([value, label]) => (
            <label key={value} className="cursor-pointer">
              <input
                type="radio" name="mealType" value={value} defaultChecked={v?.mealType === value}
                aria-invalid={state.errors?.mealType ? true : undefined}
                aria-describedby={state.errors?.mealType ? "mealType-error" : undefined}
                className="peer sr-only"
              />
              <span className={`flex min-h-11 items-center rounded-full border ${BORDER} bg-white px-5 font-semibold transition hover:border-blue1/60 peer-checked:border-blue1 peer-checked:bg-blue1 peer-checked:text-white ${RING}`}>
                {label}
              </span>
            </label>
          ))}
        </div>
        {state.errors?.mealType && <p id="mealType-error" className={`mt-2 ${ERROR}`}>{state.errors.mealType}</p>}
      </fieldset>

      <div className="grid gap-x-4 gap-y-2.5 sm:grid-cols-2">
        <div className="flex flex-col gap-2.5">
          <label htmlFor="date" className={LABEL}>Dia</label>
          <input id="date" name="date" type="date" defaultValue={v?.date ?? now.date} max={now.date} className={INPUT}
            aria-invalid={state.errors?.eatenAt ? true : undefined} />
        </div>
        <div className="flex flex-col gap-2.5">
          <label htmlFor="time" className={LABEL}>Hora</label>
          <input id="time" name="time" type="time" defaultValue={v?.time ?? now.time} className={INPUT}
            aria-invalid={state.errors?.eatenAt ? true : undefined} />
        </div>
        {state.errors?.eatenAt && <p className={`sm:col-span-2 ${ERROR}`}>{state.errors.eatenAt}</p>}
      </div>

      <div className="flex flex-col gap-2.5">
        <label htmlFor="description" className={LABEL}>O que você comeu?</label>
        <textarea id="description" name="description" maxLength={2000} defaultValue={v?.description}
          placeholder="Ex.: arroz, feijão, frango grelhado e salada" className={`${TEXTAREA} min-h-[5.5rem]`}
          aria-invalid={state.errors?.description ? true : undefined} />
        {state.errors?.description && <p className={ERROR}>{state.errors.description}</p>}
      </div>

      <div className="flex flex-col gap-2.5">
        <label htmlFor="notes" className={LABEL}>Como você se sentiu? <span className={OPTIONAL}>(opcional)</span></label>
        <textarea id="notes" name="notes" maxLength={2000} defaultValue={v?.notes}
          placeholder="Fale sobre emoções, pensamentos ou o ambiente" className={`${TEXTAREA} min-h-[4.25rem]`} />
      </div>

      <div className="flex flex-wrap gap-x-10 gap-y-7">
        <Scale name="hungerLevel" legend="Fome antes de comer" selected={v?.hungerLevel} />
        <Scale name="satisfactionLevel" legend="Saciedade depois" selected={v?.satisfactionLevel} />
      </div>

      <PhotoField error={state.errors?.photo} />

      <div ref={alertRef}>
        <FormAlert ok={state.ok} message={state.message} />
      </div>

      <div className="flex flex-wrap items-center gap-5">
        <button
          type="submit" disabled={pending} aria-busy={pending}
          className="h-14 rounded-2xl bg-blue1 px-8 text-lg font-bold text-white shadow-[0_10px_24px_-8px_rgba(0,80,176,0.6)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue1 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70"
        >
          {pending ? "Salvando…" : "Registrar refeição"}
        </button>
        <span className="text-slate-700">Leva menos de um minuto.</span>
      </div>
    </form>
  );
}