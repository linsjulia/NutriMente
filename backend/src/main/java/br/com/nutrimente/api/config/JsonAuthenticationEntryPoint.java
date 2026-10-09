package br.com.nutrimente.api.config;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Resposta 401 no MESMO formato dos outros erros da API (ProblemDetail com
 * "code"), em vez de um 401 vazio. Assim o front sabe o que aconteceu:
 *
 * - UNAUTHORIZED: chegou sem token (precisa entrar);
 * - SESSION_INVALID: chegou com token, mas ele não vale mais (expirou, a
 *   senha foi trocada ou a conta foi excluída). O front apaga o cookie e
 *   manda para o login.
 *
 * Os textos são fixos (sem dados do usuário), por isso o JSON é montado à mão.
 */
public class JsonAuthenticationEntryPoint implements AuthenticationEntryPoint {

	private static final String NO_TOKEN = """
			{"type":"about:blank","title":"Unauthorized","status":401,\
			"detail":"Entre na sua conta para continuar.","code":"UNAUTHORIZED"}""";

	private static final String INVALID_TOKEN = """
			{"type":"about:blank","title":"Unauthorized","status":401,\
			"detail":"Sua sessão não é mais válida. Entre novamente.","code":"SESSION_INVALID"}""";

	@Override
	public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException e)
			throws IOException {
		String authorization = request.getHeader(HttpHeaders.AUTHORIZATION);
		boolean hadToken = authorization != null && authorization.startsWith("Bearer ");
		response.setStatus(HttpStatus.UNAUTHORIZED.value());
		response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
		response.setCharacterEncoding(StandardCharsets.UTF_8.name());
		response.getWriter().write(hadToken ? INVALID_TOKEN : NO_TOKEN);
	}
}
