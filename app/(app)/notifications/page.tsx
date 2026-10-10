import type { Metadata } from "next";
import { Bell, CalendarDays, ClipboardList, Info, MessageCircle, Star, Wallet } from "lucide-react";
import { api } from "@/app/lib/api";
import { verifySession } from "@/app/lib/dal";
import { openNotification, readAllNotifications } from "@/app/actions/followup";
import type { Page } from "@/app/lib/types";
import { formatWhen } from "@/app/lib/agenda";

export const metadata: Metadata = { title: "Notificações | NutriMente" };

type Notification = { id: number; type: string; title: string; body: string; linkUrl: string | null; read: boolean; createdAt: string };

const ICONS = { APPOINTMENT: CalendarDays, PLAN: ClipboardList, REVIEW: Star, MESSAGE: MessageCircle, PAYMENT: Wallet, SYSTEM: Info } as const;

/**
 * Lista de notificações. Cada uma é um botão (formulário): abrir marca como
 * lida e leva para a tela certa. Funciona sem JavaScript.
 */
export default async function NotificationsPage() {
  const session = await verifySession();
  const result = await api<Page<Notification>>("/api/notifications?size=50", { token: session.token });
  const hasUnread = result.ok && result.data.items.some((n) => !n.read);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-fraunces text-3xl font-medium sm:text-4xl">Notificações</h1>
        {hasUnread && (
          <form action={readAllNotifications}>
            <button type="submit" className="btn-secondary">Marcar todas como lidas</button>
          </form>
        )}
      </div>
      {!result.ok ? (
        <p role="alert" className="card border-red-300 text-red-800">{result.error.detail}</p>
      ) : result.data.items.length === 0 ? (
        <p className="card text-gray-700">Nenhuma notificação por aqui.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {result.data.items.map((n) => {
            const Icon = ICONS[n.type as keyof typeof ICONS] ?? Bell;
            return (
              <li key={n.id}>
                <form action={openNotification}>
                  <input type="hidden" name="id" value={n.id} />
                  <input type="hidden" name="linkUrl" value={n.linkUrl ?? ""} />
                  <button type="submit" className={`card flex w-full items-start gap-4 text-left transition hover:border-blue1 ${n.read ? "" : "border-blue1 bg-blue-50"}`}>
                    <Icon aria-hidden className="mt-1 shrink-0 text-blue1" size={24} />
                    <span className="flex flex-col gap-1">
                      <span className="font-bold">
                        {n.title}
                        {!n.read && <span className="ml-2 rounded-full bg-blue1 px-2 py-0.5 text-xs text-white">Nova</span>}
                      </span>
                      <span>{n.body}</span>
                      <span className="text-sm text-gray-700 first-letter:uppercase">{formatWhen(n.createdAt)}</span>
                    </span>
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
