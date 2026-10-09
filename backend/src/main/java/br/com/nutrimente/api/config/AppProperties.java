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
		@Valid @DefaultValue RateLimit rateLimit,
		@Valid @DefaultValue Appointments appointments,
		@DefaultValue Records records,
		@DefaultValue Uploads uploads) {

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

	/**
	 * Regras da agenda (todas com valor padrão; mude no application.properties):
	 * - duration: duração de cada consulta (50 min)
	 * - slotInterval: de quanto em quanto tempo começa uma consulta (a cada 1 h,
	 *   o que deixa 10 min de intervalo entre uma e outra)
	 * - minNotice: antecedência mínima para agendar (2 h)
	 * - patientCancelLimit: até quanto tempo antes o PACIENTE pode cancelar ou remarcar (24 h)
	 * - bookingWindowDays: até quantos dias à frente dá para agendar (60)
	 * - timezone: fuso dos horários de atendimento (o banco guarda tudo em UTC)
	 * - reminderBefore: com quanto tempo de antecedência sai o lembrete (24 h)
	 * - remindersEnabled: liga o envio automático de lembretes (desligado nos testes)
	 */
	public record Appointments(
			@DefaultValue("50m") @NotNull Duration duration,
			@DefaultValue("60m") @NotNull Duration slotInterval,
			@DefaultValue("2h") @NotNull Duration minNotice,
			@DefaultValue("24h") @NotNull Duration patientCancelLimit,
			@DefaultValue("60") @Positive int bookingWindowDays,
			@DefaultValue("America/Sao_Paulo") @NotBlank String timezone,
			@DefaultValue("24h") @NotNull Duration reminderBefore,
			@DefaultValue("true") boolean remindersEnabled) {
	}

	/** Pasta das fotos do diário alimentar (gravadas cifradas, com nome aleatório) */
	public record Uploads(@DefaultValue("./uploads") String dir) {
	}

	/** Chave do registro da consulta. Vazia = derivada do JWT_SECRET (ver RecordCipher) */
	public record Records(String encryptionKey) {
	}

	/** Se e-mail/senha ficarem vazios, nenhum admin é criado */
	public record Admin(String email, String password) {
	}
}
