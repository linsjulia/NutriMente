package br.com.nutrimente.api.meal;

import java.time.Instant;

import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import br.com.nutrimente.api.config.CurrentUser;
import br.com.nutrimente.api.meal.MealLog.MealType;
import br.com.nutrimente.api.meal.MealLogService.MealRequest;
import br.com.nutrimente.api.meal.MealLogService.MealResponse;
import br.com.nutrimente.api.meal.MealLogService.Photo;
import br.com.nutrimente.api.professional.ProfessionalController.PageResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Diário alimentar.
 *
 * <pre>
 * GET    /api/me/meals?page=0&size=20     meu diário, do mais recente (PATIENT)
 * POST   /api/me/meals                    registrar refeição (PATIENT)
 * PUT    /api/me/meals/{id}               editar (PATIENT)
 * DELETE /api/me/meals/{id}               apagar (PATIENT)
 * PUT    /api/me/meals/{id}/photo         enviar foto (multipart, campo "photo"; JPG/PNG/WebP até 5 MB)
 * DELETE /api/me/meals/{id}/photo         tirar a foto
 * GET    /api/meals/{id}/photo            ver a foto (o paciente dono ou o profissional que o atende)
 * GET    /api/patients/{id}/meals         diário de um paciente que eu atendo (PROFESSIONAL)
 * </pre>
 */
@RestController
public class MealController {

	private final MealLogService service;

	public MealController(MealLogService service) {
		this.service = service;
	}

	@GetMapping("/api/me/meals")
	@PreAuthorize("hasRole('PATIENT')")
	public PageResponse<MealResponse> mine(@AuthenticationPrincipal Jwt jwt,
			@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
		return service.mine(CurrentUser.id(jwt), page, size);
	}

	@PostMapping("/api/me/meals")
	@ResponseStatus(HttpStatus.CREATED)
	@PreAuthorize("hasRole('PATIENT')")
	public MealResponse create(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody MealForm form) {
		return service.create(CurrentUser.id(jwt), form.toRequest());
	}

	@PutMapping("/api/me/meals/{id}")
	@PreAuthorize("hasRole('PATIENT')")
	public MealResponse update(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id,
			@Valid @RequestBody MealForm form) {
		return service.update(CurrentUser.id(jwt), id, form.toRequest());
	}

	@DeleteMapping("/api/me/meals/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	@PreAuthorize("hasRole('PATIENT')")
	public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
		service.delete(CurrentUser.id(jwt), id);
	}

	@PutMapping(path = "/api/me/meals/{id}/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	@PreAuthorize("hasRole('PATIENT')")
	public MealResponse attachPhoto(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id,
			@RequestPart(name = "photo", required = false) MultipartFile photo) {
		return service.attachPhoto(CurrentUser.id(jwt), id, photo);
	}

	@DeleteMapping("/api/me/meals/{id}/photo")
	@PreAuthorize("hasRole('PATIENT')")
	public MealResponse removePhoto(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
		return service.removePhoto(CurrentUser.id(jwt), id);
	}

	/**
	 * A imagem em si. "private" e "nosniff": o navegador não guarda em cache
	 * compartilhado e não tenta "adivinhar" outro tipo de arquivo.
	 */
	@GetMapping("/api/meals/{id}/photo")
	@PreAuthorize("hasAnyRole('PATIENT', 'PROFESSIONAL')")
	public ResponseEntity<byte[]> photo(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
		Photo photo = service.photo(CurrentUser.id(jwt), id);
		return ResponseEntity.ok()
				.contentType(MediaType.parseMediaType(photo.contentType()))
				.cacheControl(CacheControl.noStore().cachePrivate())
				.header("X-Content-Type-Options", "nosniff")
				.body(photo.bytes());
	}

	@GetMapping("/api/patients/{id}/meals")
	@PreAuthorize("hasRole('PROFESSIONAL')")
	public PageResponse<MealResponse> ofPatient(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id,
			@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
		return service.ofPatient(CurrentUser.id(jwt), id, page, size);
	}

	public record MealForm(
			@NotNull(message = "Informe quando foi a refeição") Instant eatenAt,

			@NotNull(message = "Escolha a refeição") MealType mealType,

			@NotBlank(message = "Conte o que você comeu")
			@Size(max = 2000, message = "Use até 2000 caracteres")
			String description,

			@Size(max = 2000, message = "Use até 2000 caracteres") String notes,

			@Min(value = 1, message = "Escolha de 1 a 5") @Max(value = 5, message = "Escolha de 1 a 5")
			Integer hungerLevel,

			@Min(value = 1, message = "Escolha de 1 a 5") @Max(value = 5, message = "Escolha de 1 a 5")
			Integer satisfactionLevel) {

		MealRequest toRequest() {
			return new MealRequest(eatenAt, mealType, description, notes, hungerLevel, satisfactionLevel);
		}
	}
}
