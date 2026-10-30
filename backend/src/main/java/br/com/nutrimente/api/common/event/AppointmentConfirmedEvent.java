package br.com.nutrimente.api.common.event;

/** O profissional confirmou a consulta agendada. */
public record AppointmentConfirmedEvent(
		Long appointmentId,
		Long patientId, Long professionalId,
		String patientEmail, String patientName,
		String professionalName, String when,
		String videoUrl, String cancelPolicy) implements DomainEvent {
}
