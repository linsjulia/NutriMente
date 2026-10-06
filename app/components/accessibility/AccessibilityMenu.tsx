"use client";

// =============================================================
// Menu de acessibilidade (botão flutuante no canto da tela)
//
// Regras de acessibilidade que o PRÓPRIO menu segue (vale como exemplo para
// o resto do projeto):
// - Usa <button> de verdade: recebe foco pelo Tab e funciona com Enter/Espaço.
// - aria-expanded no botão principal: o leitor de tela diz se o menu está
//   aberto ou fechado.
// - aria-pressed nos botões liga/desliga: o leitor de tela diz "ativado" ou
//   "desativado".
// - Tecla Esc fecha o menu e devolve o foco para o botão que o abriu.
// - Atalho Alt + A abre/fecha o menu de qualquer lugar da página.
// - aria-live anuncia mudanças (ex.: "Fonte em 130%") para quem não vê a tela.
// - Todo ícone tem aria-hidden: o leitor lê só o texto, não "imagem".
// =============================================================

import { useEffect, useId, useRef, useState } from "react";
import { AArrowDown, AArrowUp, Accessibility, Contrast, RotateCcw, X } from "lucide-react";
import { useAccessibility } from "./useAccessibility";
import { AccessibilityPreferences, FONT_SCALES } from "./preferences";

type ToggleKey = Exclude<keyof AccessibilityPreferences, "fontLevel">;

// Lista das opções liga/desliga. Para criar uma nova opção:
// 1. adicione o campo em preferences.ts (tipo, padrão, applyPreferences e script inline);
// 2. adicione aqui;
// 3. escreva o CSS em globals.css.
const TOGGLES: { key: ToggleKey; label: string; description: string; Icon: typeof Contrast }[] = [
  {
    key: "highContrast",
    label: "Alto contraste",
    description: "Fundo escuro com texto claro",
    Icon: Contrast,
  },
];

export default function AccessibilityMenu() {
  const { prefs, update, reset } = useAccessibility();
  const [open, setOpen] = useState(false);
  // Mensagem lida pelo leitor de tela após cada ação
  const [announcement, setAnnouncement] = useState("");

  const toggleButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const titleId = useId();

  // Atalho global Alt + A
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.altKey && event.key.toLowerCase() === "a") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Ao abrir, leva o foco para dentro do painel (quem usa teclado ou leitor
  // de tela já "cai" nas opções)
  useEffect(() => {
    if (open) panelRef.current?.querySelector<HTMLElement>("button")?.focus();
  }, [open]);

  function close() {
    setOpen(false);
    toggleButtonRef.current?.focus();
  }

  function changeFont(delta: number) {
    const fontLevel = Math.min(Math.max(prefs.fontLevel + delta, 0), FONT_SCALES.length - 1);
    update({ fontLevel });
    setAnnouncement(`Fonte em ${Math.round(FONT_SCALES[fontLevel] * 100)}%`);
  }

  function toggle(key: ToggleKey, label: string) {
    const enabled = !prefs[key];
    update({ [key]: enabled });
    setAnnouncement(`${label} ${enabled ? "ativado" : "desativado"}`);
  }

  function resetAll() {
    reset();
    setAnnouncement("Configurações de acessibilidade restauradas");
  }

  const fontPercent = Math.round(FONT_SCALES[prefs.fontLevel] * 100);

  return (
    // fixed + z-[1000]: fica sempre visível, por cima de tudo, no canto
    // inferior DIREITO. À esquerda ele cobria os rótulos dos campos no
    // celular (rótulos ficam alinhados à esquerda) e fica mais perto do
    // polegar de quem é destro.
    <div className="fixed bottom-3 right-3 z-[1000] flex flex-col items-end gap-3 sm:bottom-5 sm:right-5">
      {open && (
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-labelledby={titleId}
          onKeyDown={(event) => event.key === "Escape" && close()}
          className="w-80 max-w-[calc(100vw-2.5rem)] rounded-2xl border border-gray-200 bg-white p-5 text-blue2 shadow-2xl"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 id={titleId} className="text-lg font-bold">
              Acessibilidade
            </h2>
            <button
              type="button"
              onClick={close}
              aria-label="Fechar menu de acessibilidade"
              className="rounded-full p-1 hover:bg-gray-100"
            >
              <X aria-hidden size={22} />
            </button>
          </div>

          {/* Tamanho da fonte */}
          <div className="mb-4">
            <p className="mb-2 font-semibold" id={`${titleId}-font`}>
              Tamanho do texto: {fontPercent}%
            </p>
            <div className="flex gap-2" role="group" aria-labelledby={`${titleId}-font`}>
              <button
                type="button"
                onClick={() => changeFont(-1)}
                disabled={prefs.fontLevel === 0}
                className="a11y-option flex-1 justify-center"
              >
                <AArrowDown aria-hidden size={22} />
                Diminuir
              </button>
              <button
                type="button"
                onClick={() => changeFont(1)}
                disabled={prefs.fontLevel === FONT_SCALES.length - 1}
                className="a11y-option flex-1 justify-center"
              >
                <AArrowUp aria-hidden size={22} />
                Aumentar
              </button>
            </div>
          </div>

          {/* Opções liga/desliga */}
          <ul className="flex flex-col gap-2">
            {TOGGLES.map(({ key, label, description, Icon }) => (
              <li key={key}>
                <button
                  type="button"
                  aria-pressed={prefs[key]}
                  onClick={() => toggle(key, label)}
                  className="a11y-option w-full"
                >
                  <Icon aria-hidden size={22} className="shrink-0" />
                  <span className="flex flex-col text-left">
                    <span className="font-semibold">{label}</span>
                    <span className="text-sm opacity-80">{description}</span>
                  </span>
                  {/* Indicador visual extra, além da cor (quem não distingue cores também percebe) */}
                  <span aria-hidden className="ml-auto text-sm font-bold">
                    {prefs[key] ? "ON" : "OFF"}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={resetAll}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl p-2 font-semibold text-blue1 underline"
          >
            <RotateCcw aria-hidden size={18} />
            Restaurar padrão
          </button>

          <p className="mt-3 text-center text-xs opacity-80">Atalho: Alt + A</p>
        </div>
      )}

      <button
        ref={toggleButtonRef}
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label="Menu de acessibilidade"
        title="Acessibilidade (Alt + A)"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-blue1 text-white shadow-lg transition hover:scale-105 sm:h-14 sm:w-14"
      >
        <Accessibility aria-hidden size={28} />
      </button>

      {/* Região viva: o leitor de tela lê o texto sempre que ele muda */}
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}
