"use client";

import Link from "next/link";
import { useActionState, useMemo, useRef, useState } from "react";
import { bookAppointment } from "@/app/actions/appointments";
import { FormAlert } from "@/app/components/form/FormParts";
import { useFocusOnError } from "@/app/components/form/useFocusOnError";
import { StepProgress } from "@/app/components/appointment/StepProgress";
import { CalendarSelector, dayLabel } from "@/app/components/appointment/CalendarSelector";
import { DoctorSummaryCard } from "@/app/components/appointment/DoctorSummaryCard";
import { DoctorProfile } from "@/app/components/appointment/DoctorProfile";
import type { FormState } from "@/app/lib/form";
import { formatBRL } from "@/app/lib/money";
import { PROFESSION_LABELS } from "@/app/lib/types";
import type { Role } from "@/app/lib/session";
import type { ProfessionalProfile, SlotDay } from "@/app/lib/agenda";

type Step = 1 | 2 | 3;
type Modality = "ONLINE" | "PRESENCIAL";

export default function AppointmentFlow({
  profile: p,
  days,
  preselectedStartsAt,
  viewer,
}: {
  profile: ProfessionalProfile;
  days: SlotDay[];
  preselectedStartsAt: string | null;
  viewer: Role | null;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(bookAppointment, {});
  const alertRef = useRef<HTMLDivElement>(null);
  useFocusOnError(alertRef, state);

  const preselectedDate = preselectedStartsAt
    ? days.find((d) => d.slots.some((s) => s.startsAt === preselectedStartsAt))?.date ?? null
    : null;
  const [step, setStep] = useState<Step>(preselectedStartsAt ? 2 : 1);
  const [date, setDate] = useState<string | null>(preselectedDate ?? days[0]?.date ?? null);
  const [startsAt, setStartsAt] = useState<string | null>(preselectedStartsAt);
  const [modality, setModality] = useState<Modality>(p.offersOnline ? "ONLINE" : "PRESENCIAL");

  const slot = useMemo(
    () => days.flatMap((d) => d.slots.map((s) => ({ ...s, date: d.date }))).find((s) => s.startsAt === startsAt) ?? null,
    [days, startsAt],
  );
  const first = days[0]?.slots[0];
  const nextSlot = first ? `${dayLabel(days[0].date).weekday}, ${dayLabel(days[0].date).day} · ${first.time}` : null;
  const price = p.consultationPrice != null ? `R$ ${formatBRL(p.consultationPrice)}` : "A combinar";
  const modalityText = modality === "ONLINE" ? "Online" : `Presencial${p.officeCity ? ` (${p.officeCity}/${p.officeState})` : ""}`;
  const canBoth = p.offersOnline && p.offersInPerson;

  const summary = (button?: React.ReactNode) => (
    <DoctorSummaryCard
      doctorName={p.name}
      photoUrl={p.photoUrl}
      specialty={PROFESSION_LABELS[p.type]}
      date={slot ? dayLabel(slot.date).long : undefined}
      time={slot?.time}
      modality={modalityText}
      price={price}
      button={button}
    />
  );

  const loginHref = `/login?next=${encodeURIComponent(
    `/appointment?professional=${p.id}${startsAt ? `&startsAt=${startsAt}` : ""}`,
  )}`;

  return (
    <div className="space-y-6">
      <StepProgress currentStep={step} />

      {step === 1 && <DoctorProfile profile={p} price={price} nextSlot={nextSlot} onStartBooking={() => setStep(2)} />}

      {step === 2 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <h2 className="text-xl font-bold text-blue-900">Data e horário</h2>
            <CalendarSelector
              days={days}
              selectedDate={date}
              selectedStartsAt={startsAt}
              onSelectDate={(d) => {
                setDate(d);
                setStartsAt(null);
              }}
              onSelectSlot={setStartsAt}
            />
            {canBoth && (
              <fieldset className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <legend className="px-1 font-bold text-blue-900">Como prefere ser atendido?</legend>
                <div className="mt-2 flex flex-wrap gap-4">
                  {(["ONLINE", "PRESENCIAL"] as Modality[]).map((m) => (
                    <label key={m} className="flex min-h-11 cursor-pointer items-center gap-2">
                      <input type="radio" name="modality-choice" checked={modality === m} onChange={() => setModality(m)} />
                      {m === "ONLINE" ? "Online" : "Presencial"}
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
            <button type="button" onClick={() => setStep(1)} className="min-h-11 font-semibold text-blue-800 underline-offset-4 hover:underline">
              ← Voltar ao perfil
            </button>
          </div>
          <div className="lg:col-span-1">
            {summary(
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={!startsAt}
                className="min-h-11 w-full rounded-xl bg-blue-800 px-4 py-3 font-bold text-white transition-opacity hover:bg-blue-900 disabled:bg-gray-400"
              >
                {startsAt ? "Continuar" : "Escolha um horário"}
              </button>,
            )}
          </div>
        </div>
      )}

      {step === 3 && slot && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div ref={alertRef} className="space-y-6 lg:col-span-2">
            <h2 className="text-xl font-bold text-blue-900">Confirmação</h2>
            <FormAlert ok={false} message={state.message} />

            {viewer === "PATIENT" ? (
              <form id="agendar" action={action} className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <input type="hidden" name="professionalId" value={p.id} />
                <input type="hidden" name="startsAt" value={slot.startsAt} />
                <input type="hidden" name="modality" value={modality} />
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="reason" className="font-semibold">
                    Motivo da consulta <span className="font-normal text-gray-600">(opcional)</span>
                  </label>
                  <textarea
                    id="reason"
                    name="reason"
                    rows={3}
                    maxLength={1000}
                    className="form-input"
                    defaultValue={state.values?.reason}
                    aria-describedby="reason-hint"
                  />
                  <p id="reason-hint" className="text-sm text-gray-600">
                    Só {p.name.split(" ")[0]} lê. Guardamos de forma criptografada.
                  </p>
                </div>
                <p className="text-sm text-gray-700">Você pode cancelar ou remarcar pelo site até 24 horas antes da consulta.</p>
              </form>
            ) : viewer === null ? (
              <div className="space-y-3 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <p>Para confirmar, entre na sua conta de paciente. O horário escolhido continua selecionado.</p>
                <div className="flex flex-wrap gap-3">
                  <Link href={loginHref} className="btn-primary">Entrar para agendar</Link>
                  <Link href="/register/patient" className="btn-secondary">Criar conta</Link>
                </div>
              </div>
            ) : (
              <p className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                Só contas de paciente agendam consultas. Você está com uma conta de profissional ou de administrador.
              </p>
            )}

            <button type="button" onClick={() => setStep(2)} className="min-h-11 font-semibold text-blue-800 underline-offset-4 hover:underline">
              ← Trocar data ou horário
            </button>
          </div>
          <div className="lg:col-span-1">
            {summary(
              viewer === "PATIENT" ? (
                // form="agendar": o botão fica no resumo, ao lado, mas envia o formulário
                <button type="submit" form="agendar" disabled={pending} aria-disabled={pending} className="btn-primary w-full justify-center">
                  {pending ? "Agendando..." : "Confirmar agendamento"}
                </button>
              ) : undefined,
            )}
          </div>
        </div>
      )}
    </div>
  );
}
