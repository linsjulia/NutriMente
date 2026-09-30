"use client";

// =============================================================
// AccessibilityProvider
//
// Guarda as preferências de acessibilidade num "Context" do React: um jeito
// de compartilhar um estado com QUALQUER componente da árvore sem passar
// props de pai para filho. Qualquer componente pode fazer:
//
//   const { prefs } = useAccessibility();
//   if (prefs.highContrast) { ... }
//
// =============================================================

import { createContext, useContext, useLayoutEffect, useSyncExternalStore } from "react";
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

// -------------------------------------------------------------

type AccessibilityContextValue = {
  prefs: AccessibilityPreferences;
  /** Altera uma ou mais preferências, salva e aplica na página */
  update: (changes: Partial<AccessibilityPreferences>) => void;
  /** Volta tudo ao padrão */
  reset: () => void;
};

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

const update = (changes: Partial<AccessibilityPreferences>) =>
  setPreferences({ ...getSnapshot(), ...changes });
const reset = () => setPreferences(DEFAULT_PREFERENCES);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const prefs = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Em desenvolvimento, o Strict Mode do React "remonta" a página e apaga os
  // atributos que o script inline colocou no <html>. useLayoutEffect roda
  // antes da tela ser pintada e os coloca de volta. Em produção não muda nada.
  // (usa getSnapshot, o valor salvo de verdade, e não o padrão da hidratação)
  useLayoutEffect(() => {
    applyPreferences(getSnapshot());
  }, []);

  return (
    <AccessibilityContext.Provider value={{ prefs, update, reset }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error("useAccessibility precisa estar dentro de <AccessibilityProvider>");
  }
  return context;
}
