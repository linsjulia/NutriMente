package br.com.nutrimente.api.common.validation;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import jakarta.validation.ReportAsSingleViolation;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Regra de senha: 8 a 72 caracteres, com pelo menos uma letra e um número.
 * (72 é o limite do BCrypt; acima disso ele ignora o resto da senha.)
 * Anotação "composta": junta outras anotações prontas numa só.
 */
@Documented
@NotBlank
@Size(min = 8, max = 72)
@Pattern(regexp = "^(?=.*[A-Za-zÀ-ÿ])(?=.*\\d).*$")
@ReportAsSingleViolation
@Constraint(validatedBy = {})
@Target({ ElementType.FIELD, ElementType.RECORD_COMPONENT, ElementType.PARAMETER })
@Retention(RetentionPolicy.RUNTIME)
public @interface StrongPassword {

	String message() default "A senha precisa ter de 8 a 72 caracteres, com letras e números";

	Class<?>[] groups() default {};

	Class<? extends Payload>[] payload() default {};
}
