package br.com.nutrimente.api.common.event;

/** O profissional concluiu a consulta. */
public record AppointmentCompletedEvent(
		Long appointmentId,
		Long patientId,
		Long professionalId) implements DomainEvent {
}
