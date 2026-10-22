package br.com.nutrimente.api.professional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.jayway.jsonpath.JsonPath;

import br.com.nutrimente.api.IntegrationTest;

/** Filtros da página de busca (card #95): temas, público, gênero, duração e disponibilidade. */
class ProfessionalSearchFiltersIntegrationTest extends IntegrationTest {

	private List<Integer> ids(String url) throws Exception {
		String body = getAs(url, null).andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
		return JsonPath.read(body, "$.items[*].id");
	}

	private int specialtyId(String name, String type) {
		return jdbc.queryForObject("SELECT id FROM specialties WHERE name = ? AND professional_type = ?", Integer.class,
				name, type);
	}

	@Test
	@DisplayName("perfil guarda duração e público; busca filtra por temas, público, gênero e duração")
	void filters() throws Exception {
		String admin = createAdminAndLogin();
		Pro ana = readyProfessional(admin);
		Pro bia = readyProfessional(admin);
		jdbc.update("UPDATE users SET gender = 'FEMALE' WHERE id = ?", ana.id());
		jdbc.update("UPDATE users SET gender = 'MALE' WHERE id = ?", bia.id());

		int psiconutricao = specialtyId("Psiconutrição", "NUTRICIONISTA");
		int diabetes = specialtyId("Diabetes", "NUTRICIONISTA");
		putAs("/api/me/professional-profile", ana.token(), """
				{"consultationPrice": 150.00, "consultationMinutes": 30, "audiences": ["ADULTO", "IDOSO"],
				 "specialtyIds": [%d]}""".formatted(psiconutricao))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.professional.consultationMinutes").value(30))
				.andExpect(jsonPath("$.professional.audiences[0]").value("ADULTO"))
				.andExpect(jsonPath("$.professional.audiences[1]").value("IDOSO"));
		putAs("/api/me/professional-profile", bia.token(), """
				{"consultationPrice": 150.00, "consultationMinutes": 90, "audiences": ["CRIANCA"],
				 "specialtyIds": [%d]}""".formatted(diabetes))
				.andExpect(status().isOk());

		// Perfil público mostra os dados novos
		getAs("/api/professionals/" + bia.id(), null)
				.andExpect(jsonPath("$.consultationMinutes").value(90))
				.andExpect(jsonPath("$.audiences[0]").value("CRIANCA"));

		String base = "/api/professionals?size=50&";
		// Vários temas ao mesmo tempo: quem tem pelo menos um
		assertThat(ids(base + "specialties=%d,%d".formatted(psiconutricao, diabetes)))
				.contains(ana.id().intValue(), bia.id().intValue());
		assertThat(ids(base + "specialties=" + psiconutricao)).contains(ana.id().intValue())
				.doesNotContain(bia.id().intValue());
		// Público
		assertThat(ids(base + "audience=IDOSO")).contains(ana.id().intValue()).doesNotContain(bia.id().intValue());
		assertThat(ids(base + "audience=CRIANCA&audience=ADOLESCENTE")).contains(bia.id().intValue())
				.doesNotContain(ana.id().intValue());
		// Gênero
		assertThat(ids(base + "gender=MALE")).contains(bia.id().intValue()).doesNotContain(ana.id().intValue());
		// Duração: até 30 / acima de 60 (combináveis)
		assertThat(ids(base + "duration=UP_TO_30")).contains(ana.id().intValue()).doesNotContain(bia.id().intValue());
		assertThat(ids(base + "duration=OVER_60")).contains(bia.id().intValue()).doesNotContain(ana.id().intValue());
		assertThat(ids(base + "duration=UP_TO_30,OVER_60")).contains(ana.id().intValue(), bia.id().intValue());

		// Valores fora da regra
		putAs("/api/me/professional-profile", ana.token(), "{\"consultationMinutes\": 5}")
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors.consultationMinutes").exists());
		getAs(base + "audience=BEBE", null).andExpect(status().isBadRequest());
	}

	@Test
	@DisplayName("a agenda e o agendamento usam a duração escolhida pelo profissional")
	void durationIsUsedBySchedule() throws Exception {
		String admin = createAdminAndLogin();
		Pro pro = readyProfessional(admin);
		putAs("/api/me/professional-profile", pro.token(), "{\"consultationPrice\": 150.00, \"consultationMinutes\": 90}")
				.andExpect(status().isOk());

		String body = getAs("/api/professionals/" + pro.id() + "/slots?days=3", null).andReturn().getResponse()
				.getContentAsString();
		String startsAt = JsonPath.read(body, "$[1].slots[0].startsAt");
		String endsAt = JsonPath.read(body, "$[1].slots[0].endsAt");
		assertThat(Duration.between(Instant.parse(startsAt), Instant.parse(endsAt))).isEqualTo(Duration.ofMinutes(90));

		String patient = registerVerifiedPatient(uniqueEmail());
		String booked = book(patient, pro.id(), startsAt);
		Instant start = Instant.parse(JsonPath.read(booked, "$.startsAt"));
		Instant end = Instant.parse(JsonPath.read(booked, "$.endsAt"));
		assertThat(Duration.between(start, end)).isEqualTo(Duration.ofMinutes(90));
	}

	@Test
	@DisplayName("disponibilidade: amanhã de manhã x à noite, conforme a agenda")
	void availability() throws Exception {
		String admin = createAdminAndLogin();
		Pro morning = readyProfessional(admin);
		Pro evening = readyProfessional(admin);
		StringBuilder windows = new StringBuilder("{\"windows\": [");
		for (int day = 0; day < 7; day++) {
			windows.append(day == 0 ? "" : ",")
					.append("{\"dayOfWeek\": %d, \"startTime\": \"19:00\", \"endTime\": \"22:00\"}".formatted(day));
		}
		putAs("/api/me/availability", evening.token(), windows.append("]}").toString()).andExpect(status().isOk());
		Pro noAgenda = readyProfessional(admin);
		putAs("/api/me/availability", noAgenda.token(), "{\"windows\": []}").andExpect(status().isOk());

		String base = "/api/professionals?size=50&available=TOMORROW&";
		assertThat(ids(base + "period=MORNING")).contains(morning.id().intValue())
				.doesNotContain(evening.id().intValue(), noAgenda.id().intValue());
		assertThat(ids(base + "period=EVENING")).contains(morning.id().intValue(), evening.id().intValue())
				.doesNotContain(noAgenda.id().intValue());
		// Só período (sem dia): próximas duas semanas
		assertThat(ids("/api/professionals?size=50&period=EVENING")).contains(evening.id().intValue())
				.doesNotContain(noAgenda.id().intValue());
		// Paginação continua certa com o filtro de disponibilidade
		getAs("/api/professionals?size=1&page=0&available=TOMORROW&period=EVENING", null)
				.andExpect(jsonPath("$.items.length()").value(1))
				.andExpect(jsonPath("$.size").value(1));
	}
}
