package br.com.nutrimente.api.common;

/** Utilidades para campos numéricos digitados com máscara (CPF, telefone). */
public final class Digits {

	private Digits() {
	}

	/** "123.456.789-09" -> "12345678909"; null continua null */
	public static String only(String value) {
		if (value == null) {
			return null;
		}
		String digits = value.replaceAll("\\D", "");
		return digits.isEmpty() ? null : digits;
	}

	/** Remove espaços das pontas e transforma texto vazio em null */
	public static String trimToNull(String value) {
		if (value == null) {
			return null;
		}
		String trimmed = value.strip();
		return trimmed.isEmpty() ? null : trimmed;
	}
}
