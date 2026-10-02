package br.com.nutrimente.api.admin;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import br.com.nutrimente.api.config.CurrentUser;
import br.com.nutrimente.api.specialty.SpecialtyDto;
import br.com.nutrimente.api.user.ProfessionalType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * O admin cadastra e remove especialidades. A lista pública fica em
 * GET /api/specialties. Só ADMIN acessa /api/admin/** (SecurityConfig).
 *
 * <pre>
 * POST   /api/admin/specialties        { "name": "Nutrição Funcional", "type": "NUTRICIONISTA" }
 * DELETE /api/admin/specialties/{id}   também tira a especialidade dos profissionais
 * </pre>
 */
@RestController
@RequestMapping("/api/admin/specialties")
public class AdminSpecialtyController {

	private final AdminService adminService;

	public AdminSpecialtyController(AdminService adminService) {
		this.adminService = adminService;
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public SpecialtyDto create(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody CreateSpecialtyRequest request) {
		return adminService.createSpecialty(CurrentUser.id(jwt), request.name(), request.type());
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable Integer id) {
		adminService.deleteSpecialty(CurrentUser.id(jwt), id);
	}

	public record CreateSpecialtyRequest(
			@NotBlank(message = "Informe o nome da especialidade")
			@Size(min = 3, max = 100, message = "Use de 3 a 100 caracteres")
			String name,

			@NotNull(message = "Escolha a profissão")
			ProfessionalType type) {
	}
}
