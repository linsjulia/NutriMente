package br.com.nutrimente.api.common;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import br.com.nutrimente.api.config.AppProperties;
import br.com.nutrimente.api.record.RecordCipher;

/**
 * Guarda arquivos enviados pelas pessoas (fotos do diário alimentar e
 * documentos dos profissionais) numa pasta (no Docker, o volume
 * api-uploads). Três cuidados:
 * - o NOME do arquivo é aleatório (UUID): nunca usamos o nome enviado pela
 *   pessoa, que poderia conter "../" e escrever fora da pasta;
 * - o CONTEÚDO é criptografado (AES-GCM, RecordCipher): quem copiar a pasta
 *   não vê as fotos;
 * - na leitura, o nome precisa ter o formato esperado (UUID.bin).
 */
@Component
public class EncryptedFileStorage {

	private static final Logger log = LoggerFactory.getLogger(EncryptedFileStorage.class);
	private static final Pattern NAME = Pattern.compile("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.bin");

	private final Path dir;
	private final RecordCipher cipher;

	public EncryptedFileStorage(AppProperties properties, RecordCipher cipher) {
		this.dir = Path.of(properties.uploads().dir()).toAbsolutePath().normalize();
		this.cipher = cipher;
		try {
			Files.createDirectories(dir);
		} catch (IOException e) {
			throw new UncheckedIOException("Não foi possível criar a pasta de arquivos " + dir, e);
		}
	}

	/** Grava o arquivo cifrado e devolve o nome (aleatório) */
	public String save(byte[] content) {
		String name = UUID.randomUUID() + ".bin";
		try {
			Files.write(path(name), cipher.encryptBytes(content));
			return name;
		} catch (IOException e) {
			throw new UncheckedIOException("Falha ao gravar o arquivo", e);
		}
	}

	public byte[] read(String name) {
		try {
			return cipher.decryptBytes(Files.readAllBytes(path(name)));
		} catch (IOException e) {
			throw new UncheckedIOException("Falha ao ler o arquivo", e);
		}
	}

	/** Apaga sem falhar: se o arquivo já não existir, só registra no log */
	public void delete(String name) {
		if (name == null) {
			return;
		}
		try {
			Files.deleteIfExists(path(name));
		} catch (IOException | IllegalArgumentException e) {
			log.warn("Não foi possível apagar o arquivo {}", name, e);
		}
	}

	public boolean exists(String name) {
		return Files.exists(path(name));
	}

	private Path path(String name) {
		if (!NAME.matcher(name).matches()) {
			throw new IllegalArgumentException("Nome de arquivo inválido");
		}
		return dir.resolve(name);
	}
}
