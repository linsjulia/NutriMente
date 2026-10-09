package br.com.nutrimente.api.record;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import br.com.nutrimente.api.config.CurrentUser;
import br.com.nutrimente.api.record.RecordService.RecordResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;

/**
 * Registro da consulta (prontuário).
 *
 * <pre>
 * GET /api/appointments/{id}/record   ler (profissional: tudo; paciente: só as orientações)
 * PUT /api/appointments/{id}/record   criar ou editar (PROFESSIONAL, a partir do início da consulta)
 *     { "privateNotes": "Evolução...", "patientGuidance": "Beber 2 L de água por dia..." }
 * </pre>
 *
 * O PUT substitui os dois textos: campo vazio ou ausente apaga aquele texto.
 */
@RestController
public class RecordController {

	private final RecordService service;

	public RecordController(RecordService service) {
		this.service = service;
	}

	@GetMapping("/api/appointments/{id}/record")
	@PreAuthorize("hasAnyRole('PATIENT', 'PROFESSIONAL')")
	public RecordResponse get(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
		return service.get(CurrentUser.id(jwt), id);
	}

	@PutMapping("/api/appointments/{id}/record")
	@PreAuthorize("hasRole('PROFESSIONAL')")
	public RecordResponse write(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id,
			@Valid @RequestBody RecordRequest request) {
		return service.write(CurrentUser.id(jwt), id, request.privateNotes(), request.patientGuidance());
	}

	public record RecordRequest(
			@Size(max = 20000, message = "As anotações podem ter até 20000 caracteres") String privateNotes,
			@Size(max = 20000, message = "As orientações podem ter até 20000 caracteres") String patientGuidance) {
	}
}
