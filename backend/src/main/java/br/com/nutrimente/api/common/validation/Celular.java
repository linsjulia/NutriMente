package br.com.nutrimente.api.common.validation;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.util.Set;

import br.com.nutrimente.api.common.Digits;
import jakarta.validation.Constraint;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import jakarta.validation.Payload;

/**
 * Celular brasileiro: DDD que existe + 9 dígitos começando com 9.
 * Aceita com ou sem máscara: "(11) 98888-7777" ou "11988887777".
 *
 * Antes aceitava "11111111111" e telefone fixo. Campo vazio é tratado pelo @NotBlank.
 */
@Documented
@Constraint(validatedBy = Celular.Validator.class)
@Target({ ElementType.FIELD, ElementType.RECORD_COMPONENT, ElementType.PARAMETER })
@Retention(RetentionPolicy.RUNTIME)
public @interface Celular {

	String message() default "Celular inválido. Use DDD + número com 9 dígitos, ex.: (11) 98888-7777";

	Class<?>[] groups() default {};

	Class<? extends Payload>[] payload() default {};

	class Validator implements ConstraintValidator<Celular, String> {

		/** DDDs em uso no Brasil (Anatel) */
		static final Set<Integer> DDDS = Set.of(
				11, 12, 13, 14, 15, 16, 17, 18, 19,
				21, 22, 24, 27, 28,
				31, 32, 33, 34, 35, 37, 38,
				41, 42, 43, 44, 45, 46, 47, 48, 49,
				51, 53, 54, 55,
				61, 62, 63, 64, 65, 66, 67, 68, 69,
				71, 73, 74, 75, 77, 79,
				81, 82, 83, 84, 85, 86, 87, 88, 89,
				91, 92, 93, 94, 95, 96, 97, 98, 99);

		@Override
		public boolean isValid(String value, ConstraintValidatorContext context) {
			if (value == null || value.isBlank()) {
				return true;
			}
			String digits = Digits.only(value);
			if (digits == null || digits.length() != 11 || digits.charAt(2) != '9') {
				return false;
			}
			// "11 99999-9999" e afins: todos os dígitos do número iguais
			if (digits.substring(3).chars().distinct().count() == 1) {
				return false;
			}
			return DDDS.contains(Integer.parseInt(digits.substring(0, 2)));
		}
	}
}
