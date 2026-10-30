package br.com.nutrimente.api.common.event;

/** O paciente remarcou uma consulta para outro horário. */
public record AppointmentRescheduledEvent(
		Long originalId, Long newId,
		Long patientId, Long professionalId,
		String patientName, String patientEmail,
		String professionalName, String professionalEmail,
		String originalWhen, String newWhen, String cancelPolicy) implements DomainEvent {
}
