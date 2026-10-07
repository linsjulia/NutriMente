package br.com.nutrimente.api.review;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import br.com.nutrimente.api.config.CurrentUser;
import br.com.nutrimente.api.professional.ProfessionalController.PageResponse;
import br.com.nutrimente.api.review.ReviewService.PublicReview;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Avaliações.
 *
 * <pre>
 * POST /api/appointments/{id}/review         avaliar consulta realizada (PATIENT)
 *      { "rating": 5, "comment": "Muito atenciosa!" }
 * GET  /api/professionals/{id}/reviews       avaliações públicas (sem login), paginadas
 * </pre>
 */
@RestController
public class ReviewController {

	private final ReviewService service;

	public ReviewController(ReviewService service) {
		this.service = service;
	}

	@PostMapping("/api/appointments/{id}/review")
	@ResponseStatus(HttpStatus.CREATED)
	@PreAuthorize("hasRole('PATIENT')")
	public PublicReview review(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id,
			@Valid @RequestBody ReviewRequest request) {
		return service.review(CurrentUser.id(jwt), id, request.rating(), request.comment());
	}

	@GetMapping("/api/professionals/{id}/reviews")
	public PageResponse<PublicReview> list(@PathVariable Long id,
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "10") int size) {
		return service.listPublic(id, page, size);
	}

	public record ReviewRequest(
			@NotNull(message = "Escolha de 1 a 5 estrelas")
			@Min(value = 1, message = "Escolha de 1 a 5 estrelas")
			@Max(value = 5, message = "Escolha de 1 a 5 estrelas")
			Integer rating,

			@Size(max = 1000, message = "O comentário pode ter até 1000 caracteres")
			String comment) {
	}
}
