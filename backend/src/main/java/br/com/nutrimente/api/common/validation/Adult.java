package br.com.nutrimente.api.common.validation;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.time.LocalDate;
import java.time.Period;
import java.time.ZoneOffset;

import jakarta.validation.Constraint;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import jakarta.validation.Payload;

/**
 * Data de nascimento de alguém com 18 anos ou mais (e no máximo 120).
 * Menores de idade precisariam de consentimento dos responsáveis (LGPD,
 * art. 14), o que ainda não faz parte do sistema.
 */
@Documented
@Constraint(validatedBy = Adult.Validator.class)
@Target({ ElementType.FIELD, ElementType.RECORD_COMPONENT, ElementType.PARAMETER })
@Retention(RetentionPolicy.RUNTIME)
public @interface Adult {

	String message() default "É preciso ter 18 anos ou mais";

	Class<?>[] groups() default {};

	Class<? extends Payload>[] payload() default {};

	class Validator implements ConstraintValidator<Adult, LocalDate> {

		@Override
		public boolean isValid(LocalDate birthDate, ConstraintValidatorContext context) {
			if (birthDate == null) {
				return true;
			}
			int age = Period.between(birthDate, LocalDate.now(ZoneOffset.UTC)).getYears();
			return age >= 18 && age <= 120;
		}
	}
}
