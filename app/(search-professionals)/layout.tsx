import Header from "../components/Header";
import Footer from "../components/Footer";
import { getSession, homeFor } from "../lib/session";
import "../globals.css";
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import HeaderSearchBar from "../components/HeaderSearchBar";
config.autoAddCss = false;

// Layout das páginas públicas com cabeçalho (home, profissionais, sobre...).
// <html>, <body>, fontes e acessibilidade ficam no layout raiz (app/layout.tsx).
// Lê a sessão só para o cabeçalho mostrar "Entrar" ou "Minha área".
export default async function MainLayout({ children }: LayoutProps<"/">) {
  const session = await getSession();
  const user = session ? { name: session.name, home: homeFor(session.role) } : null;

  return (
    <>
      <HeaderSearchBar/>
      {children}
      <Footer />
    </>
  );
}
