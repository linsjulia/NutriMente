"use client";

import { useState } from "react";
import type { Specialty } from "@/app/lib/types";

const MAX = 5;

/**
 * Escolha de especialidades em "pílulas" (checkbox escondido + label).
 * Funciona com teclado (Tab + Espaço) e leitor de tela: cada pílula é um
 * checkbox de verdade, dentro de um <fieldset> com <legend>.
 *
 * Ao chegar a 5, as outras ficam desabilitadas (a API também recusa mais
 * de 5; aqui é só para a pessoa perceber o limite antes de enviar).
 */
export default function SpecialtyPicker({
  options,
  selected,
  error,
}: {
  options: Specialty[];
  selected: number[];
  error?: string;
}) {
  const [chosen, setChosen] = useState<Set<number>>(() => new Set(selected));
  const full = chosen.size >= MAX;

  function toggle(id: number, checked: boolean) {
    setChosen((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  return (
    <fieldset
      className="flex flex-col gap-2"
      aria-describedby={`specialties-hint${error ? " specialties-error" : ""}`}
      aria-invalid={error ? true : undefined}
      tabIndex={error ? -1 : undefined}
    >
      <legend className="mb-1 font-semibold">Especialidades</legend>
      {/* Avisa a Server Action que a lista foi mostrada: sem nenhuma marcada,
          ela envia [] (remove todas) em vez de "não mexer" */}
      <input type="hidden" name="specialtiesShown" value="1" />
      <ul className="flex flex-wrap gap-2">
        {options.map((s) => {
          const checked = chosen.has(s.id);
          return (
            <li key={s.id}>
              <input
                type="checkbox"
                id={`specialty-${s.id}`}
                name="specialtyIds"
                value={s.id}
                checked={checked}
                disabled={full && !checked}
                onChange={(e) => toggle(s.id, e.target.checked)}
                className="sr-only"
              />
              <label htmlFor={`specialty-${s.id}`} className="chip">
                {s.name}
              </label>
            </li>
          );
        })}
      </ul>
      <p id="specialties-hint" className="text-sm text-gray-600" aria-live="polite">
        Escolha até {MAX}. {chosen.size} de {MAX} escolhidas.
      </p>
      {error && (
        <p id="specialties-error" className="text-sm font-semibold text-red-700">
          {error}
        </p>
      )}
    </fieldset>
  );
}
