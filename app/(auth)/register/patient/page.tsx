import type { Metadata } from "next";
import RegisterPatientForm from "./RegisterPatientForm";

export const metadata: Metadata = { title: "Cadastro de paciente | NutriMente" };

export default function RegisterPatientPage() {
  return <RegisterPatientForm />;
}
