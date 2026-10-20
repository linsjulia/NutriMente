import { ReactNode } from "react";

// Etiqueta de especialidade. Antes: texto #3B8F7E sobre #ACFFCE (contraste
// 3,1:1, abaixo do mínimo de 4,5:1 para texto pequeno) e um <h2>, que
// bagunçava a ordem dos títulos da página. Agora é um <span> com contraste AA.
export default function SpecialityBadge({children, className = "", speciality }: { children?: ReactNode; className?: string, speciality?: string } ) {
  return <span className={`w-fit rounded-full bg-[#ACFFCE] px-3 py-2 text-sm text-[#1f5e51] font-semibold ${className}`}>{children}{speciality}</span>;
}
