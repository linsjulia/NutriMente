

export default function Checkbox({ label }: { label: string;}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-slate-300 accent-green-600 my-1.5"
      />
      {label}
    </label>
  );
}