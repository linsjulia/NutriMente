package br.com.nutrimente.api.auth;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;

/** Gera tokens aleatórios para os links de e-mail e calcula o hash deles. */
final class SecureTokens {

	/** SecureRandom: aleatório criptográfico (o Random comum é previsível) */
	private static final SecureRandom RANDOM = new SecureRandom();

	private SecureTokens() {
	}

	/** 32 bytes aleatórios em Base64 "seguro para URL" (sem +, / ou =) */
	static String generate() {
		byte[] bytes = new byte[32];
		RANDOM.nextBytes(bytes);
		return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
	}

	/** SHA-256 em hexadecimal (64 caracteres), o que vai para o banco */
	static String hash(String token) {
		try {
			byte[] digest = MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
			return HexFormat.of().formatHex(digest);
		} catch (NoSuchAlgorithmException e) {
			throw new IllegalStateException("SHA-256 indisponível", e);
		}
	}
}
