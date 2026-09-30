// Máscaras de digitação (só visual: a API aceita com ou sem máscara).

export function maskCpf(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function maskPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  }
  return digits.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
}

/** Para usar em onInput de um campo não controlado */
export const applyMask = (mask: (value: string) => string) => (event: React.FormEvent<HTMLInputElement>) => {
  event.currentTarget.value = mask(event.currentTarget.value);
};

/** Data máxima de nascimento (18 anos atrás), no formato do <input type="date"> */
export function maxBirthDate() {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 18);
  return date.toISOString().slice(0, 10);
}
