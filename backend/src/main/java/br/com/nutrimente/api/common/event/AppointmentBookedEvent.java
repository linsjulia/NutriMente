package br.com.nutrimente.api.common.event;

/** Um paciente agendou uma consulta com um profissional. */
public record AppointmentBookedEvent(
		Long appointmentId,
		Long patientId, String patientName, String patientEmail,
		Long professionalId, String professionalName, String professionalEmail,
		String when, String modality, String cancelPolicy) implements DomainEvent {
}
