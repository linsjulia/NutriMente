"use client";

import { useActionState, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { createPlan } from "@/app/actions/followup";
import Field from "@/app/components/form/Field";
import { FormAlert, SubmitButton } from "@/app/components/form/FormParts";
import { useFocusOnError } from "@/app/components/form/useFocusOnError";
import type { FormState } from "@/app/lib/form";
import type { MyPatient } from "@/app/lib/patients";

type Goal = { description: string; dueDate: string };
type Item = { description: string; frequency: "DAILY" | "WEEKLY" | "ONCE" };
type MealRow = { mealType: string; mealTime: string; description: string };

const MEALS: [string, string][] = [
  ["CAFE_DA_MANHA", "Café da manhã"],
  ["LANCHE_MANHA", "Lanche da manhã"],
  ["ALMOCO", "Almoço"],
  ["LANCHE_TARDE", "Lanche da tarde"],
  ["JANTAR", "Jantar"],
  ["CEIA", "Ceia"],
];

/** Hoje no horário de Brasília, no formato do <input type="date"> */
function today() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

function RemoveButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} className="flex h-11 w-11 shrink-0 items-center justify-center self-end rounded-full text-red-700 hover:bg-red-50">
      <X aria-hidden size={20} />
    </button>
  );
}

function AddButton({ onClick, children }: { onClick: () => void; children: string }) {
  return (
    <button type="button" onClick={onClick} className="btn-secondary inline-flex items-center gap-2 self-start">
      <Plus aria-hidden size={18} /> {children}
    </button>
  );
}

/**
 * O plano inteiro num formulário só. As listas (metas, checklist, rotina)
 * ficam no estado do componente e vão para a Server Action como JSON,
 * num campo escondido ("lists").
 */
export default function PlanForm({ patients, patientId }: { patients: MyPatient[]; patientId?: number }) {
  const [state, action, pending] = useActionState<FormState, FormData>(createPlan, {});
  const ref = useRef<HTMLFormElement>(null);
  useFocusOnError(ref, state);
  const [goals, setGoals] = useState<Goal[]>([{ description: "", dueDate: "" }]);
  const [items, setItems] = useState<Item[]>([{ description: "", frequency: "DAILY" }]);
  const [meals, setMeals] = useState<MealRow[]>([]);
  const v = state.values;

  const update = <T,>(list: T[], set: (l: T[]) => void, i: number, patch: Partial<T>) =>
    set(list.map((row, j) => (j === i ? { ...row, ...patch } : row)));
  const remove = <T,>(list: T[], set: (l: T[]) => void, i: number) => set(list.filter((_, j) => j !== i));

  return (
    <form ref={ref} action={action} className="flex flex-col gap-6" noValidate>
      <FormAlert ok={state.ok} message={state.message} />
      <input type="hidden" name="lists" value={JSON.stringify({ goals, checklist: items, meals })} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="patientId" className="font-semibold">Paciente</label>
        <select id="patientId" name="patientId" defaultValue={v?.patientId ?? patientId ?? ""} className="form-input sm:w-80"
          aria-invalid={state.errors?.patientId ? true : undefined}>
          <option value="">Escolha</option>
          {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        {state.errors?.patientId && <p className="text-sm font-semibold text-red-700">{state.errors.patientId}</p>}
      </div>
      <Field label="Título" name="title" required maxLength={150} defaultValue={v?.title} error={state.errors?.title}
        placeholder="Ex.: Reeducação alimentar" />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className="font-semibold">Descrição <span className="font-normal text-gray-600">(opcional)</span></label>
        <textarea id="description" name="description" rows={2} maxLength={1000} defaultValue={v?.description} className="form-input" />
      </div>
      <div className="flex flex-wrap gap-4">
        <Field label="Início" name="startDate" type="date" required defaultValue={v?.startDate ?? today()} error={state.errors?.startDate} />
        <Field label="Término (opcional)" name="endDate" type="date" defaultValue={v?.endDate} error={state.errors?.endDate} />
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-lg font-bold">Metas</legend>
        {goals.map((g, i) => (
          <div key={i} className="flex flex-wrap gap-3">
            <Field label={`Meta ${i + 1}`} name={`goal-${i}`} value={g.description} className="min-w-60 flex-1"
              onChange={(e) => update(goals, setGoals, i, { description: e.target.value })} />
            <Field label="Prazo" name={`goal-due-${i}`} type="date" value={g.dueDate}
              onChange={(e) => update(goals, setGoals, i, { dueDate: e.target.value })} />
            <RemoveButton onClick={() => remove(goals, setGoals, i)} label={`Tirar meta ${i + 1}`} />
          </div>
        ))}
        <AddButton onClick={() => setGoals([...goals, { description: "", dueDate: "" }])}>Adicionar meta</AddButton>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-lg font-bold">Checklist</legend>
        {items.map((it, i) => (
          <div key={i} className="flex flex-wrap gap-3">
            <Field label={`Tarefa ${i + 1}`} name={`item-${i}`} value={it.description} className="min-w-60 flex-1"
              onChange={(e) => update(items, setItems, i, { description: e.target.value })} />
            <div className="flex flex-col gap-1.5">
              <label htmlFor={`freq-${i}`} className="font-semibold">Frequência</label>
              <select id={`freq-${i}`} value={it.frequency} className="form-input"
                onChange={(e) => update(items, setItems, i, { frequency: e.target.value as Item["frequency"] })}>
                <option value="DAILY">Todo dia</option>
                <option value="WEEKLY">Toda semana</option>
                <option value="ONCE">Uma vez</option>
              </select>
            </div>
            <RemoveButton onClick={() => remove(items, setItems, i)} label={`Tirar tarefa ${i + 1}`} />
          </div>
        ))}
        <AddButton onClick={() => setItems([...items, { description: "", frequency: "DAILY" }])}>Adicionar tarefa</AddButton>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-lg font-bold">Rotina alimentar <span className="font-normal text-gray-600">(opcional)</span></legend>
        {meals.map((m, i) => (
          <div key={i} className="flex flex-wrap gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor={`meal-type-${i}`} className="font-semibold">Refeição</label>
              <select id={`meal-type-${i}`} value={m.mealType} className="form-input"
                onChange={(e) => update(meals, setMeals, i, { mealType: e.target.value })}>
                {MEALS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <Field label="Horário" name={`meal-time-${i}`} type="time" value={m.mealTime}
              onChange={(e) => update(meals, setMeals, i, { mealTime: e.target.value })} />
            <Field label="O que comer" name={`meal-${i}`} value={m.description} className="min-w-60 flex-1"
              onChange={(e) => update(meals, setMeals, i, { description: e.target.value })} />
            <RemoveButton onClick={() => remove(meals, setMeals, i)} label={`Tirar refeição ${i + 1}`} />
          </div>
        ))}
        <AddButton onClick={() => setMeals([...meals, { mealType: "CAFE_DA_MANHA", mealTime: "", description: "" }])}>Adicionar refeição</AddButton>
      </fieldset>

      <SubmitButton pending={pending} className="self-start">Criar plano</SubmitButton>
    </form>
  );
}
