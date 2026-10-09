package br.com.nutrimente.api.screening;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.nutrimente.api.appointment.Appointment;
import br.com.nutrimente.api.appointment.AppointmentDtos.ScreeningRequest;
import br.com.nutrimente.api.appointment.AppointmentRepository;
import br.com.nutrimente.api.common.AfterCommit;
import br.com.nutrimente.api.common.ApiException;
import br.com.nutrimente.api.common.Digits;
import br.com.nutrimente.api.logging.LogClient;
import br.com.nutrimente.api.record.RecordCipher;

/**
 * Triagem antes da consulta.
 *
 * Regras:
 * - o PACIENTE preenche no agendamento (opcional) e pode ajustar até o
 *   início da consulta, enquanto ela estiver agendada ou confirmada
 *   (Appointment.acceptsScreening);
 * - o PROFISSIONAL da consulta lê para se preparar (leitura auditada);
 * - ao remarcar, a triagem vai junto para a consulta nova;
 * - textos criptografados (RecordCipher).
 */
@Service
public class ScreeningService {

	private final AppointmentScreeningRepository screenings;
	private final AppointmentRepository appointments;
	private final RecordCipher cipher;
	private final LogClient logClient;

	public ScreeningService(AppointmentScreeningRepository screenings, AppointmentRepository appointments,
			RecordCipher cipher, LogClient logClient) {
		this.screenings = screenings;
		this.appointments = appointments;
		this.cipher = cipher;
		this.logClient = logClient;
	}

	/** Chamado pelo agendamento, na mesma transação */
	@Transactional
	public void saveForNewAppointment(Long appointmentId, ScreeningRequest request) {
		AppointmentScreening screening = new AppointmentScreening(appointmentId);
		fill(screening, request);
		screenings.save(screening);
	}

	/** Remarcação: a consulta nova herda a triagem da original */
	@Transactional
	public void copy(Long fromAppointmentId, Long toAppointmentId) {
		screenings.findById(fromAppointmentId).ifPresent(original -> {
			AppointmentScreening copy = new AppointmentScreening(toAppointmentId);
			copy.fill(original.getReason(), original.getSymptoms(), original.getMoodScore());
			screenings.save(copy);
		});
	}

	@Transactional(readOnly = true)
	public ScreeningResponse get(Long userId, Long appointmentId) {
		Appointment appointment = participantAppointment(userId, appointmentId);
		boolean viewerIsPatient = appointment.getPatient().getId().equals(userId);
		AppointmentScreening screening = screenings.findById(appointmentId).orElse(null);
		if (screening != null && !viewerIsPatient) {
			Long patientId = appointment.getPatient().getId();
			AfterCommit.run(() -> logClient.audit(userId, "PROFESSIONAL", "READ", "appointment_screenings",
					appointmentId, patientId));
		}
		return toResponse(appointment, screening, viewerIsPatient);
	}

	@Transactional
	public ScreeningResponse write(Long userId, Long appointmentId, ScreeningRequest request) {
		Appointment appointment = participantAppointment(userId, appointmentId);
		if (!appointment.getPatient().getId().equals(userId)) {
			throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Só o paciente preenche a triagem.");
		}
		if (!appointment.acceptsScreening(Instant.now())) {
			throw new ApiException(HttpStatus.CONFLICT, "SCREENING_CLOSED",
					"A triagem só pode ser preenchida antes do início de uma consulta agendada ou confirmada.");
		}
		AppointmentScreening screening = screenings.findById(appointmentId)
				.orElseGet(() -> new AppointmentScreening(appointmentId));
		boolean creating = screening.getCreatedAt() == null;
		fill(screening, request);
		screening = screenings.saveAndFlush(screening);
		Long patientId = userId;
		AfterCommit.run(() -> logClient.audit(patientId, "PATIENT", creating ? "CREATE" : "UPDATE",
				"appointment_screenings", appointmentId, patientId));
		return toResponse(appointment, screening, true);
	}

	private void fill(AppointmentScreening screening, ScreeningRequest request) {
		screening.fill(cipher.encrypt(request.reason().strip()), cipher.encrypt(Digits.trimToNull(request.symptoms())),
				request.moodScore());
	}

	private Appointment participantAppointment(Long userId, Long appointmentId) {
		return appointments.findWithPeople(appointmentId)
				.filter(a -> a.hasParticipant(userId))
				.orElseThrow(() -> ApiException.notFound("Consulta não encontrada."));
	}

	private ScreeningResponse toResponse(Appointment appointment, AppointmentScreening s, boolean viewerIsPatient) {
		boolean canEdit = viewerIsPatient && appointment.acceptsScreening(Instant.now());
		if (s == null) {
			return new ScreeningResponse(appointment.getId(), null, null, null, null, canEdit);
		}
		return new ScreeningResponse(appointment.getId(), cipher.decrypt(s.getReason()), cipher.decrypt(s.getSymptoms()),
				s.getMoodScore(), toInstant(s.getUpdatedAt()), canEdit);
	}

	private static Instant toInstant(LocalDateTime utc) {
		return utc == null ? null : utc.toInstant(ZoneOffset.UTC);
	}

	/** Sem triagem ainda: textos, humor e data null */
	public record ScreeningResponse(
			Long appointmentId,
			String reason,
			String symptoms,
			Integer moodScore,
			Instant updatedAt,
			/** Paciente e a consulta ainda não começou: mostrar o formulário */
			boolean canEdit) {
	}
}
