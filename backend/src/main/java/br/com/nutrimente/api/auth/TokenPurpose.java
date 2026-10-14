package br.com.nutrimente.api.auth;

import java.time.Duration;

/** Para que serve o token enviado por e-mail, e por quanto tempo vale. */
public enum TokenPurpose {
	EMAIL_VERIFICATION(Duration.ofHours(24)),
	PASSWORD_RESET(Duration.ofHours(1)),
	/** Ticket do navegador que fez o cadastro: entra sozinho quando o e-mail for confirmado */
	REGISTRATION(Duration.ofHours(24));

	private final Duration validity;

	TokenPurpose(Duration validity) {
		this.validity = validity;
	}

	public Duration validity() {
		return validity;
	}
}
