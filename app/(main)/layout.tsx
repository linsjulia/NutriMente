import Header from "../components/Header";
import { getSession, homeFor } from "../lib/session";

// Layout das páginas públicas com cabeçalho (home, profissionais, sobre...).
// <html>, <body>, fontes e acessibilidade ficam no layout raiz (app/layout.tsx).
// Lê a sessão só para o cabeçalho mostrar "Entrar" ou "Minha área".
export default async function MainLayout({ children }: LayoutProps<"/">) {
  const session = await getSession();
  const user = session ? { name: session.name, home: homeFor(session.role) } : null;

  return (
    <>
      <Header user={user} />
      {children}
    </>
  );
}
