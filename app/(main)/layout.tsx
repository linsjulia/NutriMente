import Header from "../components/Header";

// Layout das páginas públicas com cabeçalho (home, sobre...).
// <html>, <body>, fontes e acessibilidade ficam no layout raiz (app/layout.tsx).
export default function MainLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Header />
      {children}
    </>
  );
}
