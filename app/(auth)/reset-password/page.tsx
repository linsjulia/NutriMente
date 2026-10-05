import type { Metadata } from "next";
import ResetPasswordForm from "./ResetPasswordForm";

export const metadata: Metadata = { title: "Nova senha | NutriMente" };

// Aberta pelo link do e-mail (/reset-password?token=...)
export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  const { token } = await searchParams;
  return <ResetPasswordForm token={typeof token === "string" ? token : ""} />;
}
