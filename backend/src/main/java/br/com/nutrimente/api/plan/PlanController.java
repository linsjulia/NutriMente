package br.com.nutrimente.api.plan;

import java.time.LocalDate;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import br.com.nutrimente.api.config.CurrentUser;
import br.com.nutrimente.api.plan.PlanDtos.CompletedRequest;
import br.com.nutrimente.api.plan.PlanDtos.MyPatient;
import br.com.nutrimente.api.plan.PlanDtos.PlanDetail;
import br.com.nutrimente.api.plan.PlanDtos.PlanRequest;
import br.com.nutrimente.api.plan.PlanDtos.PlanSummary;
import br.com.nutrimente.api.plan.PlanDtos.ProgressRequest;
import br.com.nutrimente.api.plan.PlanDtos.StatusRequest;
import jakarta.validation.Valid;

/**
 * Plano de ação (exige login).
 *
 * <pre>
 * GET   /api/me/patients                                pacientes que eu atendo (PROFESSIONAL)
 * POST  /api/plans                                      criar plano (PROFESSIONAL)
 * GET   /api/plans                                      meus planos (paciente ou profissional)
 * GET   /api/plans/{id}                                 plano completo
 * PUT   /api/plans/{id}                                 editar (PROFESSIONAL dono)
 * PATCH /api/plans/{id}/status                          { "status": "PAUSED" } (PROFESSIONAL dono)
 * PUT   /api/plans/{id}/checklist/{itemId}/{date}       { "completed": true } (PATIENT)
 * PUT   /api/plans/{id}/goals/{goalId}                  { "completed": true } (os dois)
 * POST  /api/plans/{id}/progress                        peso, humor, observações (os dois)
 * </pre>
 */
@RestController
public class PlanController {

	private final PlanService service;

	public PlanController(PlanService service) {
		this.service = service;
	}

	@GetMapping("/api/me/patients")
	@PreAuthorize("hasRole('PROFESSIONAL')")
	public List<MyPatient> myPatients(@AuthenticationPrincipal Jwt jwt) {
		return service.myPatients(CurrentUser.id(jwt));
	}

	@PostMapping("/api/plans")
	@ResponseStatus(HttpStatus.CREATED)
	@PreAuthorize("hasRole('PROFESSIONAL')")
	public PlanDetail create(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody PlanRequest request) {
		return service.create(CurrentUser.id(jwt), request);
	}

	@GetMapping("/api/plans")
	@PreAuthorize("hasAnyRole('PATIENT', 'PROFESSIONAL')")
	public List<PlanSummary> list(@AuthenticationPrincipal Jwt jwt) {
		return service.list(CurrentUser.id(jwt));
	}

	@GetMapping("/api/plans/{id}")
	@PreAuthorize("hasAnyRole('PATIENT', 'PROFESSIONAL')")
	public PlanDetail get(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
		return service.get(CurrentUser.id(jwt), id);
	}

	@PutMapping("/api/plans/{id}")
	@PreAuthorize("hasRole('PROFESSIONAL')")
	public PlanDetail update(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id,
			@Valid @RequestBody PlanRequest request) {
		return service.update(CurrentUser.id(jwt), id, request);
	}

	@PatchMapping("/api/plans/{id}/status")
	@PreAuthorize("hasRole('PROFESSIONAL')")
	public PlanDetail status(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id,
			@Valid @RequestBody StatusRequest request) {
		return service.changeStatus(CurrentUser.id(jwt), id, request.status());
	}

	@PutMapping("/api/plans/{id}/checklist/{itemId}/{date}")
	@PreAuthorize("hasRole('PATIENT')")
	public PlanDetail check(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id, @PathVariable Long itemId,
			@PathVariable LocalDate date, @Valid @RequestBody CompletedRequest request) {
		return service.check(CurrentUser.id(jwt), id, itemId, date, request.completed());
	}

	@PutMapping("/api/plans/{id}/goals/{goalId}")
	@PreAuthorize("hasAnyRole('PATIENT', 'PROFESSIONAL')")
	public PlanDetail goal(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id, @PathVariable Long goalId,
			@Valid @RequestBody CompletedRequest request) {
		return service.setGoal(CurrentUser.id(jwt), id, goalId, request.completed());
	}

	@PostMapping("/api/plans/{id}/progress")
	@ResponseStatus(HttpStatus.CREATED)
	@PreAuthorize("hasAnyRole('PATIENT', 'PROFESSIONAL')")
	public PlanDetail progress(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id,
			@Valid @RequestBody ProgressRequest request) {
		return service.addProgress(CurrentUser.id(jwt), id, request);
	}
}
