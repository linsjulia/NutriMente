package br.com.nutrimente.api.config;

import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2ErrorCodes;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

/**
 * Confere, a cada requisição, se a sessão (o token) ainda vale.
 *
 * O JWT é "autossuficiente": a assinatura prova que a API o emitiu, mas não
 * diz se algo mudou depois. Sem esta conferência, um token roubado
 * continuaria valendo por até 8 horas, mesmo depois de a pessoa trocar a
 * senha ou excluir a conta.
 *
 * Duas regras:
 * 1. A conta precisa poder entrar: ativa, não excluída e com senha (a mesma
 *    regra de User.canLogin).
 * 2. A versão da sessão no token (claim "sv") precisa ser IGUAL à do banco
 *    (users.session_version). Trocar ou redefinir a senha soma 1 no banco,
 *    e os tokens antigos param de valer em todos os aparelhos.
 *
 * Custo: uma consulta pela chave primária por requisição autenticada, que
 * é rápida. Tokens de antes da V004 não têm "sv" e contam como 0.
 */
@Component
public class SessionValidator implements OAuth2TokenValidator<Jwt> {

	public static final String VERSION_CLAIM = "sv";

	private static final OAuth2Error ENDED = new OAuth2Error(OAuth2ErrorCodes.INVALID_TOKEN,
			"Sessão encerrada. Entre novamente.", null);

	private final JdbcTemplate jdbc;

	public SessionValidator(JdbcTemplate jdbc) {
		this.jdbc = jdbc;
	}

	@Override
	public OAuth2TokenValidatorResult validate(Jwt jwt) {
		Long userId;
		try {
			userId = Long.valueOf(jwt.getSubject());
		} catch (NumberFormatException e) {
			return OAuth2TokenValidatorResult.failure(ENDED);
		}
		List<Integer> current = jdbc.queryForList("""
				SELECT session_version FROM users
				WHERE id = ? AND is_active = 1 AND deleted_at IS NULL AND password_hash IS NOT NULL""",
				Integer.class, userId);
		if (current.isEmpty()) {
			return OAuth2TokenValidatorResult.failure(ENDED); // conta excluída, desativada ou inexistente
		}
		Number tokenVersion = jwt.getClaim(VERSION_CLAIM);
		int version = tokenVersion == null ? 0 : tokenVersion.intValue();
		return version == current.getFirst() ? OAuth2TokenValidatorResult.success()
				: OAuth2TokenValidatorResult.failure(ENDED);
	}
}
