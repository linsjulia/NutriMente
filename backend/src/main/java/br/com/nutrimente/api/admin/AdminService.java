package br.com.nutrimente.api.admin;

import java.util.Map;

import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.nutrimente.api.admin.AdminProfessionalController.ProfessionalForReview;
import org.springframework.context.ApplicationEventPublisher;

import br.com.nutrimente.api.common.AfterCommit;
import br.com.nutrimente.api.common.ApiException;
import br.com.nutrimente.api.common.event.ProfessionalVerifiedEvent;
import br.com.nutrimente.api.common.event.TelehealthRevokedEvent;
import br.com.nutrimente.api.logging.LogClient;
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
	private final LogClient logClient;
	private final ApplicationEventPublisher publisher;

	public AdminService(ProfessionalRepository professionals, SpecialtyRepository specialties,
			LogClient logClient, ApplicationEventPublisher publisher) {
		this.professionals = professionals;
		this.specialties = specialties;
		this.logClient = logClient;
		this.publisher = publisher;
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
		publisher.publishEvent(new ProfessionalVerifiedEvent(adminId, professionalId,
				user.getEmail(), user.getName(), decision == VerificationStatus.APPROVED, cleanReason));
		return ProfessionalForReview.of(professional);
	}

	/**
	 * O profissional DECLARA que tem cadastro no e-Psi / e-Nutricionista
	 * (V003); o admin confere na plataforma do conselho. Se não encontrar,
	 * revoga: o profissional deixa de receber consultas online novas (as já
	 * marcadas continuam) e recebe o motivo por notificação e e-mail. Ele
	 * pode declarar de novo depois de regularizar.
	 */
	@Transactional
	public ProfessionalForReview revokeTelehealth(Long adminId, Long professionalId, String reason) {
		String cleanReason = reason == null ? "" : reason.strip();
		if (cleanReason.isEmpty()) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Informe o motivo.",
					Map.of("reason", "Informe o motivo"));
		}
		Professional professional = professionals.findById(professionalId)
				.filter(p -> p.getUser().canLogin())
				.orElseThrow(() -> ApiException.notFound("Profissional não encontrado."));
		if (!professional.offersOnline()) {
			throw new ApiException(HttpStatus.CONFLICT, "TELEHEALTH_NOT_DECLARED",
					"Este profissional não declarou cadastro para atender online.");
		}
		professional.declareTelehealth(false);
		String intro = "Desativamos o seu atendimento online: não conseguimos confirmar seu cadastro no %s. Motivo: %s"
				.formatted(professional.getType() == ProfessionalType.PSICOLOGO ? "e-Psi" : "e-Nutricionista", cleanReason);
		publisher.publishEvent(new TelehealthRevokedEvent(adminId, professionalId,
				professional.getUser().getEmail(), professional.getUser().getName(), intro));
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
