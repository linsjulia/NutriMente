"use client";

import { useActionState, useRef } from "react";
import { updateProfessionalProfile } from "@/app/actions/account";
import Field from "@/app/components/form/Field";
import { FormAlert, SubmitButton } from "@/app/components/form/FormParts";
import type { FormState } from "@/app/lib/form";
import { formatBRL } from "@/app/lib/money";
import { useFocusOnError } from "@/app/components/form/useFocusOnError";

export default function ProfessionalProfileForm({ bio, consultationPrice }: { bio: string | null; consultationPrice: number | null }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateProfessionalProfile, {});
  const resultRef = useRef<HTMLFormElement>(null);
  useFocusOnError(resultRef, state);
  const values = state.values;

  return (
    <form ref={resultRef} action={action} className="flex flex-col gap-5" noValidate>
      <FormAlert ok={state.ok} message={state.message} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="bio" className="font-semibold">
          Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={5}
          maxLength={500}
          defaultValue={values?.bio ?? bio ?? ""}
          aria-describedby="bio-hint"
          className="form-input"
        />
        <p id="bio-hint" className="text-sm text-gray-600">
          Até 500 caracteres. Conte sua abordagem e com quem você trabalha.
        </p>
        {state.errors?.bio && <p className="text-sm font-semibold text-red-700">{state.errors.bio}</p>}
      </div>
      <Field
        label="Valor da consulta (R$)"
        name="consultationPrice"
        inputMode="decimal"
        placeholder="150,00"
        defaultValue={values?.consultationPrice ?? formatBRL(consultationPrice)}
        hint="Ex.: 150 ou 1.000,50. Deixe em branco para “valor a combinar”."
        error={state.errors?.consultationPrice}
        className="max-w-xs"
      />
      <SubmitButton pending={pending} className="self-start">
        Salvar perfil
      </SubmitButton>
    </form>
  );
}
