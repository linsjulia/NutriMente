"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

export type AccountTab = { id: string; label: string; content: ReactNode };

/**
 * Abas da página "Minha conta".
 * Os painéis ficam montados (só escondidos) para não perder o que a pessoa
 * já digitou ao trocar de aba. Setas, Home e End mudam de aba pelo teclado.
 */
export default function AccountTabs({ tabs }: { tabs: AccountTab[] }) {
  const [active, setActive] = useState(tabs[0].id);
  const baseId = useId();
  const buttons = useRef<Record<string, HTMLButtonElement | null>>({});

  function select(id: string) {
    setActive(id);
    buttons.current[id]?.focus();
  }

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = tabs.length - 1;
    let next: number | null = null;
    if (e.key === "ArrowRight") next = index === last ? 0 : index + 1;
    if (e.key === "ArrowLeft") next = index === 0 ? last : index - 1;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = last;
    if (next === null) return;
    e.preventDefault();
    select(tabs[next].id);
  }

  return (
    <div className="flex flex-col gap-5">
      <div role="tablist" aria-label="Seções da conta" className="flex gap-1 border-b border-gray-200">
        {tabs.map((tab, i) => {
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                buttons.current[tab.id] = el;
              }}
              id={`${baseId}-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(tab.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={`-mb-px border-b-[3px] px-5 py-3 text-base font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue1 ${
                selected ? "border-blue1 text-blue1" : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {tabs.map((tab) => (
        <section
          key={tab.id}
          id={`${baseId}-panel-${tab.id}`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-${tab.id}`}
          hidden={tab.id !== active}
          className="card"
        >
          {tab.content}
        </section>
      ))}
    </div>
  );
}