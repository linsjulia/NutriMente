"use client";

// =============================================================
// Campo de formulário acessível, usado em todas as telas.
//
// Cuida sozinho das regras que é fácil esquecer:
// - <label htmlFor> ligado ao <input id> (clicar no texto foca o campo e o
//   leitor de tela lê o nome certo)
// - aria-invalid quando há erro
// - aria-describedby ligando o input à dica e à mensagem de erro, para o
//   leitor de tela ler "CPF, inválido, CPF inválido"
// - campo de senha com botão mostrar/ocultar
// =============================================================

import { useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  error?: string;
  hint?: ReactNode;
};

export default function Field({ label, name, error, hint, type = "text", className = "", ...input }: FieldProps) {
  const id = useId();
  const [showPassword, setShowPassword] = useState(false);
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const isPassword = type === "password";

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {/* O asterisco fica FORA do <label>: o nome do campo é só "Senha", não
          "Senha *". Quem usa leitor de tela ouve "obrigatório" pelo atributo required. */}
      <div className="flex gap-1">
        <label htmlFor={id} className="font-semibold">
          {label}
        </label>
        {input.required && <span aria-hidden className="font-semibold text-red-700">*</span>}
      </div>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={isPassword && showPassword ? "text" : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
          className={`form-input ${isPassword ? "pr-12" : ""}`}
          {...input}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-gray-600"
          >
            {showPassword ? <EyeOff aria-hidden size={20} /> : <Eye aria-hidden size={20} />}
          </button>
        )}
      </div>
      {hint && (
        <p id={hintId} className="text-sm text-gray-600">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm font-semibold text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
