"use client";

// =============================================================
// useAccessibility
//
// Lê e altera as preferências de acessibilidade (tamanho da fonte e alto
// contraste). Uso:
//
//   const { prefs, update, reset } = useAccessibility();
//   update({ highContrast: true });
//
// Por que NÃO usamos Context (<Provider> em volta do site)?
// Antes havia um AccessibilityProvider envolvendo a página inteira. Logo
// depois de abrir a página, ele trocava as preferências padrão pelas salvas,
// e o valor do Context mudava. No React, uma mudança de Context que chega a
// um trecho que ainda está recebendo HTML do servidor (streaming, com o
// loading.tsx) faz o React DESCARTAR esse HTML e desenhar tudo de novo no
// navegador. Resultado: trabalho em dobro e uma cópia escondida do conteúdo
// sobrando na página (os testes chegavam a encontrar dois formulários).
//
// Agora cada componente que precisa das preferências lê direto do "store"
// abaixo com useSyncExternalStore. Quando elas mudam, só esses componentes
// são atualizados; o resto da página nem fica sabendo.
// =============================================================

import { useLayoutEffect, useSyncExternalStore } from "react";
import {
  AccessibilityPreferences,
  DEFAULT_PREFERENCES,
  applyPreferences,
  loadPreferences,
  savePreferences,
} from "./preferences";

// -------------------------------------------------------------
// "Store" das preferências (fora do React)
//
// Por que não um simples useState(loadPreferences)?
// O servidor não tem localStorage, então gera o HTML com as preferências
// PADRÃO. Se o navegador renderizar logo de cara com as preferências SALVAS,
// o HTML fica diferente e o React acusa erro de hidratação (#418).
// useSyncExternalStore resolve: usa getServerSnapshot (padrão) durante a
// hidratação e, logo em seguida, troca para o valor real (getSnapshot).
// O visual não pisca porque o script inline do <head> já aplicou tudo.
// -------------------------------------------------------------
let current: AccessibilityPreferences | null = null;
const listeners = new Set<() => void>();

function getSnapshot() {
  // Lê o localStorage só uma vez; depois devolve sempre o MESMO objeto
  // (o React compara por referência para saber se mudou)
  if (!current) current = loadPreferences();
  return current;
}

function getServerSnapshot() {
  return DEFAULT_PREFERENCES;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function setPreferences(next: AccessibilityPreferences) {
  current = next;
  savePreferences(next);
  applyPreferences(next);
  listeners.forEach((listener) => listener());
}

/** Altera uma ou mais preferências, salva e aplica na página */
function update(changes: Partial<AccessibilityPreferences>) {
  setPreferences({ ...getSnapshot(), ...changes });
}

/** Volta tudo ao padrão */
function reset() {
  setPreferences(DEFAULT_PREFERENCES);
}

// -------------------------------------------------------------

export function useAccessibility() {
  const prefs = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Em desenvolvimento, o Strict Mode do React "remonta" a página e apaga os
  // atributos que o script inline colocou no <html>. useLayoutEffect roda
  // antes da tela ser pintada e os coloca de volta. Em produção não muda nada.
  // (usa getSnapshot, o valor salvo de verdade, e não o padrão da hidratação)
  useLayoutEffect(() => {
    applyPreferences(getSnapshot());
  }, []);

  return { prefs, update, reset };
}
