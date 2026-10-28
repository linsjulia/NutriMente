package br.com.nutrimente.api.common.event;

/** O admin revogou a permissão de atendimento online de um profissional. */
public record TelehealthRevokedEvent(
		Long adminId,
		Long professionalId,
		String professionalEmail,
		String professionalName,
		String notificationBody) implements DomainEvent {
}
