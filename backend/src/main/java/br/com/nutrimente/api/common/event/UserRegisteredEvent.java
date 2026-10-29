package br.com.nutrimente.api.common.event;

/** Um paciente ou profissional se cadastrou e precisa confirmar o e-mail. */
public record UserRegisteredEvent(
		Long userId, String role, String email, String name,
		String verificationToken) implements DomainEvent {
}
