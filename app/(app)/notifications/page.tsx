import type { Metadata } from "next";
import Link from "next/link";
import { Bell, CalendarDays, CheckCheck, ChevronRight, ClipboardList, Info, MessageCircle, Star, Wallet } from "lucide-react";
import { api } from "@/app/lib/api";
import { verifySession } from "@/app/lib/dal";
import { openNotification, readAllNotifications } from "@/app/actions/followup";
import type { Page } from "@/app/lib/types";
import { formatWhen } from "@/app/lib/agenda";

export const metadata: Metadata = { title: "Notificações | NutriMente" };

type Notification = { id: number; type: string; title: string; body: string; linkUrl: string | null; read: boolean; createdAt: string };

/** Ícone, cor, texto do link de ação e nome do filtro de cada tipo. */
const TYPES = {
  APPOINTMENT: { icon: CalendarDays, tile: "bg-blue-50 text-blue-700", cta: "Ver consulta", filter: "consultas", label: "Consultas" },
  PLAN: { icon: ClipboardList, tile: "bg-emerald-50 text-emerald-700", cta: "Ver plano", filter: "planos", label: "Planos de ação" },
  MESSAGE: { icon: MessageCircle, tile: "bg-violet-50 text-violet-700", cta: "Responder", filter: "mensagens", label: "Mensagens" },
  PAYMENT: { icon: Wallet, tile: "bg-cyan-50 text-cyan-700", cta: "Ver recibo", filter: "pagamentos", label: "Pagamentos" },
  REVIEW: { icon: Star, tile: "bg-amber-50 text-amber-700", cta: "Avaliar", filter: "avaliacoes", label: "Avaliações" },
  SYSTEM: { icon: Info, tile: "bg-gray-100 text-gray-600", cta: "Abrir", filter: "sistema", label: "Sistema" },
} as const;
type KnownType = keyof typeof TYPES;
const FALLBACK = { icon: Bell, tile: "bg-gray-100 text-gray-600", cta: "Abrir" };

const typeOf = (n: Notification) => TYPES[n.type as KnownType] ?? FALLBACK;

/* ---------- datas (sempre no fuso de São Paulo) ---------- */

const TZ = "America/Sao_Paulo";
const dayKey = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);
const hourMinute = (d: Date) => new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(d);

function shortWhen(d: Date, now: Date, yesterday: string) {
  const minutes = Math.floor((now.getTime() - d.getTime()) / 60_000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `há ${minutes} min`;
  const key = dayKey(d);
  if (key === dayKey(now)) return `há ${Math.floor(minutes / 60)} h`;
  if (key === yesterday) return `ontem, ${hourMinute(d)}`;
  const weekday = new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, weekday: "long" }).format(d);
  const date = new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, day: "2-digit", month: "2-digit" }).format(d);
  return `${weekday}, ${date}`;
}

/** Separa a lista em Hoje / Ontem / Anteriores, mantendo a ordem que veio da API. */
function groupByDay(items: Notification[]) {
  const now = new Date();
  const today = dayKey(now);
  const yesterday = dayKey(new Date(now.getTime() - 86_400_000));
  const groups: { label: string; items: { n: Notification; when: string }[] }[] = [
    { label: "Hoje", items: [] },
    { label: "Ontem", items: [] },
    { label: "Anteriores", items: [] },
  ];
  for (const n of items) {
    const d = new Date(n.createdAt);
    if (Number.isNaN(d.getTime())) {
      groups[2].items.push({ n, when: formatWhen(n.createdAt) });
      continue;
    }
    const key = dayKey(d);
    const group = key === today ? groups[0] : key === yesterday ? groups[1] : groups[2];
    group.items.push({ n, when: shortWhen(d, now, yesterday) });
  }
  return groups.filter((g) => g.items.length > 0);
}

/* ---------- filtros (?filtro=nao-lidas | consultas | planos ...) ---------- */

function matchesFilter(n: Notification, filtro: string) {
  if (filtro === "nao-lidas") return !n.read;
  const entry = Object.entries(TYPES).find(([, t]) => t.filter === filtro);
  return entry ? n.type === entry[0] : true;
}

function FilterLink({ href, active, label, count, icon, highlight }: { href: string; active: boolean; label: string; count: number; icon: React.ReactNode; highlight?: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2 font-medium transition ${
        active ? "bg-blue-50 font-semibold text-blue1" : "text-gray-700 hover:bg-gray-50"
      }`}
    >
      {icon}
      <span>{label}</span>
      <span className={`ml-auto rounded-full px-2 text-sm font-semibold ${highlight && count > 0 ? "bg-blue1 text-white" : active ? "text-blue1" : "text-gray-600"}`}>
        {count}
      </span>
    </Link>
  );
}

/**
 * Lista de notificações. Cada uma é um botão (formulário): abrir marca como
 * lida e leva para a tela certa. Os filtros são links com ?filtro=..., então
 * tudo funciona sem JavaScript.
 */
export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ filtro?: string | string[] }> }) {
  const session = await verifySession();
  const { filtro: rawFiltro } = await searchParams;
  const filtro = (Array.isArray(rawFiltro) ? rawFiltro[0] : rawFiltro) ?? "todas";

  const result = await api<Page<Notification>>("/api/notifications?size=50", { token: session.token });
  const all = result.ok ? result.data.items : [];
  const unread = all.filter((n) => !n.read).length;
  const visible = all.filter((n) => matchesFilter(n, filtro));
  const groups = groupByDay(visible);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-fraunces text-3xl font-medium sm:text-4xl">Notificações</h1>
          <p className="mt-1 text-gray-600">
            {unread > 0 ? (
              <>
                Você tem <strong className="font-semibold text-blue1">{unread} {unread === 1 ? "não lida" : "não lidas"}</strong>. Toque em uma
                notificação para abrir a tela certa.
              </>
            ) : (
              "Você está em dia. Não há notificações novas."
            )}
          </p>
        </div>
        {unread > 0 && (
          <form action={readAllNotifications}>
            <button type="submit" className="btn-secondary inline-flex items-center gap-2">
              <CheckCheck size={18} aria-hidden="true" />
              Marcar todas como lidas
            </button>
          </form>
        )}
      </div>

      {!result.ok ? (
        <p role="alert" className="card border-red-300 text-red-800">{result.error.detail}</p>
      ) : all.length === 0 ? (
        <p className="card text-gray-700">Nenhuma notificação por aqui.</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[260px_1fr] lg:items-start lg:gap-9">
          <nav aria-label="Filtrar notificações" className="card flex gap-1 overflow-x-auto p-3 lg:sticky lg:top-32 lg:flex-col lg:overflow-visible">
            <FilterLink
              href="?filtro=todas"
              active={filtro !== "nao-lidas" && !Object.values(TYPES).some((t) => t.filter === filtro)}
              label="Todas"
              count={all.length}
              icon={<Bell size={18} aria-hidden="true" />}
            />
            <FilterLink
              href="?filtro=nao-lidas"
              active={filtro === "nao-lidas"}
              label="Não lidas"
              count={unread}
              highlight
              icon={<span aria-hidden="true" className="flex size-[18px] items-center justify-center"><span className="size-2.5 rounded-full bg-blue1" /></span>}
            />
            <p className="hidden px-3 pb-1 pt-4 text-xs font-semibold uppercase tracking-wide text-gray-500 lg:block">Por tipo</p>
            {Object.values(TYPES).map((t) => {
              const Icon = t.icon;
              return (
                <FilterLink
                  key={t.filter}
                  href={`?filtro=${t.filter}`}
                  active={filtro === t.filter}
                  label={t.label}
                  count={all.filter((n) => typeOf(n) === t).length}
                  icon={<Icon size={18} aria-hidden="true" />}
                />
              );
            })}
          </nav>

          <div className="flex flex-col gap-8">
            {groups.length === 0 ? (
              <p className="card text-gray-700">
                Nenhuma notificação neste filtro.{" "}
                <Link href="?filtro=todas" className="font-semibold text-blue1 underline">
                  Ver todas
                </Link>
              </p>
            ) : (
              groups.map((group) => (
                <section key={group.label} aria-label={group.label}>
                  <h2 className="mb-3 text-sm font-semibold text-gray-600">{group.label}</h2>
                  <ul className="flex flex-col gap-2.5">
                    {group.items.map(({ n, when }) => {
                      const type = typeOf(n);
                      const Icon = type.icon;
                      return (
                        <li key={n.id}>
                          <form action={openNotification}>
                            <input type="hidden" name="id" value={n.id} />
                            <input type="hidden" name="linkUrl" value={n.linkUrl ?? ""} />
                            <button
                              type="submit"
                              className={`card flex w-full items-start gap-4 text-left shadow-lg shadow-blue1/10 transition hover:border-blue1 ${
                                n.read ? "bg-gray-50" : "border-l-4 border-l-blue1"
                              }`}
                            >
                              <span className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${type.tile} ${n.read ? "opacity-75" : ""}`}>
                                <Icon aria-hidden="true" size={22} />
                              </span>
                              <span className="flex min-w-0 flex-1 flex-col gap-1">
                                <span className={n.read ? "font-semibold" : "font-bold"}>
                                  {n.title}
                                  {!n.read && <span className="ml-2 rounded-full bg-blue1 px-2 py-0.5 text-xs font-bold text-white">Nova</span>}
                                </span>
                                <span className={n.read ? "text-gray-600" : "text-gray-800"}>{n.body}</span>
                                {n.linkUrl && (
                                  <span className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-blue1">
                                    {type.cta}
                                    <ChevronRight size={15} aria-hidden="true" />
                                  </span>
                                )}
                              </span>
                              <time dateTime={n.createdAt} title={formatWhen(n.createdAt)} className="shrink-0 pt-0.5 text-sm text-gray-600">
                                {when}
                              </time>
                            </button>
                          </form>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))
            )}
            <p className="text-center text-sm text-gray-600">Mostrando as últimas 50 notificações</p>
          </div>
        </div>
      )}
    </div>
  );
}