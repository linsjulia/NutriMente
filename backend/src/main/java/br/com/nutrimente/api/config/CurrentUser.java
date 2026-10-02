package br.com.nutrimente.api.config;

import org.springframework.security.oauth2.jwt.Jwt;

/**
 * Pega o id do usuário logado a partir do token.
 * Uso nos controllers: {@code me(@AuthenticationPrincipal Jwt jwt)} e depois
 * {@code CurrentUser.id(jwt)}.
 *
 * Importante: o id SEMPRE vem do token, nunca da URL ou do corpo da
 * requisição. Senão bastaria trocar o número para mexer na conta de outra
 * pessoa (falha conhecida como IDOR).
 */
public final class CurrentUser {

	private CurrentUser() {
	}

	public static Long id(Jwt jwt) {
		return Long.valueOf(jwt.getSubject());
	}
}
