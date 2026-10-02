package br.com.nutrimente.api.common;

import java.util.Map;

import org.springframework.http.HttpStatus;

/**
 * Erro de regra de negócio que vira uma resposta HTTP bem formada.
 *
 * code: identificador estável que o front usa para decidir o que fazer
 *       (ex.: EMAIL_NOT_VERIFIED -> mostrar botão "reenviar e-mail").
 * message: texto em português para mostrar à pessoa.
 * fieldErrors: erros ligados a campos do formulário (ex.: {"email": "já cadastrado"}).
 */
public class ApiException extends RuntimeException {

	// Exceções em Java são "serializáveis" (podem ser gravadas em bytes).
	// O número de versão evita o aviso do compilador; nunca serializamos esta
	// exceção, então o valor fixo 1 basta.
	private static final long serialVersionUID = 1L;

	private final HttpStatus status;
	private final String code;
	// "transient" = fica de fora da serialização (Map não é garantidamente serializável)
	private final transient Map<String, String> fieldErrors;

	public ApiException(HttpStatus status, String code, String message) {
		this(status, code, message, Map.of());
	}

	public ApiException(HttpStatus status, String code, String message, Map<String, String> fieldErrors) {
		super(message);
		this.status = status;
		this.code = code;
		this.fieldErrors = fieldErrors;
	}

	/** Atalho para "este campo já está em uso" (HTTP 409) */
	public static ApiException conflict(String field, String message) {
		return new ApiException(HttpStatus.CONFLICT, "ALREADY_EXISTS", message, Map.of(field, message));
	}

	public static ApiException notFound(String message) {
		return new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", message);
	}

	public HttpStatus getStatus() {
		return status;
	}

	public String getCode() {
		return code;
	}

	public Map<String, String> getFieldErrors() {
		return fieldErrors;
	}
}
