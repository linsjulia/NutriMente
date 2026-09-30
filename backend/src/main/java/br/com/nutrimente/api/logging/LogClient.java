package br.com.nutrimente.api.logging;

import java.util.LinkedHashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import br.com.nutrimente.api.config.AppProperties;

/**
 * Envia logs para o serviço Node.js (services/logs-service), que grava no
 * MongoDB. É assim que Java, Node e MongoDB conversam no projeto.
 *
 * Regras importantes:
 * - @Async: roda em segundo plano, a pessoa não espera o log ser gravado.
 * - Nunca lança erro: se o serviço de logs cair, o login continua funcionando.
 * - Nunca envie senha, CPF ou dados de saúde num log.
 */
@Component
public class LogClient {

	private static final Logger log = LoggerFactory.getLogger(LogClient.class);

	private final RestClient http;
	private final boolean enabled;

	public LogClient(AppProperties properties) {
		String apiKey = properties.logs().apiKey();
		this.enabled = apiKey != null && !apiKey.isBlank();
		this.http = RestClient.builder().baseUrl(properties.logs().url())
				.defaultHeader("x-api-key", enabled ? apiKey : "")
				.build();
	}

	/** Tentativa de login, logout, pedido de redefinição de senha... */
	@Async
	public void access(String event, boolean success, Long userId, String email, String ip, String failureReason) {
		Map<String, Object> entry = new LinkedHashMap<>();
		entry.put("event", event);
		entry.put("success", success);
		entry.put("userId", userId);
		if (email != null) entry.put("email", email);
		if (ip != null) entry.put("ip", ip);
		if (failureReason != null) entry.put("failureReason", failureReason);
		send("access", entry);
	}

	/** Trilha de auditoria (LGPD): quem fez o quê, em qual registro, de quem */
	@Async
	public void audit(Long actorId, String actorRole, String action, String entity, Long entityId, Long subjectUserId) {
		Map<String, Object> entry = new LinkedHashMap<>();
		entry.put("actorId", actorId);
		entry.put("actorRole", actorRole);
		entry.put("action", action);
		entry.put("entity", entity);
		entry.put("entityId", entityId);
		entry.put("subjectUserId", subjectUserId);
		send("audit", entry);
	}

	/** Erros inesperados da API */
	@Async
	public void applicationError(Throwable error) {
		Map<String, Object> entry = new LinkedHashMap<>();
		entry.put("level", "ERROR");
		entry.put("service", "api-java");
		entry.put("message", String.valueOf(error.getMessage()));
		entry.put("error", Map.of("type", error.getClass().getName(), "message", String.valueOf(error.getMessage())));
		send("application", entry);
	}

	private void send(String type, Map<String, Object> entry) {
		if (!enabled) {
			return;
		}
		try {
			http.post().uri("/logs/{type}", type)
					.contentType(MediaType.APPLICATION_JSON)
					.body(entry)
					.retrieve()
					.toBodilessEntity();
		} catch (Exception e) {
			// Log local apenas; perder um log é melhor que derrubar a requisição
			log.warn("Não foi possível enviar log '{}' ao logs-service: {}", type, e.getMessage());
		}
	}
}
