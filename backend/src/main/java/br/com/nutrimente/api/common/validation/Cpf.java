package br.com.nutrimente.api.common.validation;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

/**
 * Valida um CPF de verdade (com os dígitos verificadores), aceitando com ou
 * sem máscara. Uso: {@code @Cpf String cpf;}
 *
 * Anotação de validação personalizada = regra reaproveitável, igual às
 * prontas (@Email, @NotBlank). A lógica fica em {@link CpfValidator}.
 */
@Documented
@Constraint(validatedBy = CpfValidator.class)
@Target({ ElementType.FIELD, ElementType.RECORD_COMPONENT, ElementType.PARAMETER })
@Retention(RetentionPolicy.RUNTIME)
public @interface Cpf {

	String message() default "CPF inválido";

	Class<?>[] groups() default {};

	Class<? extends Payload>[] payload() default {};
}
