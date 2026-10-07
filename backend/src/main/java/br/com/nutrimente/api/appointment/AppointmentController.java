package br.com.nutrimente.api.appointment;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import br.com.nutrimente.api.appointment.AppointmentDtos.AppointmentResponse;
import br.com.nutrimente.api.appointment.AppointmentDtos.BookRequest;
import br.com.nutrimente.api.appointment.AppointmentDtos.CancelRequest;
import br.com.nutrimente.api.appointment.AppointmentDtos.RescheduleRequest;
import br.com.nutrimente.api.appointment.AppointmentService.Scope;
import br.com.nutrimente.api.config.CurrentUser;
import jakarta.validation.Valid;

/**
 * Consultas (exige login). Paciente e profissional usam as MESMAS rotas de
 * leitura: cada um vê só as consultas de que participa.
 *
 * <pre>
 * POST /api/appointments                    agendar (PATIENT)
 * GET  /api/appointments?scope=UPCOMING     próximas (padrão) | PAST = histórico
 * GET  /api/appointments/{id}               uma consulta
 * POST /api/appointments/{id}/cancel        cancelar (paciente ou profissional)
 * POST /api/appointments/{id}/reschedule    remarcar (PATIENT)
 * POST /api/appointments/{id}/confirm       confirmar (PROFESSIONAL)
 * POST /api/appointments/{id}/complete      concluir, depois do horário (PROFESSIONAL)
 * </pre>
 */
@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

	private final AppointmentService service;

	public AppointmentController(AppointmentService service) {
		this.service = service;
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	@PreAuthorize("hasRole('PATIENT')")
	public AppointmentResponse book(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody BookRequest request) {
		return service.book(CurrentUser.id(jwt), request);
	}

	@GetMapping
	@PreAuthorize("hasAnyRole('PATIENT', 'PROFESSIONAL')")
	public List<AppointmentResponse> list(@AuthenticationPrincipal Jwt jwt,
			@RequestParam(defaultValue = "UPCOMING") Scope scope) {
		return service.list(CurrentUser.id(jwt), scope);
	}

	@GetMapping("/{id}")
	@PreAuthorize("hasAnyRole('PATIENT', 'PROFESSIONAL')")
	public AppointmentResponse get(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
		return service.get(CurrentUser.id(jwt), id);
	}

	/** O corpo é opcional: { "reason": "Imprevisto no trabalho" } */
	@PostMapping("/{id}/cancel")
	@PreAuthorize("hasAnyRole('PATIENT', 'PROFESSIONAL')")
	public AppointmentResponse cancel(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id,
			@Valid @RequestBody(required = false) CancelRequest request) {
		return service.cancel(CurrentUser.id(jwt), id, request == null ? null : request.reason());
	}

	@PostMapping("/{id}/reschedule")
	@PreAuthorize("hasRole('PATIENT')")
	public AppointmentResponse reschedule(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id,
			@Valid @RequestBody RescheduleRequest request) {
		return service.reschedule(CurrentUser.id(jwt), id, request.startsAt());
	}

	@PostMapping("/{id}/confirm")
	@PreAuthorize("hasRole('PROFESSIONAL')")
	public AppointmentResponse confirm(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
		return service.confirm(CurrentUser.id(jwt), id);
	}

	@PostMapping("/{id}/complete")
	@PreAuthorize("hasRole('PROFESSIONAL')")
	public AppointmentResponse complete(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
		return service.complete(CurrentUser.id(jwt), id);
	}
}
