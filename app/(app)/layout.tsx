import Image from "next/image";
import Link from "next/link";
import { Bell } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { api } from "@/app/lib/api";
import { getMe, verifySession } from "@/app/lib/dal";
import AppNav from "./AppNav";

// Layout da área LOGADA (/dashboard, /account, /admin).
// verifySession() manda para o login quem não estiver logado.
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const [session, me] = await Promise.all([verifySession(), getMe()]);
  // Contador do sino (o admin não recebe notificações de consulta)
  const unread =
    session.role === "ADMIN"
      ? null
      : await api<{ count: number }>("/api/notifications/unread-count", { token: session.token });
  const count = unread?.ok ? unread.data.count : 0;

  const links =
    session.role === "ADMIN"
      ? [
          { href: "/admin/professionals", label: "Profissionais" },
          { href: "/admin/specialties", label: "Especialidades" },
          { href: "/account", label: "Minha conta" },
        ]
      : [
          { href: "/dashboard", label: "Início" },
          { href: "/appointments/history", label: session.role === "PATIENT" ? "Consultas" : "Agenda" },
          ...(session.role === "PROFESSIONAL" ? [{ href: "/patients", label: "Pacientes" }] : []),
          { href: "/plans", label: "Planos" },
          ...(session.role === "PATIENT" ? [{ href: "/professionals", label: "Profissionais" },{ href: "/diary", label: "Diário" }] : []),
          { href: "/account", label: "Minha conta" },
        ];

  return (
    <div className="flex min-h-screen flex-col bg-linear-0 from-white to-sky-200/50">
      <header className="sticky top-0 z-50 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2" aria-label="NutriMente: página inicial">
            <Image src="/logo/nutrimente-v2.png" alt="" width={60} height={60} className="h-15 w-auto" />
          </Link>
          <AppNav links={links} />
          <div className="flex items-center gap-3">
            {unread && (
              <Link
                href="/notifications"
                aria-label={count > 0 ? `Notificações: ${count} não lidas` : "Notificações"}
                className="relative flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/10"
              >
                <Bell aria-hidden size={22} />
                {count > 0 && (
                  <span aria-hidden className="absolute -top-0.5 -right-0.5 min-w-5 rounded-full bg-green1 px-1 text-center text-xs font-bold leading-5">
                    {count > 9 ? "9+" : count}
                  </span>
                )}
              </Link>
            )}
            <span className="hidden sm:inline">Olá, {session.name}</span>
            <form action={logout}>
              <button type="submit" className="min-h-11 rounded-full px-3 font-semibold hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-blue1">
                Sair
              </button>
            </form>
            <Link href="/account" aria-label="Minha conta" title="Minha conta" className="rounded-full ring-offset-2 focus-visible:outline-2 focus-visible:outline-blue1">
              <Image
                src={me.photoUrl ?? "/icons/circle-user-solid-full-blue.svg"}
                alt=""
                width={40}
                height={40}
                className="h-10 w-10 rounded-full object-cover"
              />
            </Link>
          </div>
        </div>
      </header>
      <main id="conteudo" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
