package br.com.nutrimente.api.common;

import java.util.LinkedHashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authorization.AuthorizationDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import br.com.nutrimente.api.logging.LogClient;

/**
 * Transforma qualquer erro em uma resposta JSON no padrão "Problem Details"
 * (RFC 9457), sempre com o mesmo formato:
 *
 * <pre>
 * { "status": 400, "code": "VALIDATION_ERROR", "detail": "Revise os campos destacados.",
 *   "errors": { "email": "E-mail inválido" } }
 * </pre>
 *
 * Assim o front trata todos os erros de um jeito só.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

	private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

	private final LogClient logClient;

	public GlobalExceptionHandler(LogClient logClient) {
		this.logClient = logClient;
	}

	@ExceptionHandler(ApiException.class)
	ProblemDetail handleApi(ApiException ex) {
		return problem(ex.getStatus(), ex.getCode(), ex.getMessage(), ex.getFieldErrors());
	}

	/** Erros das anotações @NotBlank, @Email, @Cpf... nos DTOs */
	@ExceptionHandler(MethodArgumentNotValidException.class)
	ProblemDetail handleValidation(MethodArgumentNotValidException ex) {
		Map<String, String> errors = new LinkedHashMap<>();
		ex.getBindingResult().getFieldErrors()
				.forEach(error -> errors.putIfAbsent(error.getField(), error.getDefaultMessage()));
		return problem(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Revise os campos destacados.", errors);
	}

	/** JSON mal formado ou valor inválido num enum (ex.: gender = "X") */
	@ExceptionHandler({ HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class })
	ProblemDetail handleUnreadable(Exception ex) {
		return problem(HttpStatus.BAD_REQUEST, "INVALID_REQUEST", "Dados enviados em formato inválido.", Map.of());
	}

	/** Logado, mas sem permissão (ex.: paciente tentando acessar área de admin) */
	@ExceptionHandler({ AccessDeniedException.class, AuthorizationDeniedException.class })
	ProblemDetail handleForbidden(Exception ex) {
		return problem(HttpStatus.FORBIDDEN, "FORBIDDEN", "Você não tem permissão para esta ação.", Map.of());
	}

	@ExceptionHandler(NoResourceFoundException.class)
	ProblemDetail handleNotFound(NoResourceFoundException ex) {
		return problem(HttpStatus.NOT_FOUND, "NOT_FOUND", "Endereço não encontrado.", Map.of());
	}

	/** Qualquer outro erro: registra e responde sem vazar detalhes internos */
	@ExceptionHandler(Exception.class)
	ProblemDetail handleUnexpected(Exception ex) {
		log.error("Erro inesperado", ex);
		logClient.applicationError(ex);
		return problem(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR",
				"Algo deu errado do nosso lado. Tente novamente em instantes.", Map.of());
	}

	private static ProblemDetail problem(HttpStatus status, String code, String detail, Map<String, String> errors) {
		ProblemDetail problem = ProblemDetail.forStatusAndDetail(status, detail);
		problem.setProperty("code", code);
		if (!errors.isEmpty()) {
			problem.setProperty("errors", errors);
		}
		return problem;
	}
}
