import type { Metadata } from "next";
import VerifyEmailForm from "./VerifyEmailForm";

export const metadata: Metadata = { title: "Confirmar e-mail | NutriMente" };

/**
 * Página aberta pelo link do e-mail (/verify-email?token=...).
 *
 * A confirmação acontece SOZINHA ao abrir a página (o formulário é enviado
 * pelo navegador, via JavaScript) e já leva para o início da conta.
 *
 * Antes era preciso clicar num botão, para que os robôs que "abrem" links
 * para checar segurança (Outlook, antivírus) não gastassem o link. A maioria
 * desses robôs só baixa a página, sem rodar JavaScript, e por isso não
 * dispara a confirmação. Se algum rodar, o pior caso é o e-mail ficar
 * confirmado (o link prova a posse do e-mail de qualquer forma); a pessoa
 * entra com e-mail e senha normalmente. O botão continua como reserva.
 */
export default async function VerifyEmailPage({ searchParams }: PageProps<"/verify-email">) {
  const { token } = await searchParams;
  return <VerifyEmailForm token={typeof token === "string" ? token : ""} />;
}
