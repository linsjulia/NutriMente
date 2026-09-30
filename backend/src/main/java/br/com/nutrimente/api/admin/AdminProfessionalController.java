package br.com.nutrimente.api.admin;

import java.time.LocalDateTime;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import br.com.nutrimente.api.config.CurrentUser;
import br.com.nutrimente.api.professional.ProfessionalController.PageResponse;
import br.com.nutrimente.api.user.Professional;
import br.com.nutrimente.api.user.ProfessionalType;
import br.com.nutrimente.api.user.VerificationStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

/**
 * Área do administrador: verificar o registro dos profissionais.
 * Protegida no SecurityConfig: "/api/admin/**" só para ROLE_ADMIN.
 *
 * <pre>
 * GET   /api/admin/professionals?status=PENDING
 * PATCH /api/admin/professionals/{id}/verification   {"status": "APPROVED"}
 * </pre>
 */
@RestController
@RequestMapping("/api/admin/professionals")
public class AdminProfessionalController {

	private final AdminService adminService;

	public AdminProfessionalController(AdminService adminService) {
		this.adminService = adminService;
	}

	@GetMapping
	public PageResponse<ProfessionalForReview> list(
			@RequestParam(defaultValue = "PENDING") VerificationStatus status,
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "20") int size) {
		PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, 50),
				Sort.by(Sort.Order.asc("createdAt")));
		return adminService.list(status, pageable);
	}

	@PatchMapping("/{id}/verification")
	public ProfessionalForReview review(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id,
			@Valid @RequestBody ReviewRequest request) {
		return adminService.review(CurrentUser.id(jwt), id, request.status());
	}

	public record ReviewRequest(@NotNull(message = "Informe a decisão") VerificationStatus status) {
	}

	/** O admin vê o e-mail e o número do conselho para conferir o registro */
	public record ProfessionalForReview(Long id, String name, String email, ProfessionalType type, String document,
			VerificationStatus status, LocalDateTime createdAt) {

		static ProfessionalForReview of(Professional p) {
			return new ProfessionalForReview(p.getId(), p.getUser().getName(), p.getUser().getEmail(), p.getType(),
					p.getDocument(), p.getVerificationStatus(), p.getCreatedAt());
		}
	}
}
