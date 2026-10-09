package br.com.nutrimente.api.record;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;

import javax.crypto.Cipher;
import javax.crypto.Mac;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import br.com.nutrimente.api.config.AppProperties;

/**
 * Criptografa dados sensíveis antes de irem para o banco: registro da
 * consulta, questionário inicial, triagem e os dados pessoais do usuário
 * (CPF, telefone, data de nascimento; ver EncryptedStringConverter).
 *
 * Por quê: prontuário é dado de saúde sigiloso (LGPD art. 11; sigilo
 * profissional). Com a criptografia, quem tiver acesso ao BANCO (um backup
 * vazado, alguém olhando as tabelas) vê só um texto embaralhado. Só a API,
 * que tem a chave, consegue ler.
 *
 * Algoritmo: AES-256-GCM. Além de esconder o texto, o GCM tem uma "etiqueta"
 * que detecta alteração: se alguém mexer no texto cifrado direto no banco, a
 * leitura falha em vez de devolver lixo.
 *
 * Formato gravado: "v1:" + Base64(iv de 12 bytes + texto cifrado + etiqueta).
 * O iv (número aleatório) muda a cada gravação, então o mesmo texto nunca
 * gera o mesmo resultado. O "v1" permite trocar o formato no futuro.
 *
 * A chave vem de RECORDS_ENCRYPTION_KEY. Se ela não existir (desenvolvimento),
 * é derivada do JWT_SECRET. ATENÇÃO: perder ou trocar a chave torna os
 * registros já gravados ILEGÍVEIS. Em produção, defina RECORDS_ENCRYPTION_KEY
 * e guarde-a junto com os backups do banco.
 */
@Component
public class RecordCipher {

	private static final Logger log = LoggerFactory.getLogger(RecordCipher.class);
	private static final String PREFIX = "v1:";
	private static final int IV_BYTES = 12;
	private static final int TAG_BITS = 128;

	private final SecretKeySpec key;
	/** Chave separada para o índice cego (HMAC), derivada do mesmo segredo */
	private final SecretKeySpec indexKey;
	private final SecureRandom random = new SecureRandom();

	public RecordCipher(AppProperties properties) {
		String secret = properties.records().encryptionKey();
		if (secret == null || secret.isBlank()) {
			log.warn("RECORDS_ENCRYPTION_KEY não definida: usando chave derivada do JWT_SECRET. "
					+ "Se o JWT_SECRET mudar, os registros de consulta já gravados ficam ilegíveis.");
			secret = "nutrimente-records:" + properties.jwt().secret();
		}
		// SHA-256 transforma qualquer texto numa chave de exatamente 32 bytes (AES-256)
		this.key = new SecretKeySpec(sha256(secret), "AES");
		this.indexKey = new SecretKeySpec(sha256("nutrimente-blind-index:" + secret), "HmacSHA256");
	}

	/**
	 * Como decrypt, mas aceita valor ainda NÃO cifrado (gravado antes da
	 * criptografia, V007) e o devolve como está. Assim a API funciona durante
	 * a transição, até o LegacyPersonalDataEncryptor cifrar os registros antigos.
	 */
	public String decryptOrPlain(String stored) {
		return stored == null || !stored.startsWith(PREFIX) ? stored : decrypt(stored);
	}

	/** Diz se o valor já está no formato cifrado */
	public static boolean isEncrypted(String stored) {
		return stored != null && stored.startsWith(PREFIX);
	}

	/**
	 * "Índice cego": HMAC-SHA256 do valor, em hexadecimal (64 caracteres).
	 * O mesmo valor dá sempre o mesmo resultado, então dá para procurar e
	 * garantir unicidade (ex.: CPF) sem guardar o valor aberto. Sem a chave,
	 * não dá para descobrir o valor testando todos os CPFs possíveis.
	 */
	public String blindIndex(String value) {
		if (value == null) {
			return null;
		}
		try {
			Mac mac = Mac.getInstance("HmacSHA256");
			mac.init(indexKey);
			return HexFormat.of().formatHex(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
		} catch (GeneralSecurityException e) {
			throw new IllegalStateException("Falha ao calcular o índice cego", e);
		}
	}

	/** Texto -> "v1:..." (null continua null: campo vazio) */
	public String encrypt(String plain) {
		if (plain == null) {
			return null;
		}
		try {
			byte[] iv = new byte[IV_BYTES];
			random.nextBytes(iv);
			Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
			cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(TAG_BITS, iv));
			byte[] encrypted = cipher.doFinal(plain.getBytes(StandardCharsets.UTF_8));
			byte[] out = new byte[IV_BYTES + encrypted.length];
			System.arraycopy(iv, 0, out, 0, IV_BYTES);
			System.arraycopy(encrypted, 0, out, IV_BYTES, encrypted.length);
			return PREFIX + Base64.getEncoder().encodeToString(out);
		} catch (GeneralSecurityException e) {
			throw new IllegalStateException("Falha ao criptografar o registro da consulta", e);
		}
	}

	/**
	 * Bytes (ex.: uma foto) -> iv + dados cifrados + etiqueta. Mesmo algoritmo
	 * do texto, sem o Base64: arquivos ficam no disco, não numa coluna de texto.
	 */
	public byte[] encryptBytes(byte[] plain) {
		try {
			byte[] iv = new byte[IV_BYTES];
			random.nextBytes(iv);
			Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
			cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(TAG_BITS, iv));
			byte[] encrypted = cipher.doFinal(plain);
			byte[] out = new byte[IV_BYTES + encrypted.length];
			System.arraycopy(iv, 0, out, 0, IV_BYTES);
			System.arraycopy(encrypted, 0, out, IV_BYTES, encrypted.length);
			return out;
		} catch (GeneralSecurityException e) {
			throw new IllegalStateException("Falha ao criptografar o arquivo", e);
		}
	}

	public byte[] decryptBytes(byte[] stored) {
		try {
			Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
			cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(TAG_BITS, stored, 0, IV_BYTES));
			return cipher.doFinal(stored, IV_BYTES, stored.length - IV_BYTES);
		} catch (GeneralSecurityException e) {
			throw new IllegalStateException("Não foi possível ler o arquivo (chave diferente?)", e);
		}
	}

	/** "v1:..." -> texto. Falha se a chave estiver errada ou o texto tiver sido alterado */
	public String decrypt(String stored) {
		if (stored == null) {
			return null;
		}
		if (!stored.startsWith(PREFIX)) {
			throw new IllegalStateException("Registro da consulta em formato desconhecido");
		}
		try {
			byte[] data = Base64.getDecoder().decode(stored.substring(PREFIX.length()));
			Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
			cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(TAG_BITS, data, 0, IV_BYTES));
			return new String(cipher.doFinal(data, IV_BYTES, data.length - IV_BYTES), StandardCharsets.UTF_8);
		} catch (GeneralSecurityException | IllegalArgumentException e) {
			throw new IllegalStateException("Não foi possível ler o registro da consulta (chave diferente?)", e);
		}
	}

	private static byte[] sha256(String text) {
		try {
			return MessageDigest.getInstance("SHA-256").digest(text.getBytes(StandardCharsets.UTF_8));
		} catch (GeneralSecurityException e) {
			throw new IllegalStateException(e);
		}
	}
}
