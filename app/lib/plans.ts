// Tipos do plano de ação (espelham a API: docs/API.md → "Plano de ação").

export type PlanSummary = {
  id: number;
  title: string;
  status: "ACTIVE" | "PAUSED" | "COMPLETED" | "CANCELLED";
  startDate: string | null;
  endDate: string | null;
  patient: { id: number; name: string };
  professional: { id: number; name: string };
  goalsCompleted: number;
  goalsTotal: number;
  checklistDoneToday: number;
  checklistTotalToday: number;
  adherence7d: number | null;
};

export type PlanDetail = {
  summary: PlanSummary;
  description: string | null;
  today: string;
  goals: { id: number; description: string; targetValue: number | null; unit: string | null; dueDate: string | null; completed: boolean }[];
  meals: { id: number; mealLabel: string; mealTime: string | null; description: string }[];
  checklist: {
    id: number;
    description: string;
    frequency: "DAILY" | "WEEKLY" | "ONCE";
    doneToday: boolean;
    history: { date: string; completed: boolean }[];
  }[];
  progress: { id: number; recordDate: string; weightKg: number | null; moodScore: number | null; notes: string | null; recordedBy: string }[];
  canEdit: boolean;
  canCheck: boolean;
};

export const FREQUENCY_TEXT = { DAILY: "todo dia", WEEKLY: "toda semana", ONCE: "uma vez" } as const;
