package br.com.nutrimente.api.common.event;

/** Uma consulta foi cancelada por um dos participantes. */
public record AppointmentCancelledEvent(
		Long appointmentId,
		Long patientId,
		Long cancelledById, boolean cancelledByPatient,
		Long otherId, String otherEmail, String otherName,
		String cancellerName, String when, String reason) implements DomainEvent {
}
