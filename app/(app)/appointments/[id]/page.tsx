import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Video } from "lucide-react";
import { api } from "@/app/lib/api";
import { verifySession } from "@/app/lib/dal";
import { formatBRL } from "@/app/lib/money";
import { PROFESSION_LABELS } from "@/app/lib/types";
import {
  formatWhen,
  MODALITY_TEXT,
  MOOD_TEXT,
  STATUS_TEXT,
  type Appointment,
  type AppointmentRecord,
  type Screening,
} from "@/app/lib/agenda";
import { AppointmentActions, RecordForm, ReviewForm, ScreeningForm } from "./AppointmentForms";

export const metadata: Metadata = { title: "Consulta | NutriMente" };

/**
 * Uma consulta. O que aparece depende de quem está vendo e do momento:
 * a API manda os "can*" (canCancel, canReview...) e a tela só mostra o que vale.
 */
export default async function AppointmentPage({ params, searchParams }: PageProps<"/appointments/[id]">) {
  const session = await verifySession();
  const { id } = await params;
  const { agendada } = await searchParams;
  const result = await api<Appointment>(`/api/appointments/${Number(id)}`, { token: session.token });
  if (!result.ok) {
    if (result.error.status === 404) notFound();
    return <p role="alert" className="card border-red-300 text-red-800">{result.error.detail}</p>;
  }
  const a = result.data;
  const isPatient = session.role === "PATIENT";
  const [screening, record] = await Promise.all([
    api<Screening>(`/api/appointments/${a.id}/screening`, { token: session.token }),
    api<AppointmentRecord>(`/api/appointments/${a.id}/record`, { token: session.token }),
  ]);
  const other = isPatient ? a.professional.name : a.patient.name;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/appointments" className="inline-block self-start py-2.5 font-semibold text-blue1 underline-offset-4 hover:underline">
        ← {isPatient ? "Minhas consultas" : "Agenda"}
      </Link>

      {agendada && (
        <p role="status" className="rounded-xl border border-green-600 bg-green-50 p-4 text-green-900">
          Consulta agendada! Enviamos a confirmação para o seu e-mail.
        </p>
      )}

      <section aria-labelledby="consulta" className="card flex flex-col gap-3">
        <h1 id="consulta" className="font-fraunces text-2xl font-medium sm:text-3xl first-letter:uppercase">
          {formatWhen(a.startsAt)}
        </h1>
        <p className="text-lg">
          {isPatient ? `${a.professional.name} · ${PROFESSION_LABELS[a.professional.type]}` : `Paciente: ${a.patient.name}`}
        </p>
        <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-[auto_1fr]">
          <dt className="font-semibold">Situação</dt>
          <dd>{STATUS_TEXT[a.status]}{a.cancellationReason ? ` (motivo: ${a.cancellationReason})` : ""}</dd>
          <dt className="font-semibold">Modalidade</dt>
          <dd>{MODALITY_TEXT[a.modality]}</dd>
          <dt className="font-semibold">Valor</dt>
          <dd>R$ {formatBRL(a.price)}</dd>
          {a.notes && (
            <>
              <dt className="font-semibold">Observação</dt>
              <dd>{a.notes}</dd>
            </>
          )}
        </dl>
        {a.videoUrl && (a.status === "SCHEDULED" || a.status === "CONFIRMED") && (
          <div className="flex flex-col gap-1">
            <a href={a.videoUrl} target="_blank" rel="noopener noreferrer" className="btn-primary inline-flex items-center gap-2 self-start">
              <Video aria-hidden size={20} /> Entrar na videochamada
              <span className="sr-only">(abre em nova aba)</span>
            </a>
            <p className="text-sm text-gray-700">
              {isPatient ? "O profissional entra primeiro e abre a sala." : "Entre primeiro: quem abre a sala precisa entrar com uma conta Google, GitHub ou Facebook."}
            </p>
          </div>
        )}
        {a.officeAddress && (
          <p className="flex items-start gap-2">
            <MapPin aria-hidden className="mt-0.5 shrink-0" size={20} /> {a.officeAddress}
          </p>
        )}
        <AppointmentActions appointment={a} isPatient={isPatient} />
      </section>

      {screening.ok && (screening.data.reason || screening.data.canEdit) && (
        <section aria-labelledby="triagem" className="card flex flex-col gap-3">
          <h2 id="triagem" className="text-xl font-bold">Triagem</h2>
          {screening.data.canEdit ? (
            <ScreeningForm appointmentId={a.id} screening={screening.data} />
          ) : (
            <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-[auto_1fr]">
              <dt className="font-semibold">Motivo</dt>
              <dd>{screening.data.reason}</dd>
              {screening.data.symptoms && (
                <>
                  <dt className="font-semibold">Sintomas</dt>
                  <dd>{screening.data.symptoms}</dd>
                </>
              )}
              {screening.data.moodScore && (
                <>
                  <dt className="font-semibold">Como se sente</dt>
                  <dd>{MOOD_TEXT[screening.data.moodScore]}</dd>
                </>
              )}
            </dl>
          )}
        </section>
      )}

      {record.ok && (record.data.canEdit || record.data.patientGuidance || record.data.privateNotes) && (
        <section aria-labelledby="registro" className="card flex flex-col gap-3">
          <h2 id="registro" className="text-xl font-bold">{isPatient ? "Orientações do profissional" : "Registro da consulta"}</h2>
          {record.data.canEdit ? (
            <RecordForm appointmentId={a.id} record={record.data} />
          ) : (
            <p className="whitespace-pre-line">{record.data.patientGuidance}</p>
          )}
        </section>
      )}

      {a.canReview && (
        <section aria-labelledby="avaliar" className="card flex flex-col gap-3">
          <h2 id="avaliar" className="text-xl font-bold">Avaliar a consulta com {other}</h2>
          <ReviewForm appointmentId={a.id} />
        </section>
      )}
    </div>
  );
}
