import type { ReactNode } from "react";

// Caixa branca com borda azul clara. Usada em todos os blocos da tela.
export default function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-blue-200 bg-white p-6 shadow-lg ${className}`}>{children}</div>;
}