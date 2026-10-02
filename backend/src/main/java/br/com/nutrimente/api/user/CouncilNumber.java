package br.com.nutrimente.api.user;

import java.util.Locale;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Valida e padroniza o número do conselho conforme a profissão.
 *
 * <pre>
 * CRN (nutricionista): região 1 a 11 + número       "CRN-3 12345" -> "3-12345"
 * CRP (psicólogo):     região 01 a 24 + número      "crp 6/123456" -> "06/123456"
 * </pre>
 *
 * Antes um único formato genérico valia para os dois, e um psicólogo podia
 * cadastrar um número no formato de CRN.
 */
public final class CouncilNumber {

	private static final Pattern CRN = Pattern.compile("^(?:CRN)?[-\\s]*(\\d{1,2})\\s*[-/\\s]?\\s*(\\d{3,6})$");
	private static final Pattern CRP = Pattern.compile("^(?:CRP)?[-\\s]*(\\d{1,2})\\s*[/\\-\\s]?\\s*(\\d{4,6})$");

	private CouncilNumber() {
	}

	/** Número padronizado, ou vazio se o formato for inválido para a profissão */
	public static Optional<String> normalize(ProfessionalType type, String raw) {
		if (raw == null) {
			return Optional.empty();
		}
		String value = raw.strip().toUpperCase(Locale.ROOT);
		Matcher m = (type == ProfessionalType.NUTRICIONISTA ? CRN : CRP).matcher(value);
		if (!m.matches()) {
			return Optional.empty();
		}
		int region = Integer.parseInt(m.group(1));
		String number = m.group(2);
		if (type == ProfessionalType.NUTRICIONISTA) {
			return region >= 1 && region <= 11 ? Optional.of(region + "-" + number) : Optional.empty();
		}
		return region >= 1 && region <= 24 ? Optional.of("%02d/%s".formatted(region, number)) : Optional.empty();
	}

	/** Mensagem de erro com exemplo do formato certo */
	public static String errorMessage(ProfessionalType type) {
		return type == ProfessionalType.NUTRICIONISTA
				? "CRN inválido. Informe a região (1 a 11) e o número, ex.: 3-12345"
				: "CRP inválido. Informe a região (01 a 24) e o número, ex.: 06/123456";
	}
}
