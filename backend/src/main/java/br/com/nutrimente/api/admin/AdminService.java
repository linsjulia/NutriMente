package br.com.nutrimente.api.admin;

import java.util.Map;

import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.nutrimente.api.admin.AdminProfessionalController.ProfessionalForReview;
import br.com.nutrimente.api.common.AfterCommit;
import br.com.nutrimente.api.common.ApiException;
import br.com.nutrimente.api.logging.LogClient;
import br.com.nutrimente.api.notification.EmailService;
import br.com.nutrimente.api.professional.ProfessionalController.PageResponse;
import br.com.nutrimente.api.specialty.Specialty;
import br.com.nutrimente.api.specialty.SpecialtyDto;
import br.com.nutrimente.api.specialty.SpecialtyRepository;
import br.com.nutrimente.api.user.Professional;
import br.com.nutrimente.api.user.ProfessionalRepository;
import br.com.nutrimente.api.user.ProfessionalType;
import br.com.nutrimente.api.user.User;
import br.com.nutrimente.api.user.VerificationStatus;

@Service
public class AdminService {

	private final ProfessionalRepository professionals;
	private final SpecialtyRepository specialties;
	private final EmailService emailService;
	private final LogClient logClient;

	public AdminService(ProfessionalRepository professionals, SpecialtyRepository specialties,
			EmailService emailService, LogClient logClient) {
		this.professionals = professionals;
		this.specialties = specialties;
		this.emailService = emailService;
		this.logClient = logClient;
	}

	@Transactional(readOnly = true)
	public PageResponse<ProfessionalForReview> list(VerificationStatus status, Pageable pageable) {
		return PageResponse.of(professionals.findForReview(status, pageable).map(ProfessionalForReview::of));
	}

	@Transactional
	public ProfessionalForReview review(Long adminId, Long professionalId, VerificationStatus decision, String reason) {
		if (decision == VerificationStatus.PENDING) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Escolha aprovar ou recusar.",
					Map.of("status", "Use APPROVED ou REJECTED"));
		}
		String cleanReason = reason == null ? null : reason.strip();
		if (decision == VerificationStatus.REJECTED && (cleanReason == null || cleanReason.isEmpty())) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Informe o motivo da recusa.",
					Map.of("reason", "Informe o motivo da recusa"));
		}
		Professional professional = professionals.findById(professionalId)
				.filter(p -> p.getUser().canLogin())
				.orElseThrow(() -> ApiException.notFound("Profissional não encontrado."));
		professional.review(decision);

		User user = professional.getUser();
		String email = user.getEmail();
		String name = user.getName();
		AfterCommit.run(() -> {
			emailService.sendProfessionalReviewed(email, name, decision == VerificationStatus.APPROVED,
					decision == VerificationStatus.REJECTED ? cleanReason : null);
			logClient.audit(adminId, "ADMIN", "UPDATE", "professionals.verification", professionalId, professionalId);
		});
		return ProfessionalForReview.of(professional);
	}

	@Transactional
	public SpecialtyDto createSpecialty(Long adminId, String name, ProfessionalType type) {
		// "  nutrição   funcional " -> "nutrição funcional": evita duplicatas por espaços
		String cleanName = name.strip().replaceAll("\\s+", " ");
		// Confere antes de gravar para devolver uma mensagem clara (o banco
		// também tem a regra UNIQUE, que protege mesmo em cliques simultâneos)
		if (specialties.existsByTypeAndNameIgnoreCase(type, cleanName)) {
			throw ApiException.conflict("name", "Essa especialidade já existe para esta profissão");
		}
		Specialty specialty = specialties.save(new Specialty(cleanName, type));
		long id = specialty.getId();
		AfterCommit.run(() -> logClient.audit(adminId, "ADMIN", "CREATE", "specialties", id, null));
		return SpecialtyDto.of(specialty);
	}

	/**
	 * Remove a especialidade. A tabela de ligação (professional_specialties)
	 * tem ON DELETE CASCADE: o banco tira a especialidade de todos os
	 * profissionais que a tinham marcado.
	 */
	@Transactional
	public void deleteSpecialty(Long adminId, Integer id) {
		Specialty specialty = specialties.findById(id)
				.orElseThrow(() -> ApiException.notFound("Especialidade não encontrada."));
		specialties.delete(specialty);
		AfterCommit.run(() -> logClient.audit(adminId, "ADMIN", "DELETE", "specialties", (long) id, null));
	}
}
