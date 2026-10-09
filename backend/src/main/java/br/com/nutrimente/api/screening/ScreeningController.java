package br.com.nutrimente.api.screening;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import br.com.nutrimente.api.appointment.AppointmentDtos.ScreeningRequest;
import br.com.nutrimente.api.config.CurrentUser;
import br.com.nutrimente.api.screening.ScreeningService.ScreeningResponse;
import jakarta.validation.Valid;

/**
 * Triagem antes da consulta.
 *
 * <pre>
 * GET /api/appointments/{id}/screening   ler (paciente ou profissional da consulta)
 * PUT /api/appointments/{id}/screening   preencher ou ajustar (PATIENT, até o início)
 *     { "reason": "Quero melhorar a alimentação", "symptoms": "Cansaço à tarde", "moodScore": 3 }
 * </pre>
 *
 * Também dá para mandar a triagem junto do agendamento (POST /api/appointments, campo "screening").
 */
@RestController
public class ScreeningController {

	private final ScreeningService service;

	public ScreeningController(ScreeningService service) {
		this.service = service;
	}

	@GetMapping("/api/appointments/{id}/screening")
	@PreAuthorize("hasAnyRole('PATIENT', 'PROFESSIONAL')")
	public ScreeningResponse get(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
		return service.get(CurrentUser.id(jwt), id);
	}

	@PutMapping("/api/appointments/{id}/screening")
	@PreAuthorize("hasRole('PATIENT')")
	public ScreeningResponse write(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id,
			@Valid @RequestBody ScreeningRequest request) {
		return service.write(CurrentUser.id(jwt), id, request);
	}
}
