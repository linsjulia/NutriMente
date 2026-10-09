package br.com.nutrimente.api.meal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpMethod;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.ResultActions;

import com.jayway.jsonpath.JsonPath;

import br.com.nutrimente.api.IntegrationTest;
import br.com.nutrimente.api.config.AppProperties;

/** Diário alimentar: o paciente registra (com foto cifrada); só o profissional que o atende lê */
class MealLogIntegrationTest extends IntegrationTest {

	/** Começo de um PNG de verdade (a "assinatura"), seguido de bytes quaisquer */
	private static final byte[] PNG = { (byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 1, 2, 3, 4, 5, 6, 7, 8 };
	private static final byte[] GIF = { 'G', 'I', 'F', '8', '9', 'a', 1, 2, 3 };

	@Autowired
	private AppProperties properties;

	private String meal(Instant eatenAt) {
		return """
				{"eatenAt": "%s", "mealType": "ALMOCO", "description": "  Arroz, feijão, frango e salada  ",
				 "notes": "Comi com calma", "hungerLevel": 4, "satisfactionLevel": 3}""".formatted(eatenAt);
	}

	private ResultActions uploadPhoto(String token, Object mealId, byte[] bytes, String name) throws Exception {
		return mvc.perform(multipart(HttpMethod.PUT, "/api/me/meals/" + mealId + "/photo")
				.file(new MockMultipartFile("photo", name, "image/png", bytes))
				.header("Authorization", "Bearer " + token));
	}

	@Test
	@DisplayName("diário: registrar, validar, foto cifrada no disco, editar, apagar")
	void patientDiary() throws Exception {
		String patient = registerVerifiedPatient(uniqueEmail());
		Instant lunch = Instant.now().minus(3, ChronoUnit.HOURS);

		postAs("/api/me/meals", patient, """
				{"eatenAt": "%s", "description": " ", "hungerLevel": 9}""".formatted(Instant.now().plus(Duration.ofDays(1))))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors.mealType").value("Escolha a refeição"))
				.andExpect(jsonPath("$.errors.description").value("Conte o que você comeu"))
				.andExpect(jsonPath("$.errors.hungerLevel").value("Escolha de 1 a 5"));
		postAs("/api/me/meals", patient, meal(Instant.now().plus(Duration.ofDays(1))))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors.eatenAt").value("A refeição não pode estar no futuro"));
		postAs("/api/me/meals", patient, meal(Instant.now().minus(Duration.ofDays(61))))
				.andExpect(jsonPath("$.errors.eatenAt").value("Registre refeições dos últimos 60 dias"));

		String body = postAs("/api/me/meals", patient, meal(lunch))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.description").value("Arroz, feijão, frango e salada"))
				.andExpect(jsonPath("$.photoUrl").doesNotExist())
				.andReturn().getResponse().getContentAsString();
		Integer id = JsonPath.read(body, "$.id");
		assertThat(jdbc.queryForObject("SELECT description FROM meal_logs WHERE id = ?", String.class, id))
				.startsWith("v1:").doesNotContain("feijão");

		// Foto: tipo conferido pelos bytes (não pelo nome do arquivo)
		uploadPhoto(patient, id, GIF, "foto.png").andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors.photo").value("Envie uma foto em JPG, PNG ou WebP"));
		uploadPhoto(patient, id, PNG, "../../hack.png").andExpect(status().isOk())
				.andExpect(jsonPath("$.photoUrl").value("/api/meals/" + id + "/photo"));
		String file = jdbc.queryForObject("SELECT photo_file FROM meal_logs WHERE id = ?", String.class, id);
		assertThat(file).matches("[0-9a-f-]{36}\\.bin"); // nome aleatório, nunca o enviado
		Path onDisk = Path.of(properties.uploads().dir()).resolve(file);
		assertThat(Arrays.equals(Files.readAllBytes(onDisk), PNG)).isFalse(); // cifrado no disco

		getAs("/api/meals/" + id + "/photo", patient)
				.andExpect(status().isOk())
				.andExpect(header().string("Content-Type", "image/png"))
				.andExpect(header().string("X-Content-Type-Options", "nosniff"))
				.andExpect(content().bytes(PNG));

		// Lista: mais recente primeiro
		postAs("/api/me/meals", patient, meal(Instant.now().minus(1, ChronoUnit.HOURS)).replace("ALMOCO", "LANCHE_DA_TARDE"))
				.andExpect(status().isCreated());
		getAs("/api/me/meals", patient)
				.andExpect(jsonPath("$.totalItems").value(2))
				.andExpect(jsonPath("$.items[0].mealType").value("LANCHE_DA_TARDE"));

		// Editar e apagar (a foto vai junto, depois do commit)
		putAs("/api/me/meals/" + id, patient, meal(lunch).replace("Comi com calma", "Comi rápido"))
				.andExpect(jsonPath("$.notes").value("Comi rápido"))
				.andExpect(jsonPath("$.photoUrl").exists());
		deleteAs("/api/me/meals/" + id, patient, null).andExpect(status().isNoContent());
		assertThat(Files.exists(onDisk)).isFalse();
		getAs("/api/meals/" + id + "/photo", patient).andExpect(status().isNotFound());
	}

	@Test
	@DisplayName("diário: só o profissional que atende lê (e vê a foto); excluir a conta apaga o diário")
	void professionalAndDeletion() throws Exception {
		String admin = createAdminAndLogin();
		Pro pro = readyProfessional(admin);
		Pro other = readyProfessional(admin);
		String email = uniqueEmail();
		String patient = registerVerifiedPatient(email);
		Long patientId = jdbc.queryForObject("SELECT id FROM users WHERE email = ?", Long.class, email);
		Integer id = JsonPath.read(postAs("/api/me/meals", patient, meal(Instant.now().minus(2, ChronoUnit.HOURS)))
				.andReturn().getResponse().getContentAsString(), "$.id");
		uploadPhoto(patient, id, PNG, "almoco.png").andExpect(status().isOk());

		getAs("/api/patients/" + patientId + "/meals", pro.token()).andExpect(status().isNotFound());
		getAs("/api/meals/" + id + "/photo", pro.token()).andExpect(status().isNotFound());

		book(patient, pro.id(), slotAfter(pro.id(), Duration.ofHours(30)));
		getAs("/api/patients/" + patientId + "/meals", pro.token())
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.items[0].description").value("Arroz, feijão, frango e salada"));
		getAs("/api/meals/" + id + "/photo", pro.token()).andExpect(status().isOk()).andExpect(content().bytes(PNG));
		getAs("/api/patients/" + patientId + "/meals", other.token()).andExpect(status().isNotFound());
		postAs("/api/me/meals", pro.token(), meal(Instant.now())).andExpect(status().isForbidden());

		// Excluir a conta apaga o diário e as fotos (LGPD)
		String file = jdbc.queryForObject("SELECT photo_file FROM meal_logs WHERE id = ?", String.class, id);
		deleteAs("/api/me", patient, "{\"password\": \"%s\"}".formatted(PASSWORD)).andExpect(status().isNoContent());
		assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM meal_logs WHERE patient_id = ?", Integer.class, patientId))
				.isZero();
		assertThat(Files.exists(Path.of(properties.uploads().dir()).resolve(file))).isFalse();
	}

	@Autowired
	private OrphanPhotoCleaner cleaner;

	@Test
	@DisplayName("fotos órfãs (sem refeição) são apagadas; as que estão em uso ficam")
	void orphanPhotosAreCleaned() throws Exception {
		String patient = registerVerifiedPatient(uniqueEmail());
		Integer id = JsonPath.read(postAs("/api/me/meals", patient, meal(Instant.now().minus(1, ChronoUnit.HOURS)))
				.andReturn().getResponse().getContentAsString(), "$.id");
		uploadPhoto(patient, id, PNG, "x.png").andExpect(status().isOk());
		Path dir = Path.of(properties.uploads().dir());
		Path inUse = dir.resolve(jdbc.queryForObject("SELECT photo_file FROM meal_logs WHERE id = ?", String.class, id));
		Path orphan = Files.write(dir.resolve(UUID.randomUUID() + ".bin"), new byte[] { 1, 2, 3 });

		cleaner.clean(Instant.now().plusSeconds(60)); // "mais antigos que daqui a 1 min" = todos

		assertThat(Files.exists(orphan)).isFalse();
		assertThat(Files.exists(inUse)).isTrue();
	}
}
