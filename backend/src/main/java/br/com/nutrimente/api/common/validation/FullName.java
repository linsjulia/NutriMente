package br.com.nutrimente.api.common.validation;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.util.regex.Pattern;

import jakarta.validation.Constraint;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import jakarta.validation.Payload;

/**
 * Nome e sobrenome, só com letras (inclusive acentos), espaços, apóstrofo,
 * hífen e ponto (ex.: "Maria D'Ávila", "Ana-Clara Souza", "Dra. Fernanda Lima").
 *
 * Antes o campo aceitava "Ana 123 <b>" e uma palavra só. Campo vazio é
 * tratado pelo @NotBlank. A capitalização é padronizada em {@link Names}.
 */
@Documented
@Constraint(validatedBy = FullName.Validator.class)
@Target({ ElementType.FIELD, ElementType.RECORD_COMPONENT, ElementType.PARAMETER })
@Retention(RetentionPolicy.RUNTIME)
public @interface FullName {

	String message() default "Informe nome e sobrenome, usando só letras";

	Class<?>[] groups() default {};

	Class<? extends Payload>[] payload() default {};

	class Validator implements ConstraintValidator<FullName, String> {

		/** \p{L} = qualquer letra, de qualquer idioma (á, ç, ñ...) */
		private static final Pattern ALLOWED = Pattern.compile("^[\\p{L}][\\p{L}'’.\\- ]*$");

		@Override
		public boolean isValid(String value, ConstraintValidatorContext context) {
			if (value == null || value.isBlank()) {
				return true;
			}
			String name = value.strip().replaceAll("\\s+", " ");
			if (!ALLOWED.matcher(name).matches()) {
				return false;
			}
			// Pelo menos duas palavras com 2+ letras (nome e sobrenome)
			long words = java.util.Arrays.stream(name.split(" "))
					.filter(word -> word.replaceAll("[^\\p{L}]", "").length() >= 2)
					.count();
			return words >= 2;
		}
	}
}
