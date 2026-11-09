"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { Check, X } from "lucide-react";
import { changePassword, deleteAccount, updateProfile } from "@/app/actions/account";
import Field from "@/app/components/form/Field";
import { FormAlert, GenderField, SubmitButton } from "@/app/components/form/FormParts";
import type { FormState } from "@/app/lib/form";
import { applyMask, maskPhone } from "@/app/lib/masks";
import { useFocusOnError } from "@/app/components/form/useFocusOnError";

/** Rodapé dos formulários: linha de separação e botão principal à direita. */
function FormFooter({ children }: { children: React.ReactNode }) {
  return <div className="mt-1 flex justify-end border-t border-gray-200 pt-5">{children}</div>;
}

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
      <FormFooter>
        <SubmitButton pending={pending}>Salvar dados</SubmitButton>
      </FormFooter>
    </form>
  );
}

/** Mostra, enquanto a pessoa digita, o que já foi atendido na nova senha (o servidor valida de novo). */
function PasswordRules({ value }: { value: string }) {
  const rules = [
    { ok: value.length >= 8, label: "8 caracteres ou mais" },
    { ok: /[A-Za-zÀ-ÿ]/.test(value), label: "Letras" },
    { ok: /\d/.test(value), label: "Números" },
  ];

  return (
    <ul aria-label="Requisitos da nova senha" className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-gray-600">
      {rules.map((rule) => (
        <li key={rule.label} className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className={`flex size-4 items-center justify-center rounded-full ${
              rule.ok ? "bg-emerald-600 text-white" : "border border-gray-300 bg-white"
            }`}
          >
            {rule.ok && <Check size={11} strokeWidth={3} />}
          </span>
          {rule.label}
          <span className="sr-only">{rule.ok ? " (atendido)" : " (falta)"}</span>
        </li>
      ))}
    </ul>
  );
}

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(changePassword, {});
  const [newPassword, setNewPassword] = useState("");
  const resultRef = useRef<HTMLFormElement>(null);
  useFocusOnError(resultRef, state);
  const e = state.errors ?? {};

  return (
    <form
      ref={resultRef}
      action={action}
      onReset={() => setNewPassword("")}
      className="flex flex-col gap-5"
      noValidate
    >
      <FormAlert ok={state.ok} message={state.message} />
      <Field label="Senha atual" name="currentPassword" type="password" autoComplete="current-password" required error={e.currentPassword} className="sm:max-w-sm" />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Nova senha"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          onInput={(ev) => setNewPassword(ev.currentTarget.value)}
          error={e.newPassword}
        />
        <Field label="Repita a nova senha" name="confirmPassword" type="password" autoComplete="new-password" required error={e.confirmPassword} />
      </div>
      <PasswordRules value={newPassword} />
      <FormFooter>
        <SubmitButton pending={pending}>Trocar senha</SubmitButton>
      </FormFooter>
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
  const dialogRef = useRef<HTMLDialogElement>(null);
  useFocusOnError(resultRef, state);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" className="btn-danger self-start">
        Quero excluir minha conta
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onClose={() => setOpen(false)}
        onCancel={(event) => {
          if (pending) event.preventDefault();
        }}
        className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border border-gray-200 bg-white p-0 text-gray-900 shadow-2xl backdrop:bg-black/60"
      >
        <div className="flex flex-col gap-5 p-6">
          <div className="flex items-start justify-between gap-4">
            <h2 id={titleId} className="text-xl font-bold text-red-800">
              Excluir conta
            </h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={pending}
              aria-label="Fechar confirmação de exclusão"
              className="rounded-full p-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
            >
              <X aria-hidden size={22} />
            </button>
          </div>
          <p id={descriptionId} className="text-gray-700">
            Seus dados pessoais serão apagados (LGPD, art. 18). Registros de consultas e pagamentos são mantidos de
            forma anônima, como exige a lei. Essa ação não pode ser desfeita.
          </p>
          <form ref={resultRef} action={action} className="flex flex-col gap-5" noValidate>
            <FormAlert ok={false} message={state.message} />
            <Field label='Digite "EXCLUIR" para confirmar' name="confirmation" required autoComplete="off" error={state.errors?.confirmation} />
            <Field label="Sua senha" name="password" type="password" autoComplete="current-password" required error={state.errors?.password} />
            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={pending} className="btn-danger">
                {pending ? "Excluindo..." : "Excluir definitivamente"}
              </button>
              <button type="button" onClick={() => setOpen(false)} disabled={pending} className="btn-secondary">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </>
  );
}