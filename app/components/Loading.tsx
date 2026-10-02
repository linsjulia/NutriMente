import { LoaderCircle } from "lucide-react";

// Indicador de carregamento usado pelos arquivos loading.tsx do Next.
// O Next mostra este componente na hora em que a pessoa clica num link,
// enquanto a página nova busca os dados na API (antes a tela ficava
// parada, sem nenhum sinal, por até 10 segundos se a API estivesse lenta).
// role="status": o leitor de tela anuncia "Carregando...".
export default function Loading({ label = "Carregando..." }: { label?: string }) {
  return (
    <div role="status" className="flex flex-1 items-center justify-center gap-3 py-24 text-gray-700">
      <LoaderCircle aria-hidden className="animate-spin text-blue1" size={28} />
      <span>{label}</span>
    </div>
  );
}
