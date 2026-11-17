export const MEAL_TYPES: [string, string][] = [
  ["CAFE_DA_MANHA", "Café da manhã"],
  ["LANCHE_DA_MANHA", "Lanche da manhã"],
  ["ALMOCO", "Almoço"],
  ["LANCHE_DA_TARDE", "Lanche da tarde"],
  ["JANTAR", "Jantar"],
  ["CEIA", "Ceia"],
  ["OUTRO", "Outro"],
];

export const MEAL_LABEL: Record<string, string> = Object.fromEntries(MEAL_TYPES);