"use client";

import { useEffect, type RefObject } from "react";
import type { FormState } from "@/app/lib/form";

/**
 * Depois de um envio com erro, leva o foco (e a tela) até o problema:
 * 1. o primeiro campo com erro (aria-invalid="true"), ou
 * 2. o aviso geral do formulário (role="alert"), ex.: "E-mail ou senha incorretos".
 *
 * Por quê? Num formulário longo no celular, o aviso no topo e os erros nos
 * campos ficam fora da tela, e a pessoa acha que nada aconteceu. Quem usa
 * leitor de tela também passa a ouvir o erro na hora.
 *
 * Uso: const ref = useRef<HTMLDivElement>(null); useFocusOnError(ref, state);
 *      e coloque ref={ref} no elemento que envolve o aviso e o formulário.
 */
export function useFocusOnError(ref: RefObject<HTMLElement | null>, state: FormState) {
  useEffect(() => {
    if (state.ok || (!state.message && !state.errors)) return;
    const root = ref.current;
    if (!root) return;
    const target =
      root.querySelector<HTMLElement>('[aria-invalid="true"]') ?? root.querySelector<HTMLElement>('[role="alert"]');
    if (!target) return;
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: "center" });
  }, [ref, state]);
}
