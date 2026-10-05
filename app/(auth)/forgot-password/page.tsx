import type { Metadata } from "next";
import ForgotPasswordForm from "./ForgotPasswordForm";

// Título da aba via metadata do Next. Antes era um <title> dentro de um
// componente "use client", que o Next ignorava: a aba mostrava só "NutriMente".
export const metadata: Metadata = { title: "Esqueci minha senha | NutriMente" };

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
