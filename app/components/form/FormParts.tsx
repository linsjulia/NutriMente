"use client";

// Peças pequenas reaproveitadas pelos formulários.

import { useId, type ReactNode } from "react";
import { CircleAlert, CircleCheck, LoaderCircle } from "lucide-react";
import { GENDER_LABELS, type Gender } from "@/app/lib/types";

/** Botão de enviar que mostra "Enviando..." e trava enquanto espera a resposta */
export function SubmitButton({ pending, children, className = "" }: { pending: boolean; children: ReactNode; className?: string }) {
  return (
    <button type="submit" disabled={pending} aria-disabled={pending} className={`btn-primary ${className}`}>
      {pending && <LoaderCircle aria-hidden size={20} className="animate-spin" />}
      {pending ? "Enviando..." : children}
    </button>
  );
}

/**
 * Aviso no topo do formulário. role="alert" faz o leitor de tela ler a
 * mensagem assim que ela aparece (erro) / role="status" (sucesso).
 */
export function FormAlert({ ok, message, children }: { ok?: boolean; message?: string; children?: ReactNode }) {
  if (!message) return null;
  return (
    <div
      role={ok ? "status" : "alert"}
      className={`flex gap-3 rounded-xl border p-4 ${ok ? "border-green-600 bg-green-50 text-green-900" : "border-red-600 bg-red-50 text-red-900"}`}
    >
      {ok ? <CircleCheck aria-hidden className="shrink-0" /> : <CircleAlert aria-hidden className="shrink-0" />}
      <div className="flex flex-col gap-2">
        <p>{message}</p>
        {children}
      </div>
    </div>
  );
}

/** Caixa de seleção com texto (termos, consentimentos) */
export function Checkbox({ name, error, children, defaultChecked }: { name: string; error?: string; children: ReactNode; defaultChecked?: boolean }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-start gap-3">
        <input
          id={id}
          name={name}
          type="checkbox"
          required
          defaultChecked={defaultChecked}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="mt-1 h-5 w-5 shrink-0 accent-blue1"
        />
        <label htmlFor={id}>{children}</label>
      </div>
      {error && (
        <p id={`${id}-error`} className="text-sm font-semibold text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Gênero (opcional). <fieldset> + <legend> agrupam as opções: o leitor de
 * tela anuncia "Gênero, grupo" antes de ler cada uma.
 */
export function GenderField({ defaultValue, error }: { defaultValue?: string | null; error?: string }) {
  const id = useId();
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 font-semibold">
        Gênero <span className="font-normal text-gray-600">(opcional)</span>
      </legend>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(GENDER_LABELS) as Gender[]).map((gender) => (
          <div key={gender}>
            <input
              type="radio"
              id={`${id}-${gender}`}
              name="gender"
              value={gender}
              defaultChecked={defaultValue === gender}
              className="peer sr-only"
            />
            <label htmlFor={`${id}-${gender}`} className="chip">
              {GENDER_LABELS[gender]}
            </label>
          </div>
        ))}
      </div>
      {error && <p className="text-sm font-semibold text-red-700">{error}</p>}
    </fieldset>
  );
}
