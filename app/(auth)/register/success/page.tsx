import type { Metadata } from "next";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import ResendVerification from "@/app/components/auth/ResendVerification";

export const metadata: Metadata = { title: "Confirme seu e-mail | NutriMente" };

export default async function RegisterSuccessPage({ searchParams }: PageProps<"/register/success">) {
  const { email, type } = await searchParams;
  const address = typeof email === "string" ? email : "";

  return (
    <div className="flex flex-col gap-6">
      <MailCheck aria-hidden size={56} className="text-green-700" />
      <h1 className="font-fraunces text-4xl font-medium">Confirme seu e-mail</h1>
      <p>
        Enviamos um link de confirmação para <strong>{address || "o seu e-mail"}</strong>. Abra a mensagem e clique no
        botão para ativar sua conta. O link vale por 24 horas.
      </p>
      {type === "professional" && (
        <p className="rounded-xl bg-blue3 p-4">
          Depois da confirmação, nossa equipe vai verificar seu registro profissional. Você já pode entrar e completar
          seu perfil enquanto isso.
        </p>
      )}
      <p className="text-sm text-gray-700">
        Em ambiente de desenvolvimento, os e-mails aparecem no Mailpit:{" "}
        <a href="http://localhost:8025" className="underline" target="_blank" rel="noreferrer">
          localhost:8025
        </a>
        .
      </p>
      <ResendVerification email={address} />
      <Link href="/login" className="btn-primary self-start">
        Ir para o login
      </Link>
    </div>
  );
}
