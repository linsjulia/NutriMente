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
import jakarta.validation.constraints.Size;

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
		return adminService.review(CurrentUser.id(jwt), id, request.status(), request.reason());
	}

	/**
	 * Revogar o atendimento online (o admin não achou o cadastro no e-Psi /
	 * e-Nutricionista). { "reason": "Cadastro não encontrado no e-Psi" }
	 */
	@PatchMapping("/{id}/telehealth/revoke")
	public ProfessionalForReview revokeTelehealth(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id,
			@Valid @RequestBody RevokeRequest request) {
		return adminService.revokeTelehealth(CurrentUser.id(jwt), id, request.reason());
	}

	public record RevokeRequest(@Size(max = 500, message = "O motivo pode ter até 500 caracteres") String reason) {
	}

	/** reason: obrigatório ao recusar; vai no e-mail para a pessoa saber o que corrigir */
	public record ReviewRequest(
			@NotNull(message = "Informe a decisão") VerificationStatus status,
			@Size(max = 500, message = "O motivo pode ter até 500 caracteres") String reason) {
	}

	/**
	 * O admin vê o e-mail e o número do conselho para conferir o registro, a
	 * declaração de atendimento online (para conferir no e-Psi / e-Nutricionista)
	 * e onde atende presencialmente. Os documentos enviados ficam em
	 * GET /api/admin/professionals/{id}/documents.
	 */
	public record ProfessionalForReview(Long id, String name, String email, ProfessionalType type, String document,
			VerificationStatus status, LocalDateTime createdAt, boolean telehealthRegistered,
			LocalDateTime telehealthDeclaredAt, String officeAddress) {

		static ProfessionalForReview of(Professional p) {
			return new ProfessionalForReview(p.getId(), p.getUser().getName(), p.getUser().getEmail(), p.getType(),
					p.getDocument(), p.getVerificationStatus(), p.getCreatedAt(), p.offersOnline(),
					p.getTelehealthDeclaredAt(), p.fullOfficeAddress());
		}
	}
}
