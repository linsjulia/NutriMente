// Tipos e textos do questionário inicial e do diário alimentar
// (docs/API.md → "Questionário inicial do paciente" e "Diário alimentar").

export type Intake = {
  goals: string[];
  mealsPerDay: number;
  waterLitersPerDay: number;
  activityLevel: string;
  sleepQuality: number;
  stressLevel: number;
  dietaryRestrictions: string | null;
  healthConditions: string | null;
  expectations: string | null;
  updatedAt?: string;
};

export type Meal = {
  id: number;
  eatenAt: string;
  mealType: string;
  description: string;
  notes: string | null;
  hungerLevel: number | null;
  satisfactionLevel: number | null;
  photoUrl: string | null;
};

export type MyPatient = { id: number; name: string; photoUrl: string | null; lastAppointmentAt: string };

export const GOAL_TEXT: Record<string, string> = {
  EMAGRECER: "Emagrecer com saúde",
  GANHAR_MASSA: "Ganhar massa muscular",
  ALIMENTACAO_SAUDAVEL: "Comer de forma mais equilibrada",
  RELACAO_COM_A_COMIDA: "Melhorar a relação com a comida",
  ANSIEDADE: "Lidar com ansiedade e estresse",
  SONO: "Dormir melhor",
  ENERGIA: "Ter mais energia",
  AUTOESTIMA: "Autoestima e imagem corporal",
};

export const ACTIVITY_TEXT: Record<string, string> = {
  SEDENTARIO: "Sedentário",
  LEVE: "Leve (1 a 2 vezes por semana)",
  MODERADO: "Moderado (3 a 4 vezes)",
  INTENSO: "Intenso (5 vezes ou mais)",
};

export const DIARY_MEAL_TEXT: Record<string, string> = {
  CAFE_DA_MANHA: "Café da manhã",
  LANCHE_DA_MANHA: "Lanche da manhã",
  ALMOCO: "Almoço",
  LANCHE_DA_TARDE: "Lanche da tarde",
  JANTAR: "Jantar",
  CEIA: "Ceia",
  OUTRO: "Outro",
};

const ZONE = "America/Sao_Paulo";
export const dayLabel = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { timeZone: ZONE, weekday: "long", day: "2-digit", month: "2-digit" });
export const hourLabel = (iso: string) =>
  new Date(iso).toLocaleTimeString("pt-BR", { timeZone: ZONE, hour: "2-digit", minute: "2-digit" });

/** Agrupa refeições por dia (a lista já vem da mais recente para a mais antiga) */
export function groupByDay(meals: Meal[]): [string, Meal[]][] {
  const days = new Map<string, Meal[]>();
  for (const m of meals) days.set(dayLabel(m.eatenAt), [...(days.get(dayLabel(m.eatenAt)) ?? []), m]);
  return [...days.entries()];
}
