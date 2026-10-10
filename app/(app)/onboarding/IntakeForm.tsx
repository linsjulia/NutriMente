"use client";

import { useActionState, useRef } from "react";
import { saveIntake } from "@/app/actions/patient";
import Field from "@/app/components/form/Field";
import { FormAlert, SubmitButton } from "@/app/components/form/FormParts";
import { useFocusOnError } from "@/app/components/form/useFocusOnError";
import type { FormState } from "@/app/lib/form";

export type Intake = {
  goals: string[];
  mealsPerDay: number;
  waterLitersPerDay: number;
  activityLevel: string;
  sleepQuality: number;
  stressLevel: number;
  dietaryRestrictions: string | null;
  healthConditions: string | null;
  expectations: string | null;
};

const GOALS: [string, string][] = [
  ["EMAGRECER", "Emagrecer com saúde"],
  ["GANHAR_MASSA", "Ganhar massa muscular"],
  ["ALIMENTACAO_SAUDAVEL", "Comer de forma mais equilibrada"],
  ["RELACAO_COM_A_COMIDA", "Melhorar minha relação com a comida"],
  ["ANSIEDADE", "Lidar com ansiedade e estresse"],
  ["SONO", "Dormir melhor"],
  ["ENERGIA", "Ter mais energia"],
  ["AUTOESTIMA", "Autoestima e imagem corporal"],
];
const ACTIVITY: [string, string][] = [
  ["SEDENTARIO", "Sedentário"],
  ["LEVE", "Leve (1 a 2 vezes por semana)"],
  ["MODERADO", "Moderado (3 a 4 vezes)"],
  ["INTENSO", "Intenso (5 vezes ou mais)"],
];

export default function IntakeForm({ current }: { current: Intake | null }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveIntake, {});
  const ref = useRef<HTMLFormElement>(null);
  useFocusOnError(ref, state);
  const v = state.values;
  const goals = v?.goals !== undefined ? v.goals.split(",") : current?.goals ?? [];
  const errorText = (name: string) => state.errors?.[name] && <p className="mt-1 text-sm font-semibold text-red-700">{state.errors[name]}</p>;
  const scale = (name: "sleepQuality" | "stressLevel", legend: string, low: string, high: string) => (
    <fieldset>
      <legend className="mb-2 font-semibold">{legend} <span className="font-normal text-gray-600">(1 = {low}, 5 = {high})</span></legend>
      <div className="flex flex-wrap gap-3">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="flex items-center gap-1.5">
            <input type="radio" name={name} value={n} defaultChecked={(v?.[name] ?? String(current?.[name] ?? "")) === String(n)} className="h-5 w-5 accent-blue1" /> {n}
          </label>
        ))}
      </div>
      {errorText(name)}
    </fieldset>
  );
  const area = (name: "dietaryRestrictions" | "healthConditions" | "expectations", label: string) => (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="font-semibold">{label} <span className="font-normal text-gray-600">(opcional)</span></label>
      <textarea id={name} name={name} rows={2} maxLength={2000} defaultValue={v?.[name] ?? current?.[name] ?? ""} className="form-input" />
    </div>
  );

  return (
    <form ref={ref} action={action} className="flex flex-col gap-6" noValidate>
      <FormAlert ok={state.ok} message={state.message} />
      <fieldset>
        <legend className="mb-2 font-semibold">O que você busca? <span className="font-normal text-gray-600">(de 1 a 4)</span></legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {GOALS.map(([value, label]) => (
            <label key={value} className="flex items-center gap-2">
              <input type="checkbox" name="goals" value={value} defaultChecked={goals.includes(value)} className="h-5 w-5 accent-blue1" />
              {label}
            </label>
          ))}
        </div>
        {errorText("goals")}
      </fieldset>
      <div className="flex flex-wrap gap-4">
        <Field label="Refeições por dia" name="mealsPerDay" type="number" min={1} max={10} className="w-48"
          defaultValue={v?.mealsPerDay ?? current?.mealsPerDay} error={state.errors?.mealsPerDay} />
        <Field label="Água por dia (litros)" name="waterLitersPerDay" inputMode="decimal" placeholder="1,5" className="w-48"
          defaultValue={v?.waterLitersPerDay ?? (current ? String(current.waterLitersPerDay).replace(".", ",") : "")} error={state.errors?.waterLitersPerDay} />
      </div>
      <fieldset>
        <legend className="mb-2 font-semibold">Atividade física</legend>
        <div className="flex flex-col gap-2">
          {ACTIVITY.map(([value, label]) => (
            <label key={value} className="flex items-center gap-2">
              <input type="radio" name="activityLevel" value={value} defaultChecked={(v?.activityLevel ?? current?.activityLevel) === value} className="h-5 w-5 accent-blue1" />
              {label}
            </label>
          ))}
        </div>
        {errorText("activityLevel")}
      </fieldset>
      {scale("sleepQuality", "Como está seu sono?", "muito ruim", "muito bom")}
      {scale("stressLevel", "Qual seu nível de estresse?", "muito baixo", "muito alto")}
      {area("dietaryRestrictions", "Restrições alimentares (alergias, intolerâncias, vegetarianismo...)")}
      {area("healthConditions", "Doenças ou medicamentos que o profissional deve saber")}
      {area("expectations", "O que você espera do acompanhamento?")}
      <p className="text-sm text-gray-700">Suas respostas são guardadas de forma criptografada.</p>
      <SubmitButton pending={pending} className="self-start">Salvar respostas</SubmitButton>
    </form>
  );
}
