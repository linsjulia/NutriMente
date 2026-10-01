package br.com.nutrimente.api.config;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

/**
 * Configurações "nutrimente.*" do application.properties num objeto tipado.
 * Com @Validated, a API nem liga se faltar algo obrigatório (ex.: JWT_SECRET),
 * o que é melhor do que descobrir o problema no meio de um login.
 */
@Validated
@ConfigurationProperties(prefix = "nutrimente")
public record AppProperties(
		@NotBlank String frontendUrl,
		@Valid @NotNull Jwt jwt,
		@Valid @NotNull Mail mail,
		@Valid @NotNull Logs logs,
		@Valid @NotNull Admin admin,
		@Valid @DefaultValue RateLimit rateLimit) {

	public record Jwt(
			@NotBlank @Size(min = 32, message = "JWT_SECRET precisa ter pelo menos 32 caracteres") String secret,
			@NotNull Duration expiration) {
	}

	public record Mail(@NotBlank String from) {
	}

	/** apiKey vazio = envio de logs desligado (útil em testes) */
	public record Logs(@NotBlank String url, String apiKey) {
	}

	/** Máximo de requisições por minuto, por IP, nas rotas de autenticação */
	public record RateLimit(@DefaultValue("30") @Positive int authRequestsPerMinute) {
	}

	/** Se e-mail/senha ficarem vazios, nenhum admin é criado */
	public record Admin(String email, String password) {
	}
}
