package br.com.nutrimente.api.meal;

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
 * Apaga fotos "órfãs": arquivos da pasta de fotos que nenhuma refeição usa
 * mais. Acontece quando a refeição some direto no banco (ex.: o seed da
 * demonstração apaga os usuários) ou quando a transação falha depois de a
 * foto ser gravada.
 *
 * Só apaga arquivos com mais de 1 hora: uma foto acabou de ser gravada e a
 * transação ainda não terminou? Ela fica.
 */
@Component
public class OrphanPhotoCleaner {

	private static final Logger log = LoggerFactory.getLogger(OrphanPhotoCleaner.class);
	private static final Duration MIN_AGE = Duration.ofHours(1);

	private final JdbcTemplate jdbc;
	private final PhotoStorage photos;
	private final Path dir;

	public OrphanPhotoCleaner(JdbcTemplate jdbc, PhotoStorage photos, AppProperties properties) {
		this.jdbc = jdbc;
		this.photos = photos;
		this.dir = Path.of(properties.uploads().dir()).toAbsolutePath().normalize();
	}

	/** 5 min depois de ligar e, depois, a cada 6 h */
	@Scheduled(initialDelayString = "PT5M", fixedDelayString = "PT6H")
	void scheduled() {
		int removed = clean(Instant.now().minus(MIN_AGE));
		if (removed > 0) {
			log.info("Fotos órfãs apagadas: {}", removed);
		}
	}

	/** Apaga os arquivos sem refeição, modificados antes de "olderThan". Devolve quantos */
	int clean(Instant olderThan) {
		Set<String> used = new HashSet<>(
				jdbc.queryForList("SELECT photo_file FROM meal_logs WHERE photo_file IS NOT NULL", String.class));
		List<Path> candidates;
		try (Stream<Path> files = Files.list(dir)) {
			candidates = files.filter(f -> f.getFileName().toString().endsWith(".bin")).toList();
		} catch (IOException e) {
			log.warn("Não foi possível listar a pasta de fotos {}", dir, e);
			return 0;
		}
		int removed = 0;
		for (Path file : candidates) {
			String name = file.getFileName().toString();
			try {
				if (!used.contains(name) && Files.getLastModifiedTime(file).toInstant().isBefore(olderThan)) {
					photos.delete(name);
					removed++;
				}
			} catch (IOException e) {
				log.warn("Não foi possível conferir a foto {}", name, e);
			}
		}
		return removed;
	}
}
