"use client";

import { useActionState, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { saveAvailability } from "@/app/actions/professional";
import { FormAlert, SubmitButton } from "@/app/components/form/FormParts";
import { useFocusOnError } from "@/app/components/form/useFocusOnError";
import type { FormState } from "@/app/lib/form";

export type AvailabilityWindow = { dayOfWeek: number; startTime: string; endTime: string };

const DAYS = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

/**
 * "Meus horários": janelas semanais de atendimento (ex.: segunda, 08:00 às
 * 12:00). A API transforma as janelas em horários de consulta e confere
 * sobreposições; o erro dela aparece no topo.
 */
export default function AvailabilityEditor({ initial }: { initial: AvailabilityWindow[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveAvailability, {});
  const ref = useRef<HTMLFormElement>(null);
  useFocusOnError(ref, state);
  const [rows, setRows] = useState(initial.map((w) => ({ ...w, startTime: w.startTime.slice(0, 5), endTime: w.endTime.slice(0, 5) })));
  const set = (i: number, patch: Partial<AvailabilityWindow>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  return (
    <form ref={ref} action={action} className="flex flex-col gap-4" noValidate>
      <FormAlert ok={state.ok} message={state.message} />
      <input type="hidden" name="windows" value={JSON.stringify(rows)} />
      {rows.length === 0 && <p className="text-gray-700">Nenhum horário: você não aparece com horários livres para agendar.</p>}
      {rows.map((r, i) => (
        <fieldset key={i} className="flex flex-wrap items-end gap-3">
          <legend className="sr-only">Janela {i + 1}</legend>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`day-${i}`} className="font-semibold">Dia</label>
            <select id={`day-${i}`} value={r.dayOfWeek} onChange={(e) => set(i, { dayOfWeek: Number(e.target.value) })} className="form-input">
              {DAYS.map((d, n) => <option key={d} value={n}>{d}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`start-${i}`} className="font-semibold">Das</label>
            <input id={`start-${i}`} type="time" value={r.startTime} onChange={(e) => set(i, { startTime: e.target.value })} className="form-input" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`end-${i}`} className="font-semibold">Até</label>
            <input id={`end-${i}`} type="time" value={r.endTime} onChange={(e) => set(i, { endTime: e.target.value })} className="form-input" />
          </div>
          <button type="button" onClick={() => setRows(rows.filter((_, j) => j !== i))} aria-label={`Tirar ${DAYS[r.dayOfWeek]}, ${r.startTime} às ${r.endTime}`}
            className="flex h-11 w-11 items-center justify-center rounded-full text-red-700 hover:bg-red-50">
            <X aria-hidden size={20} />
          </button>
        </fieldset>
      ))}
      <button type="button" onClick={() => setRows([...rows, { dayOfWeek: 1, startTime: "08:00", endTime: "12:00" }])}
        className="btn-secondary inline-flex items-center gap-2 self-start">
        <Plus aria-hidden size={18} /> Adicionar horário
      </button>
      <SubmitButton pending={pending} className="self-start">Salvar horários</SubmitButton>
    </form>
  );
}
