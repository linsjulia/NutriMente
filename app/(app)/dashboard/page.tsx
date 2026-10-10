import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, ClipboardList, Search, UserRound, Utensils } from "lucide-react";
import { getMe } from "@/app/lib/dal";
import { COUNCIL, PROFESSION_LABELS, STATUS_LABELS, type Specialty } from "@/app/lib/types";
import { api } from "@/app/lib/api";
import ProfessionalProfileForm from "./ProfessionalProfileForm";
import AvailabilityEditor, { type AvailabilityWindow } from "./AvailabilityEditor";
import DocumentsSection, { type ProfessionalDocument } from "./DocumentsSection";
import { verifySession } from "@/app/lib/dal";

export const metadata: Metadata = { title: "Início | NutriMente" };

/**
 * Página inicial da área logada. O conteúdo muda conforme o PAPEL:
 * - PATIENT: atalhos para buscar profissionais e editar a conta
 * - PROFESSIONAL: situação da verificação + bio, valor da consulta e especialidades
 * - ADMIN: vai direto para a fila de aprovação
 */
export default async function DashboardPage() {
  const me = await getMe();
  if (me.role === "ADMIN") redirect("/admin/professionals");

  const firstName = me.name.split(" ")[0];

  if (me.role === "PROFESSIONAL" && me.professional) {
    const p = me.professional;
    // Só as especialidades da profissão dele (a API recusa as de outra)
    const session = await verifySession();
    const [specialties, availability, documents] = await Promise.all([
      api<Specialty[]>(`/api/specialties?type=${p.type}`),
      api<AvailabilityWindow[]>("/api/me/availability", { token: session.token }),
      api<ProfessionalDocument[]>("/api/me/documents", { token: session.token }),
    ]);
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
          <ProfessionalProfileForm
            bio={p.bio}
            consultationPrice={p.consultationPrice}
            specialtyOptions={specialties.ok ? specialties.data : null}
            specialtyIds={p.specialties.map((s) => s.id)}
            telehealthRegistered={p.telehealthRegistered}
            office={{ address: p.officeAddress, city: p.officeCity, state: p.officeState }}
          />
        </section>

        <section aria-labelledby="horarios-title" className="card">
          <h2 id="horarios-title" className="text-xl font-bold">Meus horários</h2>
          <p className="mb-5 text-gray-700">Janelas semanais de atendimento. Cada consulta dura 50 minutos e começa de hora em hora.</p>
          {availability.ok ? <AvailabilityEditor initial={availability.data} /> : <p role="alert" className="text-red-800">{availability.error.detail}</p>}
        </section>

        <section aria-labelledby="documentos-title" className="card">
          <h2 id="documentos-title" className="text-xl font-bold">Documentos</h2>
          <p className="mb-5 text-gray-700">Envie a carteira do conselho para nossa equipe conferir seu registro.</p>
          {documents.ok ? <DocumentsSection documents={documents.data} /> : <p role="alert" className="text-red-800">{documents.error.detail}</p>}
        </section>
      </div>
    );
  }

  // PATIENT
  const shortcuts = [
    { href: "/professionals", icon: Search, title: "Encontrar profissionais", text: "Nutricionistas e psicólogos verificados." },
    { href: "/appointments", icon: CalendarDays, title: "Minhas consultas", text: "Próximas consultas, videochamada e histórico." },
    { href: "/plans", icon: ClipboardList, title: "Plano de ação", text: "Checklist de hoje, metas, rotina alimentar e progresso." },
    { href: "/diary", icon: Utensils, title: "Diário alimentar", text: "Registre o que comeu, com foto, para o profissional acompanhar." },
    { href: "/account", icon: UserRound, title: "Meus dados", text: "Edite seu perfil e sua senha." },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-fraunces text-3xl font-medium sm:text-4xl">Olá, {firstName}!</h1>
        <p className="mt-2 text-gray-700">Que bom ter você aqui. Por onde quer começar?</p>
      </div>
      {me.intakeCompleted === false && (
        <section aria-labelledby="questionario" className="status-box status-pending flex flex-col gap-2">
          <h2 id="questionario" className="text-lg font-bold">Conte um pouco sobre você</h2>
          <p>Responda o questionário inicial (uns 2 minutos): seus objetivos e hábitos ajudam o profissional a te conhecer antes da consulta.</p>
          <Link href="/onboarding" className="btn-primary self-start">Responder questionário</Link>
        </section>
      )}
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
      </ul>
    </div>
  );
}
