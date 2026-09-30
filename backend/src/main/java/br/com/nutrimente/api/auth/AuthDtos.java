package br.com.nutrimente.api.auth;

import java.time.Instant;
import java.time.LocalDate;

import br.com.nutrimente.api.common.validation.Adult;
import br.com.nutrimente.api.common.validation.Cpf;
import br.com.nutrimente.api.common.validation.StrongPassword;
import br.com.nutrimente.api.user.Gender;
import br.com.nutrimente.api.user.ProfessionalType;
import br.com.nutrimente.api.user.Role;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * DTOs (Data Transfer Objects) de autenticação: o formato exato do JSON que
 * entra e sai da API. Separar DTO de entidade evita expor campos internos
 * (ex.: password_hash) e impede que alguém mande "role": "ADMIN" no cadastro.
 *
 * "record" = classe imutável que o Java escreve sozinho (construtor, getters,
 * equals...). As anotações validam cada campo antes de chegar no service.
 */
public final class AuthDtos {

	private AuthDtos() {
	}

	/** Campos comuns aos dois cadastros */
	public record RegisterPatientRequest(
			@NotBlank(message = "Informe seu nome completo")
			@Size(min = 3, max = 150, message = "O nome precisa ter entre 3 e 150 caracteres")
			String name,

			@NotBlank(message = "Informe seu e-mail")
			@Email(message = "E-mail inválido")
			@Size(max = 255)
			String email,

			@StrongPassword
			String password,

			@NotBlank(message = "Informe seu CPF")
			@Cpf
			String cpf,

			@NotNull(message = "Informe sua data de nascimento")
			@Past(message = "Data de nascimento inválida")
			@Adult
			LocalDate birthDate,

			@NotBlank(message = "Informe seu celular")
			@Pattern(regexp = "^\\D*(\\d\\D*){10,11}$", message = "Celular inválido (use DDD + número)")
			String telephone,

			Gender gender,

			@AssertTrue(message = "É preciso aceitar os Termos de Uso e a Política de Privacidade")
			boolean acceptTerms,

			@AssertTrue(message = "É preciso autorizar o uso dos dados de saúde para o atendimento")
			boolean acceptHealthData) {
	}

	public record RegisterProfessionalRequest(
			@NotBlank(message = "Informe seu nome completo")
			@Size(min = 3, max = 150, message = "O nome precisa ter entre 3 e 150 caracteres")
			String name,

			@NotBlank(message = "Informe seu e-mail")
			@Email(message = "E-mail inválido")
			@Size(max = 255)
			String email,

			@StrongPassword
			String password,

			@NotBlank(message = "Informe seu CPF")
			@Cpf
			String cpf,

			@NotNull(message = "Informe sua data de nascimento")
			@Past(message = "Data de nascimento inválida")
			@Adult
			LocalDate birthDate,

			@NotBlank(message = "Informe seu celular")
			@Pattern(regexp = "^\\D*(\\d\\D*){10,11}$", message = "Celular inválido (use DDD + número)")
			String telephone,

			Gender gender,

			@NotNull(message = "Selecione sua profissão")
			ProfessionalType professionalType,

			// Formatos aceitos: CRN "3-12345" / "12345"; CRP "06/123456"
			@NotBlank(message = "Informe o número do seu conselho")
			@Pattern(regexp = "^[0-9]{1,2}[-/]?[0-9]{3,6}(/[A-Za-z]{1,2})?$", message = "Número do conselho inválido")
			@Size(max = 20)
			String documentProfessional,

			@Size(max = 500, message = "A bio pode ter até 500 caracteres")
			String bio,

			@AssertTrue(message = "É preciso aceitar os Termos de Uso e a Política de Privacidade")
			boolean acceptTerms) {
	}

	public record LoginRequest(
			@NotBlank(message = "Informe seu e-mail") String email,
			@NotBlank(message = "Informe sua senha") String password) {
	}

	/** Resposta do login: o token e o mínimo sobre a pessoa */
	public record LoginResponse(String accessToken, Instant expiresAt, SessionUser user) {
	}

	public record SessionUser(Long id, String name, Role role) {
	}

	public record TokenRequest(@NotBlank(message = "Link inválido") String token) {
	}

	public record EmailRequest(
			@NotBlank(message = "Informe seu e-mail") @Email(message = "E-mail inválido") String email) {
	}

	public record ResetPasswordRequest(
			@NotBlank(message = "Link inválido") String token,
			@StrongPassword String password) {
	}

	/** Resposta simples com uma mensagem para mostrar na tela */
	public record MessageResponse(String message) {
	}
}
