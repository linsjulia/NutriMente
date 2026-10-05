import Image from "next/image";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { verifySession } from "@/app/lib/dal";
import AppNav from "./AppNav";

// Layout da área LOGADA (/dashboard, /account, /admin).
// verifySession() manda para o login quem não estiver logado.
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const session = await verifySession();

  const links =
    session.role === "ADMIN"
      ? [
          { href: "/admin/professionals", label: "Profissionais" },
          { href: "/account", label: "Minha conta" },
        ]
      : [
          { href: "/dashboard", label: "Início" },
          { href: "/professionals", label: "Profissionais" },
          { href: "/account", label: "Minha conta" },
        ];

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="bg-blue1 text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2" aria-label="NutriMente: página inicial">
            <Image src="/logo/nutrimente-v1.png" alt="" width={40} height={40} className="h-10 w-auto" />
          </Link>
          <AppNav links={links} />
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline">Olá, {session.name}</span>
            <form action={logout}>
              <button type="submit" className="flex items-center gap-2 rounded-full border border-white/60 px-4 py-2 font-semibold hover:bg-white/10">
                <LogOut aria-hidden size={18} /> Sair
              </button>
            </form>
          </div>
        </div>
      </header>
      <main id="conteudo" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
