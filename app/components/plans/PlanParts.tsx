/** Peças visuais dos planos de ação: avatar, anel de adesão, barra e marcadores */

export function initials(name: string) {
  const words = name.trim().split(/\s+/);
  return ((words[0]?.[0] ?? "") + (words.length > 1 ? words[words.length - 1][0] : "")).toUpperCase();
}

export function Avatar({ name, size = "h-9 w-9", text = "text-xs" }: { name: string; size?: string; text?: string }) {
  return (
    <span aria-hidden className={`flex shrink-0 items-center justify-center rounded-full bg-[#dcfbe8] font-extrabold text-green-900 ${size} ${text}`}>
      {initials(name)}
    </span>
  );
}

/** Anel com a porcentagem de adesão; onDark para usar sobre o fundo azul */
export function AdherenceRing({ value, size = 84, stroke = 10, onDark = false }: { value: number; size?: number; stroke?: number; onDark?: boolean }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div role="img" aria-label={`Adesão na semana: ${pct}%`} className="relative shrink-0" style={{ width: size, height: size }}>
      <svg aria-hidden width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} stroke={onDark ? "rgba(255,255,255,0.22)" : "#e3ecf7"} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} stroke="#00dc5a" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)}
        />
      </svg>
      <span
        aria-hidden
        className={`absolute inset-0 flex items-center justify-center font-bold leading-none ${onDark ? "text-white" : "text-[#14304a]"}`}
        style={{ fontSize: size * 0.26 }}
      >
        {pct}
        <span className="ml-0.5 pt-[0.2em] text-[0.5em]">%</span>
      </span>
    </div>
  );
}

export function ProgressBar({ done, total, color = "bg-[#00dc5a]" }: { done: number; total: number; color?: string }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div aria-hidden className="h-3 overflow-hidden rounded-full bg-[#e3ecf7]">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function CheckBadge({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 40 40" className={`shrink-0 ${className}`}>
      <circle cx="20" cy="20" r="20" fill="#00dc5a" />
      <path d="M12 20.5l5.5 5.5L28.5 14.5" stroke="#06402a" strokeWidth="3.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function EmptyBadge({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 40 40" className={`shrink-0 ${className}`}>
      <circle cx="20" cy="20" r="18.5" fill="#fff" stroke="#b9cce3" strokeWidth="3" />
    </svg>
  );
}