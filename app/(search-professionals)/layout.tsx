import Footer from "../components/Footer";
import "../globals.css";
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import HeaderSearchBar from "../components/HeaderSearchBar";
import { getSession, homeFor } from "../lib/session";
config.autoAddCss = false;

export default async function MainLayout({ children }: LayoutProps<"/">) {
  // Cabeçalho mostra quem está logado (antes era o nome "Júlia" fixo para todos)
  const session = await getSession();
  const user = session ? { name: session.name, home: homeFor(session.role) } : null;
  return (
    <>
      <HeaderSearchBar user={user} />
      {children}
      <Footer />
    </>
  );
}
