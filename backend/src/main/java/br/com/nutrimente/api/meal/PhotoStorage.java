package br.com.nutrimente.api.meal;

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
 * Guarda as fotos do diário alimentar numa pasta (no Docker, o volume
 * api-uploads). Três cuidados:
 * - o NOME do arquivo é aleatório (UUID): nunca usamos o nome enviado pela
 *   pessoa, que poderia conter "../" e escrever fora da pasta;
 * - o CONTEÚDO é criptografado (AES-GCM, RecordCipher): quem copiar a pasta
 *   não vê as fotos;
 * - na leitura, o nome precisa ter o formato esperado (UUID.bin).
 */
@Component
public class PhotoStorage {

	private static final Logger log = LoggerFactory.getLogger(PhotoStorage.class);
	private static final Pattern NAME = Pattern.compile("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.bin");

	private final Path dir;
	private final RecordCipher cipher;

	public PhotoStorage(AppProperties properties, RecordCipher cipher) {
		this.dir = Path.of(properties.uploads().dir()).toAbsolutePath().normalize();
		this.cipher = cipher;
		try {
			Files.createDirectories(dir);
		} catch (IOException e) {
			throw new UncheckedIOException("Não foi possível criar a pasta de fotos " + dir, e);
		}
	}

	/** Grava a foto cifrada e devolve o nome do arquivo */
	public String save(byte[] image) {
		String name = UUID.randomUUID() + ".bin";
		try {
			Files.write(path(name), cipher.encryptBytes(image));
			return name;
		} catch (IOException e) {
			throw new UncheckedIOException("Falha ao gravar a foto", e);
		}
	}

	public byte[] read(String name) {
		try {
			return cipher.decryptBytes(Files.readAllBytes(path(name)));
		} catch (IOException e) {
			throw new UncheckedIOException("Falha ao ler a foto", e);
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
			log.warn("Não foi possível apagar a foto {}", name, e);
		}
	}

	boolean exists(String name) {
		return Files.exists(path(name));
	}

	private Path path(String name) {
		if (!NAME.matcher(name).matches()) {
			throw new IllegalArgumentException("Nome de foto inválido");
		}
		return dir.resolve(name);
	}
}
