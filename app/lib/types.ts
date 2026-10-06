// Tipos dos dados que vêm da API Java (espelham os DTOs do backend).

import type { Role } from "./session";

export type Gender = "FEMALE" | "MALE" | "OTHER" | "UNDISCLOSED";
export type ProfessionalType = "NUTRICIONISTA" | "PSICOLOGO";
export type VerificationStatus = "PENDING" | "APPROVED" | "REJECTED";

export type Specialty = { id: number; name: string; type: ProfessionalType };

export type Me = {
  id: number;
  name: string;
  email: string;
  role: Role;
  cpfMasked: string | null;
  birthDate: string | null;
  telephone: string | null;
  gender: Gender | null;
  createdAt: string;
  professional: {
    type: ProfessionalType;
    document: string;
    bio: string | null;
    consultationPrice: number | null;
    verificationStatus: VerificationStatus;
    specialties: Specialty[];
  } | null;
};

export type PublicProfessional = {
  id: number;
  name: string;
  type: ProfessionalType;
  document: string;
  bio: string | null;
  consultationPrice: number | null;
  ratingAverage: number;
  ratingCount: number;
  specialties: Specialty[];
};

export type ProfessionalForReview = {
  id: number;
  name: string;
  email: string;
  type: ProfessionalType;
  document: string;
  status: VerificationStatus;
  createdAt: string;
};

export type Page<T> = { items: T[]; page: number; size: number; totalItems: number; totalPages: number };

// Textos em português para mostrar na tela
export const GENDER_LABELS: Record<Gender, string> = {
  FEMALE: "Feminino",
  MALE: "Masculino",
  OTHER: "Outro",
  UNDISCLOSED: "Prefiro não informar",
};

export const PROFESSION_LABELS: Record<ProfessionalType, string> = {
  NUTRICIONISTA: "Nutricionista",
  PSICOLOGO: "Psicólogo(a)",
};

export const COUNCIL: Record<ProfessionalType, string> = { NUTRICIONISTA: "CRN", PSICOLOGO: "CRP" };

export const STATUS_LABELS: Record<VerificationStatus, string> = {
  PENDING: "Em análise",
  APPROVED: "Aprovado",
  REJECTED: "Recusado",
};
