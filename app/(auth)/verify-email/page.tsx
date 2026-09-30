import type { Metadata } from "next";
import VerifyEmailForm from "./VerifyEmailForm";

export const metadata: Metadata = { title: "Confirmar e-mail | NutriMente" };

/**
 * Página aberta pelo link do e-mail (/verify-email?token=...).
 *
 * Por que a confirmação é num BOTÃO e não automática ao abrir a página?
 * Alguns provedores de e-mail (Outlook, antivírus) "abrem" os links para
 * checar se são seguros. Se a página confirmasse sozinha, o link seria
 * gasto por esse robô. Com o botão (POST), só a pessoa confirma.
 */
export default async function VerifyEmailPage({ searchParams }: PageProps<"/verify-email">) {
  const { token } = await searchParams;
  return <VerifyEmailForm token={typeof token === "string" ? token : ""} />;
}
