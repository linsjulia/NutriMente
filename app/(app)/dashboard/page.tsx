import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, ClipboardList, Search, UserRound } from "lucide-react";
import { getMe } from "@/app/lib/dal";
import { COUNCIL, PROFESSION_LABELS, STATUS_LABELS } from "@/app/lib/types";
import ProfessionalProfileForm from "./ProfessionalProfileForm";

export const metadata: Metadata = { title: "Início | NutriMente" };

/**
 * Página inicial da área logada. O conteúdo muda conforme o PAPEL:
 * - PATIENT: atalhos para buscar profissionais e editar a conta
 * - PROFESSIONAL: situação da verificação + bio e valor da consulta
 * - ADMIN: vai direto para a fila de aprovação
 */
export default async function DashboardPage() {
  const me = await getMe();
  if (me.role === "ADMIN") redirect("/admin/professionals");

  const firstName = me.name.split(" ")[0];

  if (me.role === "PROFESSIONAL" && me.professional) {
    const p = me.professional;
    return (
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="font-fraunces text-3xl font-medium sm:text-4xl">Olá, {firstName}!</h1>
          <p className="mt-2 text-gray-700">
            {PROFESSION_LABELS[p.type]} · {COUNCIL[p.type]} {p.document}
          </p>
        </div>

        {/* Situação da verificação do registro profissional */}
        <section aria-labelledby="status-title" className={`status-box status-${p.verificationStatus.toLowerCase()}`}>
          <h2 id="status-title" className="text-lg font-bold">
            Cadastro: {STATUS_LABELS[p.verificationStatus]}
          </h2>
          <p>
            {p.verificationStatus === "PENDING" &&
              "Nossa equipe está verificando seu registro profissional. Você recebe um e-mail assim que terminarmos. Enquanto isso, complete seu perfil."}
            {p.verificationStatus === "APPROVED" && "Seu perfil já aparece para os pacientes na busca de profissionais."}
            {p.verificationStatus === "REJECTED" &&
              "Não conseguimos confirmar seu registro. Confira o número do conselho ou fale com nossa equipe."}
          </p>
        </section>

        <section aria-labelledby="profile-title" className="card">
          <h2 id="profile-title" className="text-xl font-bold">
            Perfil profissional
          </h2>
          <p className="mb-5 text-gray-700">É o que os pacientes veem quando encontram você.</p>
          <ProfessionalProfileForm bio={p.bio} consultationPrice={p.consultationPrice} />
        </section>
      </div>
    );
  }

  // PATIENT
  const shortcuts = [
    { href: "/professionals", icon: Search, title: "Encontrar profissionais", text: "Nutricionistas e psicólogos verificados." },
    { href: "/account", icon: UserRound, title: "Meus dados", text: "Edite seu perfil e sua senha." },
  ];
  const soon = [
    { icon: CalendarDays, title: "Minhas consultas", text: "Agende, remarque e acompanhe suas consultas." },
    { icon: ClipboardList, title: "Plano de ação", text: "Metas, rotina alimentar e progresso." },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-fraunces text-3xl font-medium sm:text-4xl">Olá, {firstName}!</h1>
        <p className="mt-2 text-gray-700">Que bom ter você aqui. Por onde quer começar?</p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2">
        {shortcuts.map(({ href, icon: Icon, title, text }) => (
          <li key={href}>
            <Link href={href} className="card flex h-full items-start gap-4 transition hover:border-blue1">
              <Icon aria-hidden className="shrink-0 text-blue1" size={32} />
              <span>
                <span className="block text-lg font-bold">{title}</span>
                <span className="text-gray-700">{text}</span>
              </span>
            </Link>
          </li>
        ))}
        {soon.map(({ icon: Icon, title, text }) => (
          <li key={title} className="card flex items-start gap-4 bg-gray-50">
            <Icon aria-hidden className="shrink-0 text-gray-600" size={32} />
            <span>
              <span className="flex flex-wrap items-center gap-2 text-lg font-bold">
                {title}
                {/* Antes: opacity-70 deixava o texto com contraste abaixo do mínimo (WCAG) */}
                <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-800">Em breve</span>
              </span>
              <span className="text-gray-700">{text}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
