// Valores em reais digitados pela pessoa.

export type ParsedMoney = { ok: true; value: number | null } | { ok: false };

/**
 * Converte o que a pessoa digitou em número, aceitando o jeito brasileiro:
 *   "150"  "150,5"  "150,00"  "1.000"  "1.000,50"  "R$ 1.000,50"
 * Vazio -> { ok: true, value: null } (campo opcional: remove o valor).
 * Qualquer outra coisa ("abc", "1,000.50") -> { ok: false }.
 *
 * Antes, "1.000,50" virava NaN, ia como vazio para a API e o preço era
 * apagado com a mensagem "atualizado".
 */
export function parseBRL(input: string): ParsedMoney {
  const text = input.replace(/R\$/i, "").replace(/\s/g, "");
  if (text === "") return { ok: true, value: null };

  let normalized: string;
  if (/^-?\d{1,3}(\.\d{3})*(,\d{1,2})?$/.test(text) || /^-?\d+(,\d{1,2})?$/.test(text)) {
    // Ponto = milhar, vírgula = centavos
    normalized = text.replace(/\./g, "").replace(",", ".");
  } else if (/^-?\d+\.\d{1,2}$/.test(text)) {
    // "150.5": ponto como decimal (teclado numérico de alguns celulares)
    normalized = text;
  } else {
    return { ok: false };
  }
  const value = Number(normalized);
  return Number.isFinite(value) ? { ok: true, value } : { ok: false };
}

/** 1000.5 -> "1.000,50" (para preencher o campo) */
export function formatBRL(value: number | null | undefined): string {
  if (value == null) return "";
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
