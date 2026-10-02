import type { Metadata } from "next";
import { getMe } from "@/app/lib/dal";
import { ChangePasswordForm, DeleteAccountForm, ProfileForm } from "./AccountForms";

export const metadata: Metadata = { title: "Minha conta | NutriMente" };

// "Minha conta": ver e editar dados, trocar senha, excluir conta (LGPD).
export default async function AccountPage() {
  const me = await getMe();

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-fraunces text-3xl font-medium sm:text-4xl">Minha conta</h1>

      <section aria-labelledby="dados" className="card">
        <h2 id="dados" className="text-xl font-bold">
          Dados pessoais
        </h2>
        {/* Dados que não podem ser alterados pela própria pessoa */}
        <dl className="my-5 grid gap-3 sm:grid-cols-3">
          <div>
            <dt className="text-sm text-gray-600">E-mail</dt>
            <dd className="break-all font-semibold">{me.email}</dd>
          </div>
          {me.cpfMasked && (
            <div>
              <dt className="text-sm text-gray-600">CPF</dt>
              <dd className="font-semibold">{me.cpfMasked}</dd>
            </div>
          )}
          {me.birthDate && (
            <div>
              <dt className="text-sm text-gray-600">Nascimento</dt>
              <dd className="font-semibold">{new Date(me.birthDate + "T12:00:00Z").toLocaleDateString("pt-BR", { timeZone: "UTC" })}</dd>
            </div>
          )}
        </dl>
        <ProfileForm name={me.name} telephone={me.telephone} gender={me.gender} />
      </section>

      <section aria-labelledby="senha" className="card">
        <h2 id="senha" className="mb-5 text-xl font-bold">
          Trocar senha
        </h2>
        <ChangePasswordForm />
      </section>

      {me.role !== "ADMIN" && (
        <section aria-labelledby="excluir" className="card border-red-300">
          <h2 id="excluir" className="text-xl font-bold text-red-800">
            Excluir conta
          </h2>
          <p className="my-3 text-gray-700">
            Seus dados pessoais serão apagados (LGPD, art. 18). Registros de consultas e pagamentos são mantidos de
            forma anônima, como exige a lei. Essa ação não pode ser desfeita.
          </p>
          <DeleteAccountForm />
        </section>
      )}
    </div>
  );
}
