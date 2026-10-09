package br.com.nutrimente.api.intake;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import br.com.nutrimente.api.config.CurrentUser;
import br.com.nutrimente.api.intake.IntakeService.IntakeRequest;
import br.com.nutrimente.api.intake.IntakeService.IntakeResponse;
import br.com.nutrimente.api.intake.PatientIntake.ActivityLevel;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Questionário inicial do paciente.
 *
 * <pre>
 * GET /api/me/intake              minhas respostas (PATIENT); 404 INTAKE_NOT_ANSWERED se ainda não respondeu
 * PUT /api/me/intake              responder ou editar (PATIENT)
 * GET /api/patients/{id}/intake   respostas de um paciente que eu atendo (PROFESSIONAL)
 * </pre>
 */
@RestController
public class IntakeController {

	private final IntakeService service;

	public IntakeController(IntakeService service) {
		this.service = service;
	}

	@GetMapping("/api/me/intake")
	@PreAuthorize("hasRole('PATIENT')")
	public IntakeResponse mine(@AuthenticationPrincipal Jwt jwt) {
		return service.mine(CurrentUser.id(jwt));
	}

	@PutMapping("/api/me/intake")
	@PreAuthorize("hasRole('PATIENT')")
	public IntakeResponse answer(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody IntakeForm form) {
		return service.answer(CurrentUser.id(jwt), form.toRequest());
	}

	@GetMapping("/api/patients/{id}/intake")
	@PreAuthorize("hasRole('PROFESSIONAL')")
	public IntakeResponse ofPatient(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
		return service.forProfessional(CurrentUser.id(jwt), id);
	}

	/** O JSON do formulário, com as validações (mensagens prontas para mostrar no campo) */
	public record IntakeForm(
			@NotEmpty(message = "Escolha pelo menos um objetivo")
			@Size(max = 4, message = "Escolha no máximo 4 objetivos")
			List<@NotNull(message = "Objetivo inválido") IntakeGoal> goals,

			@NotNull(message = "Informe quantas refeições você faz por dia")
			@Min(value = 1, message = "Informe de 1 a 10 refeições")
			@Max(value = 10, message = "Informe de 1 a 10 refeições")
			Integer mealsPerDay,

			@NotNull(message = "Informe quantos litros de água você bebe por dia")
			@DecimalMin(value = "0.0", message = "Informe de 0 a 10 litros")
			@DecimalMax(value = "10.0", message = "Informe de 0 a 10 litros")
			@Digits(integer = 2, fraction = 1, message = "Use no máximo uma casa decimal (ex.: 1,5)")
			BigDecimal waterLitersPerDay,

			@NotNull(message = "Escolha seu nível de atividade física")
			ActivityLevel activityLevel,

			@NotNull(message = "Avalie seu sono de 1 a 5")
			@Min(value = 1, message = "Avalie seu sono de 1 a 5")
			@Max(value = 5, message = "Avalie seu sono de 1 a 5")
			Integer sleepQuality,

			@NotNull(message = "Avalie seu estresse de 1 a 5")
			@Min(value = 1, message = "Avalie seu estresse de 1 a 5")
			@Max(value = 5, message = "Avalie seu estresse de 1 a 5")
			Integer stressLevel,

			@Size(max = 2000, message = "Use até 2000 caracteres") String dietaryRestrictions,

			@Size(max = 2000, message = "Use até 2000 caracteres") String healthConditions,

			@Size(max = 2000, message = "Use até 2000 caracteres") String expectations) {

		IntakeRequest toRequest() {
			return new IntakeRequest(goals, mealsPerDay, waterLitersPerDay, activityLevel, sleepQuality, stressLevel,
					dietaryRestrictions, healthConditions, expectations);
		}
	}
}
