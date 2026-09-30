import type { Metadata } from "next";
import RegisterProfessionalForm from "./RegisterProfessionalForm";

export const metadata: Metadata = { title: "Cadastro de profissional | NutriMente" };

export default function RegisterProfessionalPage() {
  return <RegisterProfessionalForm />;
}
