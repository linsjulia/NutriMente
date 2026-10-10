"use client";

import { useActionState, useRef } from "react";
import { updateProfessionalProfile } from "@/app/actions/account";
import Field from "@/app/components/form/Field";
import { FormAlert, SubmitButton } from "@/app/components/form/FormParts";
import type { FormState } from "@/app/lib/form";
import { formatBRL } from "@/app/lib/money";
import { useFocusOnError } from "@/app/components/form/useFocusOnError";
import type { Specialty } from "@/app/lib/types";
import SpecialtyPicker from "./SpecialtyPicker";

type Props = {
  bio: string | null;
  consultationPrice: number | null;
  /** null = a lista não carregou (a API ficou fora); o resto do formulário funciona */
  specialtyOptions: Specialty[] | null;
  specialtyIds: number[];
  telehealthRegistered: boolean;
  office: { address: string | null; city: string | null; state: string | null };
};

const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

export default function ProfessionalProfileForm({ bio, consultationPrice, specialtyOptions, specialtyIds, telehealthRegistered, office }: Props) {
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
      {specialtyOptions ? (
        <SpecialtyPicker
          // Depois de um erro, mantém o que a pessoa marcou (e não o que estava salvo)
          key={values?.specialtyIds ?? "salvo"}
          options={specialtyOptions}
          selected={values?.specialtyIds != null ? values.specialtyIds.split(",").filter(Boolean).map(Number) : specialtyIds}
          error={state.errors?.specialtyIds}
        />
      ) : (
        <p className="text-sm text-gray-700">Não conseguimos carregar as especialidades agora. Tente de novo em instantes.</p>
      )}
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 text-lg font-bold">Como você atende</legend>
        <input type="hidden" name="attendanceShown" value="1" />
        <div className="flex items-start gap-3">
          <input id="telehealthRegistered" name="telehealthRegistered" type="checkbox" defaultChecked={values ? values.telehealthRegistered === "on" : telehealthRegistered}
            aria-describedby="telehealth-hint" className="mt-1 h-5 w-5 shrink-0 accent-blue1" />
          <label htmlFor="telehealthRegistered">Atendo online e tenho cadastro no <strong>e-Psi</strong> (psicólogos) ou no <strong>e-Nutricionista</strong> (nutricionistas)</label>
        </div>
        <p id="telehealth-hint" className="text-sm text-gray-600">Exigência dos conselhos (CFP 11/2018, CFN 666/2020). Nossa equipe confere.</p>
        <p className="font-semibold">Consultório <span className="font-normal text-gray-600">(para consultas presenciais; deixe em branco se atende só online)</span></p>
        <Field label="Endereço" name="officeAddress" maxLength={200} placeholder="Rua, número, sala, bairro"
          defaultValue={values?.officeAddress ?? office.address ?? ""} error={state.errors?.officeAddress} />
        <div className="flex flex-wrap gap-4">
          <Field label="Cidade" name="officeCity" maxLength={100} className="min-w-60 flex-1"
            defaultValue={values?.officeCity ?? office.city ?? ""} error={state.errors?.officeCity} />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="officeState" className="font-semibold">UF</label>
            <select id="officeState" name="officeState" defaultValue={values?.officeState ?? office.state ?? ""} className="form-input"
              aria-invalid={state.errors?.officeState ? true : undefined}>
              <option value="">—</option>
              {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
            </select>
            {state.errors?.officeState && <p className="text-sm font-semibold text-red-700">{state.errors.officeState}</p>}
          </div>
        </div>
      </fieldset>
      <SubmitButton pending={pending} className="self-start">
        Salvar perfil
      </SubmitButton>
    </form>
  );
}
