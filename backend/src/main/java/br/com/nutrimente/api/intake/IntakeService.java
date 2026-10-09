package br.com.nutrimente.api.intake;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.nutrimente.api.appointment.AppointmentRepository;
import br.com.nutrimente.api.appointment.AppointmentStatus;
import br.com.nutrimente.api.common.AfterCommit;
import br.com.nutrimente.api.common.ApiException;
import br.com.nutrimente.api.common.Digits;
import br.com.nutrimente.api.intake.PatientIntake.ActivityLevel;
import br.com.nutrimente.api.logging.LogClient;
import br.com.nutrimente.api.record.RecordCipher;
import br.com.nutrimente.api.user.PatientRepository;

/**
 * Questionário inicial (onboarding) do paciente.
 *
 * Regras:
 * - o PACIENTE responde depois do cadastro e pode editar quando quiser;
 * - o PROFISSIONAL só vê o questionário de quem ele atende (consulta
 *   agendada, confirmada ou realizada: AppointmentStatus.LINKING), a mesma
 *   regra do plano de ação. Para os outros, ele "não existe" (404);
 * - textos livres criptografados (RecordCipher); leitura pelo profissional auditada.
 */
@Service
public class IntakeService {

	private final PatientIntakeRepository intakes;
	private final PatientRepository patients;
	private final AppointmentRepository appointments;
	private final RecordCipher cipher;
	private final LogClient logClient;

	public IntakeService(PatientIntakeRepository intakes, PatientRepository patients,
			AppointmentRepository appointments, RecordCipher cipher, LogClient logClient) {
		this.intakes = intakes;
		this.patients = patients;
		this.appointments = appointments;
		this.cipher = cipher;
		this.logClient = logClient;
	}

	/** Usado pelo /api/me: a tela mostra o questionário enquanto ele não foi respondido */
	@Transactional(readOnly = true)
	public boolean isCompleted(Long patientId) {
		return intakes.existsById(patientId);
	}

	@Transactional(readOnly = true)
	public IntakeResponse mine(Long patientId) {
		return intakes.findById(patientId).map(this::toResponse).orElseThrow(IntakeService::notAnswered);
	}

	@Transactional
	public IntakeResponse answer(Long patientId, IntakeRequest request) {
		if (!patients.existsById(patientId)) {
			throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Só pacientes respondem o questionário.");
		}
		PatientIntake intake = intakes.findById(patientId).orElseGet(() -> new PatientIntake(patientId));
		boolean creating = intake.getCreatedAt() == null;
		// Sem repetição e na ordem em que a pessoa marcou
		String goals = new LinkedHashSet<>(request.goals()).stream().map(g -> g.name()).collect(Collectors.joining(","));
		intake.answer(goals, request.mealsPerDay(), request.waterLitersPerDay(), request.activityLevel(),
				request.sleepQuality(), request.stressLevel(),
				cipher.encrypt(Digits.trimToNull(request.dietaryRestrictions())),
				cipher.encrypt(Digits.trimToNull(request.healthConditions())),
				cipher.encrypt(Digits.trimToNull(request.expectations())));
		intake = intakes.saveAndFlush(intake);
		String action = creating ? "CREATE" : "UPDATE";
		AfterCommit.run(() -> logClient.audit(patientId, "PATIENT", action, "patient_intakes", patientId, patientId));
		return toResponse(intake);
	}

	@Transactional(readOnly = true)
	public IntakeResponse forProfessional(Long professionalId, Long patientId) {
		if (!appointments.linked(patientId, professionalId, AppointmentStatus.LINKING)) {
			throw ApiException.notFound("Paciente não encontrado.");
		}
		IntakeResponse response = intakes.findById(patientId).map(this::toResponse)
				.orElseThrow(IntakeService::notAnswered);
		AfterCommit.run(() -> logClient.audit(professionalId, "PROFESSIONAL", "READ", "patient_intakes", patientId,
				patientId));
		return response;
	}

	private IntakeResponse toResponse(PatientIntake i) {
		List<IntakeGoal> goals = Arrays.stream(i.getGoals().split(",")).filter(s -> !s.isBlank())
				.map(IntakeGoal::valueOf).toList();
		return new IntakeResponse(goals, i.getMealsPerDay(), i.getWaterLitersPerDay(), i.getActivityLevel(),
				i.getSleepQuality(), i.getStressLevel(), cipher.decrypt(i.getDietaryRestrictions()),
				cipher.decrypt(i.getHealthConditions()), cipher.decrypt(i.getExpectations()),
				toInstant(i.getCreatedAt()), toInstant(i.getUpdatedAt()));
	}

	private static Instant toInstant(LocalDateTime utc) {
		return utc.toInstant(ZoneOffset.UTC);
	}

	private static ApiException notAnswered() {
		return new ApiException(HttpStatus.NOT_FOUND, "INTAKE_NOT_ANSWERED", "O questionário ainda não foi respondido.");
	}

	public record IntakeResponse(
			List<IntakeGoal> goals,
			int mealsPerDay,
			BigDecimal waterLitersPerDay,
			ActivityLevel activityLevel,
			int sleepQuality,
			int stressLevel,
			String dietaryRestrictions,
			String healthConditions,
			String expectations,
			Instant createdAt,
			Instant updatedAt) {
	}

	/** Mesmos campos da resposta; ver IntakeController para as regras */
	public record IntakeRequest(
			List<IntakeGoal> goals,
			Integer mealsPerDay,
			BigDecimal waterLitersPerDay,
			ActivityLevel activityLevel,
			Integer sleepQuality,
			Integer stressLevel,
			String dietaryRestrictions,
			String healthConditions,
			String expectations) {
	}
}
