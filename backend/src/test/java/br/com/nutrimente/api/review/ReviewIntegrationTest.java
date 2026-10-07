package br.com.nutrimente.api.review;

import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Duration;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.jayway.jsonpath.JsonPath;

import br.com.nutrimente.api.IntegrationTest;

/** Avaliações: só de consulta realizada, uma vez, só pelo paciente; nota média recalculada. */
class ReviewIntegrationTest extends IntegrationTest {

	/**
	 * Leva a consulta "hoursAgo" horas para o passado e a marca como realizada
	 * (pelo caminho normal: o profissional conclui). Cada consulta usa um
	 * "hoursAgo" diferente: o banco não aceita duas no mesmo horário.
	 */
	private void completed(Pro pro, Integer appointmentId, int hoursAgo) throws Exception {
		jdbc.update("UPDATE appointments SET starts_at = DATEADD(hour, -?, SYSUTCDATETIME()),"
				+ " ends_at = DATEADD(minute, 50, DATEADD(hour, -?, SYSUTCDATETIME())) WHERE id = ?",
				hoursAgo, hoursAgo, appointmentId);
		postAs("/api/appointments/" + appointmentId + "/complete", pro.token(), null).andExpect(status().isOk());
	}

	@Test
	@DisplayName("avaliar: só depois de realizada, uma vez, e a nota média do profissional muda na hora")
	void reviewFlow() throws Exception {
		String admin = createAdminAndLogin();
		Pro pro = readyProfessional(admin);
		String patientEmail = uniqueEmail();
		String patient = registerVerifiedPatient(patientEmail);
		jdbc.update("UPDATE users SET name = 'Joana Pereira Lima' WHERE email = ?", patientEmail);

		Integer first = JsonPath.read(book(patient, pro.id(), slotAfter(pro.id(), Duration.ofHours(30))), "$.id");

		// Ainda não aconteceu
		postAs("/api/appointments/" + first + "/review", patient, "{\"rating\": 5}")
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.code").value("NOT_COMPLETED"));
		getAs("/api/appointments/" + first, patient).andExpect(jsonPath("$.canReview").value(false));

		completed(pro, first, 26);
		getAs("/api/appointments?scope=PAST", patient)
				.andExpect(jsonPath("$[?(@.id == %d)].canReview".formatted(first)).value(hasItem(true)));

		// Validação
		postAs("/api/appointments/" + first + "/review", patient, "{\"rating\": 6}")
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors.rating").value("Escolha de 1 a 5 estrelas"));
		postAs("/api/appointments/" + first + "/review", patient, "{}")
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors.rating").value("Escolha de 1 a 5 estrelas"));
		// O profissional não avalia; outro paciente nem enxerga a consulta
		postAs("/api/appointments/" + first + "/review", pro.token(), "{\"rating\": 5}").andExpect(status().isForbidden());
		String stranger = registerVerifiedPatient(uniqueEmail());
		postAs("/api/appointments/" + first + "/review", stranger, "{\"rating\": 1}").andExpect(status().isNotFound());

		postAs("/api/appointments/" + first + "/review", patient, "{\"rating\": 5, \"comment\": \"  Excelente!  \"}")
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.rating").value(5))
				.andExpect(jsonPath("$.comment").value("Excelente!"))
				.andExpect(jsonPath("$.patientName").value("Joana L."));
		postAs("/api/appointments/" + first + "/review", patient, "{\"rating\": 1}")
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.code").value("ALREADY_REVIEWED"));
		getAs("/api/appointments/" + first, patient).andExpect(jsonPath("$.canReview").value(false));
		getAs("/api/professionals/" + pro.id(), null)
				.andExpect(jsonPath("$.ratingAverage").value(5.0))
				.andExpect(jsonPath("$.ratingCount").value(1));

		// Segunda consulta, nota 3: média 4,00
		Integer second = JsonPath.read(book(patient, pro.id(), slotAfter(pro.id(), Duration.ofHours(30))), "$.id");
		completed(pro, second, 3);
		postAs("/api/appointments/" + second + "/review", patient, "{\"rating\": 3}").andExpect(status().isCreated());
		getAs("/api/professionals/" + pro.id(), null)
				.andExpect(jsonPath("$.ratingAverage").value(4.0))
				.andExpect(jsonPath("$.ratingCount").value(2));

		// Lista pública: mais recente primeiro, nome abreviado
		getAs("/api/professionals/" + pro.id() + "/reviews", null)
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.totalItems").value(2))
				.andExpect(jsonPath("$.items[0].rating").value(3))
				.andExpect(jsonPath("$.items[1].comment").value("Excelente!"))
				.andExpect(jsonPath("$.items[0].patientName").value("Joana L."));
		getAs("/api/professionals/999999999/reviews", null).andExpect(status().isNotFound());
	}
}
