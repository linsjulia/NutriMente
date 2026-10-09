package br.com.nutrimente.api.account;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

import br.com.nutrimente.api.common.validation.Celular;
import br.com.nutrimente.api.common.validation.FullName;
import br.com.nutrimente.api.common.validation.StrongPassword;
import br.com.nutrimente.api.specialty.SpecialtyDto;
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
			String photoUrl,
			String cpfMasked,
			LocalDate birthDate,
			String telephone,
			Gender gender,
			LocalDateTime createdAt,
			ProfessionalProfile professional,
			/** Paciente já respondeu o questionário inicial? (null para profissional e admin) */
			Boolean intakeCompleted) {

		static MeResponse of(User user, Professional professional, Boolean intakeCompleted) {
			return new MeResponse(user.getId(), user.getName(), user.getEmail(), user.getRole(), user.getPhotoUrl(),
					maskCpf(user.getCpf()), user.getBirthDate(), user.getTelephone(), user.getGender(),
					user.getCreatedAt(), professional == null ? null : ProfessionalProfile.of(professional),
					intakeCompleted);
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
			VerificationStatus verificationStatus,
			List<SpecialtyDto> specialties,
			/** Declarou cadastro no e-Psi / e-Nutricionista: atende online */
			boolean telehealthRegistered,
			Instant telehealthDeclaredAt) {

		static ProfessionalProfile of(Professional p) {
			return new ProfessionalProfile(p.getType(), p.getDocument(), p.getBio(), p.getConsultationPrice(),
					p.getVerificationStatus(), p.getSpecialties().stream().map(SpecialtyDto::of).toList(),
					p.offersOnline(), p.getTelehealthDeclaredAt() == null ? null
							: p.getTelehealthDeclaredAt().toInstant(ZoneOffset.UTC));
		}
	}

	/** O que qualquer pessoa pode editar no próprio perfil */
	public record UpdateProfileRequest(
			@NotBlank(message = "Informe seu nome completo")
			@Size(max = 150, message = "O nome pode ter até 150 caracteres")
			@FullName
			String name,

			@NotBlank(message = "Informe seu celular")
			@Celular
			String telephone,

			Gender gender) {
	}

	/**
	 * Só profissionais: bio, valor da consulta, especialidades e atendimento online.
	 * specialtyIds: lista com os ids escolhidos ([] = nenhuma).
	 * telehealthRegistered: true = "tenho cadastro no e-Psi / e-Nutricionista".
	 * Se specialtyIds ou telehealthRegistered não vierem no JSON (null), não mudam.
	 */
	public record UpdateProfessionalProfileRequest(
			@Size(max = 500, message = "A bio pode ter até 500 caracteres")
			String bio,

			@DecimalMin(value = "0.00", message = "O valor não pode ser negativo")
			@DecimalMax(value = "9999.99", message = "Valor muito alto")
			@Digits(integer = 4, fraction = 2, message = "Use no máximo 2 casas decimais")
			BigDecimal consultationPrice,

			@Size(max = MAX_SPECIALTIES, message = "Escolha no máximo " + MAX_SPECIALTIES + " especialidades")
			List<Integer> specialtyIds,

			Boolean telehealthRegistered) {

		/** Limite para o perfil continuar objetivo para o paciente */
		public static final int MAX_SPECIALTIES = 5;
	}

	public record ChangePasswordRequest(
			@NotBlank(message = "Informe sua senha atual") String currentPassword,
			@StrongPassword String newPassword) {
	}

	/** Excluir a conta exige confirmar a senha */
	public record DeleteAccountRequest(@NotBlank(message = "Informe sua senha para confirmar") String password) {
	}
}
