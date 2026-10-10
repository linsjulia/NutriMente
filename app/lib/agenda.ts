// Tipos e textos da agenda (consultas, horários, avaliações, triagem e
// registro da consulta). Espelham os DTOs da API Java (docs/API.md).

import type { ProfessionalType } from "./types";

export type Modality = "ONLINE" | "PRESENCIAL";
export type AppointmentStatus = "SCHEDULED" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "RESCHEDULED" | "NO_SHOW";

export type Slot = { startsAt: string; endsAt: string; time: string };
export type SlotDay = { date: string; weekday: string; slots: Slot[] };

export type Appointment = {
  id: number;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  modality: Modality;
  videoUrl: string | null;
  price: number;
  notes: string | null;
  cancellationReason: string | null;
  rescheduledFromId: number | null;
  patient: { id: number; name: string; photoUrl: string | null };
  professional: { id: number; name: string; photoUrl: string | null; type: ProfessionalType };
  canCancel: boolean;
  canReschedule: boolean;
  canConfirm: boolean;
  canComplete: boolean;
  canReview: boolean;
  canWriteRecord: boolean;
  canEditScreening: boolean;
  officeAddress: string | null;
};

export type PublicReview = { id: number; rating: number; comment: string | null; patientName: string; createdAt: string };

export type Screening = {
  appointmentId: number;
  reason: string | null;
  symptoms: string | null;
  moodScore: number | null;
  updatedAt: string | null;
  canEdit: boolean;
};

export type AppointmentRecord = {
  appointmentId: number;
  privateNotes: string | null;
  patientGuidance: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  canEdit: boolean;
};

export type ProfessionalProfile = {
  id: number;
  name: string;
  photoUrl: string | null;
  type: ProfessionalType;
  document: string;
  bio: string | null;
  consultationPrice: number | null;
  ratingAverage: number;
  ratingCount: number;
  specialties: { id: number; name: string }[];
  offersOnline: boolean;
  offersInPerson: boolean;
  officeCity: string | null;
  officeState: string | null;
};

export const STATUS_TEXT: Record<AppointmentStatus, string> = {
  SCHEDULED: "Agendada",
  CONFIRMED: "Confirmada",
  IN_PROGRESS: "Em andamento",
  COMPLETED: "Realizada",
  CANCELLED: "Cancelada",
  RESCHEDULED: "Remarcada",
  NO_SHOW: "Não compareceu",
};

export const MODALITY_TEXT: Record<Modality, string> = { ONLINE: "Online (videochamada)", PRESENCIAL: "Presencial" };

export const MOOD_TEXT: Record<number, string> = { 1: "Muito mal", 2: "Mal", 3: "Mais ou menos", 4: "Bem", 5: "Muito bem" };

/** Os horários vêm em UTC; na tela, sempre no horário de Brasília */
const ZONE = "America/Sao_Paulo";

export function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    timeZone: ZONE,
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: ZONE, day: "2-digit", month: "2-digit", year: "numeric" });
}
