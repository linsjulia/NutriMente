"use client";

import { useActionState, useRef } from "react";
import { createSpecialty } from "@/app/actions/specialties";
import Field from "@/app/components/form/Field";
import { FormAlert, SubmitButton } from "@/app/components/form/FormParts";
import { useFocusOnError } from "@/app/components/form/useFocusOnError";
import type { FormState } from "@/app/lib/form";
import { PROFESSION_LABELS, type ProfessionalType } from "@/app/lib/types";

const TYPES: ProfessionalType[] = ["NUTRICIONISTA", "PSICOLOGO"];

export default function CreateSpecialtyForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(createSpecialty, {});
  const formRef = useRef<HTMLFormElement>(null);
  useFocusOnError(formRef, state);

  return (
    // key: depois de cadastrar, o React recria o formulário e limpa os campos
    <form key={state.ok ? state.message : "form"} ref={formRef} action={action} className="flex flex-col gap-5" noValidate>
      <FormAlert ok={state.ok} message={state.message} />
      <Field
        label="Nome da especialidade"
        name="name"
        required
        maxLength={100}
        defaultValue={state.values?.name}
        hint="Ex.: Nutrição Funcional, Terapia de Casal."
        error={state.errors?.name}
        className="max-w-md"
      />
      <div className="flex flex-col gap-1.5">
        <div className="flex gap-1">
          <label htmlFor="type" className="font-semibold">
            Profissão
          </label>
          <span aria-hidden className="font-semibold text-red-700">
            *
          </span>
        </div>
        <select
          id="type"
          name="type"
          required
          defaultValue={state.values?.type ?? ""}
          aria-invalid={state.errors?.type ? true : undefined}
          aria-describedby={state.errors?.type ? "type-error" : undefined}
          className="form-input max-w-xs"
        >
          <option value="" disabled>
            Escolha...
          </option>
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {PROFESSION_LABELS[t]}
            </option>
          ))}
        </select>
        {state.errors?.type && (
          <p id="type-error" className="text-sm font-semibold text-red-700">
            {state.errors.type}
          </p>
        )}
      </div>
      <SubmitButton pending={pending} className="self-start">
        Cadastrar especialidade
      </SubmitButton>
    </form>
  );
}
