package br.com.nutrimente.api.record;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Optional;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.nutrimente.api.appointment.Appointment;
import br.com.nutrimente.api.appointment.AppointmentRepository;
import br.com.nutrimente.api.common.AfterCommit;
import br.com.nutrimente.api.common.ApiException;
import br.com.nutrimente.api.common.Digits;
import br.com.nutrimente.api.logging.LogClient;
import br.com.nutrimente.api.notification.Notification;
import br.com.nutrimente.api.notification.NotificationLinks;
import br.com.nutrimente.api.notification.NotificationService;

/**
 * Registro da consulta (prontuário).
 *
 * Regras:
 * - só o PROFISSIONAL da consulta escreve, a partir do horário de início, e
 *   não em consulta cancelada ou remarcada (Appointment.acceptsRecord);
 * - pode editar depois (um registro por consulta, sempre o mesmo);
 * - "privateNotes" (evolução, anotações técnicas) só o profissional lê;
 *   "patientGuidance" (orientações combinadas) o paciente também lê;
 * - toda leitura e gravação vai para a auditoria (quem viu o prontuário de quem);
 * - os textos são gravados criptografados (RecordCipher).
 */
@Service
public class RecordService {

	private final AppointmentRecordRepository records;
	private final AppointmentRepository appointments;
	private final RecordCipher cipher;
	private final NotificationService notifications;
	private final LogClient logClient;

	public RecordService(AppointmentRecordRepository records, AppointmentRepository appointments, RecordCipher cipher,
			NotificationService notifications, LogClient logClient) {
		this.records = records;
		this.appointments = appointments;
		this.cipher = cipher;
		this.notifications = notifications;
		this.logClient = logClient;
	}

	@Transactional(readOnly = true)
	public RecordResponse get(Long userId, Long appointmentId) {
		Appointment appointment = participantAppointment(userId, appointmentId);
		boolean viewerIsProfessional = appointment.getProfessional().getId().equals(userId);
		AppointmentRecord record = records.findByAppointmentId(appointmentId).orElse(null);
		if (record != null) {
			audit(userId, viewerIsProfessional, "READ", record, appointment);
		}
		return toResponse(appointment, record, viewerIsProfessional);
	}

	@Transactional
	public RecordResponse write(Long userId, Long appointmentId, String privateNotes, String patientGuidance) {
		Appointment appointment = participantAppointment(userId, appointmentId);
		if (!appointment.getProfessional().getId().equals(userId)) {
			throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Só o profissional escreve o registro da consulta.");
		}
		if (!appointment.acceptsRecord(Instant.now())) {
			throw new ApiException(HttpStatus.CONFLICT, "RECORD_NOT_ALLOWED",
					"O registro só pode ser feito a partir do horário da consulta, e não em consulta cancelada ou remarcada.");
		}

		Optional<AppointmentRecord> existing = records.findByAppointmentId(appointmentId);
		boolean creating = existing.isEmpty();
		String newGuidance = Digits.trimToNull(patientGuidance);
		String oldGuidance = existing.map(r -> cipher.decrypt(r.getPatientGuidance())).orElse(null);
		boolean newGuidanceForPatient = newGuidance != null && !newGuidance.equals(oldGuidance);

		AppointmentRecord record = existing.orElseGet(() -> new AppointmentRecord(appointment));
		record.write(cipher.encrypt(Digits.trimToNull(privateNotes)), cipher.encrypt(newGuidance));
		try {
			record = records.saveAndFlush(record);
		} catch (DataIntegrityViolationException e) {
			// Duas abas salvando o PRIMEIRO registro ao mesmo tempo: o UNIQUE do banco segura
			throw new ApiException(HttpStatus.CONFLICT, "RECORD_CONFLICT",
					"O registro foi salvo em outra janela. Recarregue a página e tente de novo.");
		}

		// O paciente fica sabendo que há orientações novas (o texto em si só aparece logado, no site)
		if (newGuidanceForPatient) {
			notifications.notify(appointment.getPatient().getId(), Notification.Type.APPOINTMENT,
					"Orientações da consulta",
					"%s registrou orientações da sua consulta.".formatted(appointment.getProfessional().getUser().getName()),
					NotificationLinks.appointment(appointmentId));
		}
		audit(userId, true, creating ? "CREATE" : "UPDATE", record, appointment);
		return toResponse(appointment, record, true);
	}

	private Appointment participantAppointment(Long userId, Long appointmentId) {
		return appointments.findWithPeople(appointmentId)
				.filter(a -> a.hasParticipant(userId))
				.orElseThrow(() -> ApiException.notFound("Consulta não encontrada."));
	}

	private void audit(Long actorId, boolean professional, String action, AppointmentRecord record,
			Appointment appointment) {
		Long recordId = record.getId();
		Long patientId = appointment.getPatient().getId();
		String role = professional ? "PROFESSIONAL" : "PATIENT";
		AfterCommit.run(() -> logClient.audit(actorId, role, action, "appointment_records", recordId, patientId));
	}

	private RecordResponse toResponse(Appointment appointment, AppointmentRecord record, boolean viewerIsProfessional) {
		boolean canEdit = viewerIsProfessional && appointment.acceptsRecord(Instant.now());
		if (record == null) {
			return new RecordResponse(appointment.getId(), null, null, null, null, canEdit);
		}
		return new RecordResponse(
				appointment.getId(),
				// Anotações privadas NUNCA saem para o paciente (nem cifradas)
				viewerIsProfessional ? cipher.decrypt(record.getPrivateNotes()) : null,
				cipher.decrypt(record.getPatientGuidance()),
				toInstant(record.getCreatedAt()),
				toInstant(record.getUpdatedAt()),
				canEdit);
	}

	private static Instant toInstant(LocalDateTime utc) {
		return utc == null ? null : utc.toInstant(ZoneOffset.UTC);
	}

	/**
	 * Registro como aparece na tela. Sem registro ainda: textos e datas null.
	 * privateNotes é sempre null para o paciente.
	 */
	public record RecordResponse(
			Long appointmentId,
			String privateNotes,
			String patientGuidance,
			Instant createdAt,
			Instant updatedAt,
			/** Profissional e consulta aceita registro: mostrar o formulário */
			boolean canEdit) {
	}
}
