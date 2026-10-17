

export default function Opcao({ label, marcado = false }: { label: string; marcado?: boolean }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
      <input
        type="checkbox"
        defaultChecked={marcado}
        className="h-4 w-4 rounded border-slate-300 accent-green-600"
      />
      {label}
    </label>
  );
}