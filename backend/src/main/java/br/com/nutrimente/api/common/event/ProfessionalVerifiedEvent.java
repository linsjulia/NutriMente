package br.com.nutrimente.api.common.event;

/** O admin aprovou ou recusou o cadastro de um profissional. */
public record ProfessionalVerifiedEvent(
		Long adminId,
		Long professionalId,
		String professionalEmail,
		String professionalName,
		boolean approved,
		String reason) implements DomainEvent {
}
