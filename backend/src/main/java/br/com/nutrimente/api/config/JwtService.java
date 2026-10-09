package br.com.nutrimente.api.config;

import java.time.Instant;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

import br.com.nutrimente.api.user.User;

/**
 * Gera o token de login (JWT).
 *
 * JWT = texto assinado com três partes (cabeçalho.dados.assinatura). Quem
 * tem a chave secreta consegue conferir que o token não foi alterado. Por
 * isso a API não precisa guardar sessões: cada requisição traz o token.
 *
 * Dados que vão no token (o mínimo; NUNCA coloque CPF, e-mail etc.):
 *   sub  = id do usuário
 *   role = papel (PATIENT, PROFESSIONAL, ADMIN)
 *   name = primeiro nome, para o cabeçalho do site
 *   exp  = quando expira
 */
@Service
public class JwtService {

	public static final MacAlgorithm ALGORITHM = MacAlgorithm.HS256;
	public static final String ISSUER = "nutrimente-api";

	private final NimbusJwtEncoder encoder;
	private final AppProperties properties;

	public JwtService(AppProperties properties) {
		this.properties = properties;
		this.encoder = NimbusJwtEncoder.withSecretKey(secretKey(properties)).build();
	}

	public static SecretKey secretKey(AppProperties properties) {
		byte[] bytes = properties.jwt().secret().getBytes(StandardCharsets.UTF_8);
		return new SecretKeySpec(bytes, "HmacSHA256");
	}

	public IssuedToken issue(User user) {
		Instant now = Instant.now();
		Instant expiresAt = now.plus(properties.jwt().expiration());
		JwtClaimsSet claims = JwtClaimsSet.builder()
				.issuer(ISSUER)
				.subject(user.getId().toString())
				.issuedAt(now)
				.expiresAt(expiresAt)
				.claim("role", user.getRole().name())
				.claim("name", firstName(user.getName()))
				// Versão da sessão: se a senha mudar, este token deixa de valer
				.claim(SessionValidator.VERSION_CLAIM, user.getSessionVersion())
				.build();
		String token = encoder.encode(JwtEncoderParameters.from(JwsHeader.with(ALGORITHM).build(), claims))
				.getTokenValue();
		return new IssuedToken(token, expiresAt);
	}

	private static String firstName(String name) {
		return name.strip().split("\\s+")[0];
	}

	public record IssuedToken(String value, Instant expiresAt) {
	}
}
