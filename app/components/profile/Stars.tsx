// Estrelas: 4,7 mostra 4 cheias e 1 vazia (como no Figma).
export default function Stars({ value, className = "text-sm" }: { value: number; className?: string }) {
  const cheias = Math.floor(value);
  return (
    <span role="img" aria-label={`${value} de 5 estrelas`} className={`text-yellow-600 ${className}`}>
      {"★".repeat(cheias)}
      <span className="text-gray-300">{"★".repeat(5 - cheias)}</span>
    </span>
  );
}