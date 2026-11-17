import type { Metadata } from "next";
import { Lock } from "lucide-react";
import { getMe } from "@/app/lib/dal";
import AccountTabs, { type AccountTab } from "./AccountTabs";
import { ChangePasswordForm, DeleteAccountForm, ProfileForm } from "./AccountForms";
import PhotoUpload from "./PhotoUpload";

export const metadata: Metadata = { title: "Minha conta | NutriMente" };

// "Minha conta": foto e dados fixos na lateral; abas para dados pessoais e senha;
// excluir conta (LGPD) fica separado, no fim da página.
export default async function AccountPage() {
  const me = await getMe();

  const tabs: AccountTab[] = [
    {
      id: "dados",
      label: "Dados pessoais",
      content: (
        <>
          <h2 className="text-xl font-bold">Dados pessoais</h2>
          <p className="mb-5 mt-1 text-gray-600">Estas informações aparecem para o seu profissional de saúde.</p>
          <ProfileForm name={me.name} telephone={me.telephone} gender={me.gender} />
        </>
      ),
    },
    {
      id: "senha",
      label: "Senha",
      content: (
        <>
          <h2 className="text-xl font-bold">Trocar senha</h2>
          <p className="mb-5 mt-1 text-gray-600">Use uma senha que você não usa em outros sites.</p>
          <ChangePasswordForm />
        </>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="font-fraunces text-3xl font-medium sm:text-4xl">Minha conta</h1>
        <p className="mt-1 text-gray-600">Mantenha seus dados atualizados para receber lembretes e avisos das consultas.</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[320px_1fr] lg:items-start">
        <aside className="flex flex-col gap-5 lg:top-32">
          <section aria-labelledby="foto" className="card">
            <h2 id="foto" className="sr-only">
              Foto de perfil
            </h2>
            <PhotoUpload name={me.name} photoUrl={me.photoUrl} />
          </section>

          {/* Dados que não podem ser alterados pela própria pessoa */}
          <section aria-labelledby="fixos" className="card">
            <h2 id="fixos" className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-600">
              <Lock size={15} aria-hidden="true" />
              Dados que você não edita aqui
            </h2>
            <dl className="flex flex-col divide-y divide-gray-200">
              <div className="pb-3">
                <dt className="text-sm text-gray-600">E-mail</dt>
                <dd className="break-all font-semibold">{me.email}</dd>
              </div>
              {me.cpfMasked && (
                <div className="py-3">
                  <dt className="text-sm text-gray-600">CPF</dt>
                  <dd className="font-semibold">{me.cpfMasked}</dd>
                </div>
              )}
              {me.birthDate && (
                <div className="pt-3">
                  <dt className="text-sm text-gray-600">Nascimento</dt>
                  <dd className="font-semibold">
                    {new Date(me.birthDate + "T12:00:00Z").toLocaleDateString("pt-BR", { timeZone: "UTC" })}
                  </dd>
                </div>
              )}
            </dl>
          </section>
        </aside>

        <div className="flex flex-col gap-6">
          <AccountTabs tabs={tabs} />

          {me.role !== "ADMIN" && (
            <section aria-labelledby="excluir" className="card flex flex-col gap-3 border-red-300">
              <h2 id="excluir" className="text-xl font-bold text-red-800">
                Excluir conta
              </h2>
              <p className="text-gray-700">
                Seus dados pessoais serão apagados (LGPD, art. 18). Registros de consultas e pagamentos são mantidos de
                forma anônima, como exige a lei. Essa ação não pode ser desfeita.
              </p>
              <DeleteAccountForm />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}