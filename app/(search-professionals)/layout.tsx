import Footer from "../components/Footer";
import "../globals.css";
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import HeaderSearchBar from "../components/HeaderSearchBar";
config.autoAddCss = false;

export default async function MainLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <HeaderSearchBar/>
      {children}
      <Footer />
    </>
  );
}
