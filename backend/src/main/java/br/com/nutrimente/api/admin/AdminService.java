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
import br.com.nutrimente.api.user.Professional;
import br.com.nutrimente.api.user.ProfessionalRepository;
import br.com.nutrimente.api.user.User;
import br.com.nutrimente.api.user.VerificationStatus;

@Service
public class AdminService {

	private final ProfessionalRepository professionals;
	private final EmailService emailService;
	private final LogClient logClient;

	public AdminService(ProfessionalRepository professionals, EmailService emailService, LogClient logClient) {
		this.professionals = professionals;
		this.emailService = emailService;
		this.logClient = logClient;
	}

	@Transactional(readOnly = true)
	public PageResponse<ProfessionalForReview> list(VerificationStatus status, Pageable pageable) {
		return PageResponse.of(professionals.findForReview(status, pageable).map(ProfessionalForReview::of));
	}

	@Transactional
	public ProfessionalForReview review(Long adminId, Long professionalId, VerificationStatus decision) {
		if (decision == VerificationStatus.PENDING) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Escolha aprovar ou recusar.",
					Map.of("status", "Use APPROVED ou REJECTED"));
		}
		Professional professional = professionals.findById(professionalId)
				.filter(p -> p.getUser().canLogin())
				.orElseThrow(() -> ApiException.notFound("Profissional não encontrado."));
		professional.review(decision);

		User user = professional.getUser();
		String email = user.getEmail();
		String name = user.getName();
		AfterCommit.run(() -> {
			emailService.sendProfessionalReviewed(email, name, decision == VerificationStatus.APPROVED);
			logClient.audit(adminId, "ADMIN", "UPDATE", "professionals.verification", professionalId, professionalId);
		});
		return ProfessionalForReview.of(professional);
	}
}
