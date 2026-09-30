package br.com.nutrimente.api.common.validation;

import br.com.nutrimente.api.common.Digits;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

/**
 * Algoritmo oficial do CPF: os dois últimos dígitos são calculados a partir
 * dos nove primeiros. Isso pega erros de digitação (ex.: um número trocado).
 */
public class CpfValidator implements ConstraintValidator<Cpf, String> {

	@Override
	public boolean isValid(String value, ConstraintValidatorContext context) {
		if (value == null || value.isBlank()) {
			return true; // campo vazio é tratado por @NotBlank, se for obrigatório
		}
		return isValidCpf(Digits.only(value));
	}

	public static boolean isValidCpf(String cpf) {
		if (cpf == null || cpf.length() != 11) {
			return false;
		}
		// 000.000.000-00, 111.111.111-11... passam na conta, mas não existem
		if (cpf.chars().distinct().count() == 1) {
			return false;
		}
		return checkDigit(cpf, 9) == cpf.charAt(9) - '0'
				&& checkDigit(cpf, 10) == cpf.charAt(10) - '0';
	}

	/** Calcula o dígito verificador na posição "length" (9 ou 10) */
	private static int checkDigit(String cpf, int length) {
		int sum = 0;
		for (int i = 0; i < length; i++) {
			sum += (cpf.charAt(i) - '0') * (length + 1 - i);
		}
		int rest = (sum * 10) % 11;
		return rest == 10 ? 0 : rest;
	}
}
