"use client";

import { useActionState, useRef, useState } from "react";
import { changePassword, deleteAccount, updateProfile } from "@/app/actions/account";
import Field from "@/app/components/form/Field";
import { FormAlert, GenderField, SubmitButton } from "@/app/components/form/FormParts";
import type { FormState } from "@/app/lib/form";
import { applyMask, maskPhone } from "@/app/lib/masks";
import { useFocusOnError } from "@/app/components/form/useFocusOnError";

export function ProfileForm({ name, telephone, gender }: { name: string; telephone: string | null; gender: string | null }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateProfile, {});
  const resultRef = useRef<HTMLFormElement>(null);
  useFocusOnError(resultRef, state);
  const v = state.values;

  return (
    <form ref={resultRef} action={action} className="flex flex-col gap-5" noValidate>
      <FormAlert ok={state.ok} message={state.message} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nome completo" name="name" autoComplete="name" required defaultValue={v?.name ?? name} error={state.errors?.name} />
        <Field
          label="Celular"
          hint="Com DDD."
          name="telephone"
          type="tel"
          autoComplete="tel-national"
          required
          onInput={applyMask(maskPhone)}
          defaultValue={v?.telephone ?? maskPhone(telephone ?? "")}
          error={state.errors?.telephone}
        />
      </div>
      <GenderField defaultValue={v ? v.gender : gender} error={state.errors?.gender} />
      <SubmitButton pending={pending} className="self-start">
        Salvar dados
      </SubmitButton>
    </form>
  );
}

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(changePassword, {});
  const resultRef = useRef<HTMLFormElement>(null);
  useFocusOnError(resultRef, state);
  const e = state.errors ?? {};

  return (
    <form ref={resultRef} action={action} className="flex flex-col gap-5" noValidate>
      <FormAlert ok={state.ok} message={state.message} />
      <Field label="Senha atual" name="currentPassword" type="password" autoComplete="current-password" required error={e.currentPassword} className="sm:max-w-sm" />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Nova senha"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          hint="Mínimo de 8 caracteres, com letras e números."
          error={e.newPassword}
        />
        <Field label="Repita a nova senha" name="confirmPassword" type="password" autoComplete="new-password" required error={e.confirmPassword} />
      </div>
      <SubmitButton pending={pending} className="self-start">
        Trocar senha
      </SubmitButton>
    </form>
  );
}

/**
 * Excluir conta pede duas confirmações: digitar EXCLUIR e a senha.
 * O formulário só aparece depois de clicar no primeiro botão, para ninguém
 * excluir por engano.
 */
export function DeleteAccountForm() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<FormState, FormData>(deleteAccount, {});
  const resultRef = useRef<HTMLFormElement>(null);
  useFocusOnError(resultRef, state);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-danger">
        Quero excluir minha conta
      </button>
    );
  }

  return (
    <form ref={resultRef} action={action} className="flex flex-col gap-5" noValidate>
      <FormAlert ok={false} message={state.message} />
      <Field label='Digite "EXCLUIR" para confirmar' name="confirmation" required autoComplete="off" error={state.errors?.confirmation} className="sm:max-w-sm" />
      <Field label="Sua senha" name="password" type="password" autoComplete="current-password" required error={state.errors?.password} className="sm:max-w-sm" />
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={pending} className="btn-danger">
          {pending ? "Excluindo..." : "Excluir definitivamente"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn-secondary">
          Cancelar
        </button>
      </div>
    </form>
  );
}
