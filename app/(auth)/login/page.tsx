import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "Entrar | NutriMente" };

// searchParams: parâmetros da URL (?reset=1, ?expired=1) para mostrar avisos
export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const notice =
    params.reset === "1"
      ? "Senha alterada! Entre com a nova senha."
      : params.expired === "1"
        ? "Sua sessão terminou. Entre novamente."
        : undefined;

  return <LoginForm notice={notice} />;
}
