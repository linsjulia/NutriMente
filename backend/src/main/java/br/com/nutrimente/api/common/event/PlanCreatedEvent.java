package br.com.nutrimente.api.common.event;

/** Um profissional criou um plano de ação para um paciente. */
public record PlanCreatedEvent(
		Long planId,
		Long professionalId,
		String professionalName,
		Long patientId,
		String patientEmail,
		String patientName,
		String planTitle) implements DomainEvent {
}
