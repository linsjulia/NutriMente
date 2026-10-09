package br.com.nutrimente.api.common;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Stream;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import br.com.nutrimente.api.config.AppProperties;

/**
 * Apaga arquivos "órfãos": arquivos da pasta (EncryptedFileStorage) que
 * nenhuma linha usa mais, nem foto de refeição (meal_logs.photo_file) nem
 * documento de profissional (professional_documents.file_url). Acontece
 * quando a linha some direto no banco (ex.: o seed da demonstração apaga os
 * usuários) ou quando a transação falha depois de o arquivo ser gravado.
 *
 * Só apaga arquivos com mais de 1 hora: um arquivo acabou de ser gravado e
 * a transação ainda não terminou? Ele fica.
 */
@Component
public class OrphanFileCleaner {

	private static final Logger log = LoggerFactory.getLogger(OrphanFileCleaner.class);
	private static final Duration MIN_AGE = Duration.ofHours(1);

	private final JdbcTemplate jdbc;
	private final EncryptedFileStorage files;
	private final Path dir;

	public OrphanFileCleaner(JdbcTemplate jdbc, EncryptedFileStorage files, AppProperties properties) {
		this.jdbc = jdbc;
		this.files = files;
		this.dir = Path.of(properties.uploads().dir()).toAbsolutePath().normalize();
	}

	/** 5 min depois de ligar e, depois, a cada 6 h */
	@Scheduled(initialDelayString = "PT5M", fixedDelayString = "PT6H")
	void scheduled() {
		int removed = clean(Instant.now().minus(MIN_AGE));
		if (removed > 0) {
			log.info("Arquivos órfãos apagados: {}", removed);
		}
	}

	/** Apaga os arquivos sem refeição, modificados antes de "olderThan". Devolve quantos */
	public int clean(Instant olderThan) {
		Set<String> used = new HashSet<>(jdbc.queryForList("""
				SELECT photo_file FROM meal_logs WHERE photo_file IS NOT NULL
				UNION SELECT file_url FROM professional_documents""", String.class));
		List<Path> candidates;
		try (Stream<Path> listing = Files.list(dir)) {
			candidates = listing.filter(f -> f.getFileName().toString().endsWith(".bin")).toList();
		} catch (IOException e) {
			log.warn("Não foi possível listar a pasta de arquivos {}", dir, e);
			return 0;
		}
		int removed = 0;
		for (Path file : candidates) {
			String name = file.getFileName().toString();
			try {
				if (!used.contains(name) && Files.getLastModifiedTime(file).toInstant().isBefore(olderThan)) {
					files.delete(name);
					removed++;
				}
			} catch (IOException e) {
				log.warn("Não foi possível conferir o arquivo {}", name, e);
			}
		}
		return removed;
	}
}
