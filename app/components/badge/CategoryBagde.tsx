interface Prop {
  categoria: string;
}

// Etiqueta de especialidade. Antes: texto #3B8F7E sobre #ACFFCE (contraste
// 3,1:1, abaixo do mínimo de 4,5:1 para texto pequeno) e um <h2>, que
// bagunçava a ordem dos títulos da página. Agora é um <span> com contraste AA.
export default function CategoryBadge({ categoria }: Prop) {
  return <span className="w-fit rounded-full bg-[#ACFFCE] px-3 py-2 text-sm text-[#1f5e51]">{categoria}</span>;
}
