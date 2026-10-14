import type { LucideIcon } from "lucide-react";

interface CardProps {
  titulo: string;
  descricao: string;
  corFundo?: "branco" | "azul";
  corIcon?: string;
  icone?: LucideIcon;
}

export default function CardFeatures({
  titulo,
  descricao,
  corFundo,
  corIcon = "bg-white",
  icone: Icone,
}: CardProps) {
  return (
    <div className="flex-1">
      <div
        className={`cards-landing2 flex h-full items-center gap-4 rounded-2xl p-4 shadow-lg shadow-blue-900/5 transition duration-300 hover:-translate-y-1 lg:gap-[clamp(0.75rem,1.4vw,1.25rem)] lg:p-[clamp(0.875rem,1.5vw,1.5rem)] ${
          corFundo === "azul" ? "bg-blue-100" : "bg-white"
        }`}
      >
        <div
          className={`${corIcon} shrink-0 rounded-lg p-4 lg:p-[clamp(0.625rem,1.1vw,1.25rem)]`}
        >
          {Icone && (
            <Icone className="size-10 lg:size-[clamp(2rem,3.3vw,3.75rem)]" />
          )}
        </div>

        <div className="min-w-0">
          <h3 className="text-base font-bold lg:text-[clamp(0.9375rem,1.25vw,1.125rem)]">
            {titulo}
          </h3>
          <p className="mt-1 text-sm text-gray-600 lg:text-[clamp(0.75rem,0.95vw,0.9375rem)]">
            {descricao}
          </p>
        </div>
      </div>
    </div>
  );
}