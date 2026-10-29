package br.com.nutrimente.api.common.event;

/** Alguém pediu para redefinir a senha. */
public record PasswordResetRequestedEvent(
		Long userId, String email, String name,
		String resetToken, String ip) implements DomainEvent {
}
