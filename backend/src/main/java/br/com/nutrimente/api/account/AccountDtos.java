package br.com.nutrimente.api.account;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import br.com.nutrimente.api.common.validation.StrongPassword;
import br.com.nutrimente.api.user.Gender;
import br.com.nutrimente.api.user.Professional;
import br.com.nutrimente.api.user.ProfessionalType;
import br.com.nutrimente.api.user.Role;
import br.com.nutrimente.api.user.User;
import br.com.nutrimente.api.user.VerificationStatus;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** JSON de entrada e saída da área "Minha conta". */
public final class AccountDtos {

	private AccountDtos() {
	}

	/**
	 * Dados da própria conta. O CPF volta mascarado (***.456.789-**):
	 * a tela não precisa dele inteiro, então ele não trafega (LGPD, minimização).
	 */
	public record MeResponse(
			Long id,
			String name,
			String email,
			Role role,
			String cpfMasked,
			LocalDate birthDate,
			String telephone,
			Gender gender,
			LocalDateTime createdAt,
			ProfessionalProfile professional) {

		static MeResponse of(User user, Professional professional) {
			return new MeResponse(user.getId(), user.getName(), user.getEmail(), user.getRole(),
					maskCpf(user.getCpf()), user.getBirthDate(), user.getTelephone(), user.getGender(),
					user.getCreatedAt(), professional == null ? null : ProfessionalProfile.of(professional));
		}

		private static String maskCpf(String cpf) {
			if (cpf == null || cpf.length() != 11) {
				return null;
			}
			return "***." + cpf.substring(3, 6) + "." + cpf.substring(6, 9) + "-**";
		}
	}

	public record ProfessionalProfile(
			ProfessionalType type,
			String document,
			String bio,
			BigDecimal consultationPrice,
			VerificationStatus verificationStatus) {

		static ProfessionalProfile of(Professional p) {
			return new ProfessionalProfile(p.getType(), p.getDocument(), p.getBio(), p.getConsultationPrice(),
					p.getVerificationStatus());
		}
	}

	/** O que qualquer pessoa pode editar no próprio perfil */
	public record UpdateProfileRequest(
			@NotBlank(message = "Informe seu nome completo")
			@Size(min = 3, max = 150, message = "O nome precisa ter entre 3 e 150 caracteres")
			String name,

			@NotBlank(message = "Informe seu celular")
			@Pattern(regexp = "^\\D*(\\d\\D*){10,11}$", message = "Celular inválido (use DDD + número)")
			String telephone,

			Gender gender) {
	}

	/** Só profissionais: bio e valor da consulta */
	public record UpdateProfessionalProfileRequest(
			@Size(max = 500, message = "A bio pode ter até 500 caracteres")
			String bio,

			@DecimalMin(value = "0.00", message = "O valor não pode ser negativo")
			@DecimalMax(value = "9999.99", message = "Valor muito alto")
			@Digits(integer = 4, fraction = 2, message = "Use no máximo 2 casas decimais")
			BigDecimal consultationPrice) {
	}

	public record ChangePasswordRequest(
			@NotBlank(message = "Informe sua senha atual") String currentPassword,
			@StrongPassword String newPassword) {
	}

	/** Excluir a conta exige confirmar a senha */
	public record DeleteAccountRequest(@NotBlank(message = "Informe sua senha para confirmar") String password) {
	}
}
