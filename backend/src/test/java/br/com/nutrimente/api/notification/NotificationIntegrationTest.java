package br.com.nutrimente.api.notification;

import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Duration;
import java.time.LocalDate;
import java.time.ZoneId;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.jayway.jsonpath.JsonPath;

import br.com.nutrimente.api.IntegrationTest;

/** Notificações do "sininho": geradas pelos eventos, lidas, contadas e privadas. */
class NotificationIntegrationTest extends IntegrationTest {

	private int unread(String token) throws Exception {
		String body = getAs("/api/notifications/unread-count", token).andExpect(status().isOk())
				.andReturn().getResponse().getContentAsString();
		return JsonPath.read(body, "$.count");
	}

	@Test
	@DisplayName("eventos geram notificações para a pessoa certa; ler uma, ler todas; ninguém lê as dos outros")
	void notifications() throws Exception {
		getAs("/api/notifications", null).andExpect(status().isUnauthorized());

		String admin = createAdminAndLogin();
		Pro pro = readyProfessional(admin);
		// Aprovação também avisa o profissional
		getAs("/api/notifications", pro.token())
				.andExpect(jsonPath("$.items[*].title", hasItem("Cadastro aprovado")));
		postAs("/api/notifications/read-all", pro.token(), null).andExpect(status().isOk());
		org.junit.jupiter.api.Assertions.assertEquals(0, unread(pro.token()));

		String patientEmail = uniqueEmail();
		String patient = registerVerifiedPatient(patientEmail);
		Long patientId = jdbc.queryForObject("SELECT id FROM users WHERE email = ?", Long.class, patientEmail);
		String slot = slotAfter(pro.id(), Duration.ofHours(30));
		Integer appointmentId = JsonPath.read(book(patient, pro.id(), slot), "$.id");

		// Agendou: o profissional é avisado, com link para a consulta
		org.junit.jupiter.api.Assertions.assertEquals(1, unread(pro.token()));
		getAs("/api/notifications", pro.token())
				.andExpect(jsonPath("$.items[0].type").value("APPOINTMENT"))
				.andExpect(jsonPath("$.items[0].title").value("Nova consulta agendada"))
				.andExpect(jsonPath("$.items[0].linkUrl").value("/appointments/" + appointmentId))
				.andExpect(jsonPath("$.items[0].read").value(false));

		// Tentativa recusada (409) não gera aviso nenhum
		String other = registerVerifiedPatient(uniqueEmail());
		postAs("/api/appointments", other, "{\"professionalId\": %d, \"startsAt\": \"%s\"}".formatted(pro.id(), slot))
				.andExpect(status().isConflict());
		org.junit.jupiter.api.Assertions.assertEquals(1, unread(pro.token()));

		// Confirmou: o paciente é avisado
		int before = unread(patient);
		postAs("/api/appointments/" + appointmentId + "/confirm", pro.token(), null).andExpect(status().isOk());
		org.junit.jupiter.api.Assertions.assertEquals(before + 1, unread(patient));
		String list = getAs("/api/notifications", patient)
				.andExpect(jsonPath("$.items[0].title").value("Consulta confirmada"))
				.andReturn().getResponse().getContentAsString();
		Integer confirmedId = JsonPath.read(list, "$.items[0].id");

		// Plano novo: o paciente é avisado
		LocalDate today = LocalDate.now(ZoneId.of("America/Sao_Paulo"));
		postAs("/api/plans", pro.token(), """
				{"patientId": %d, "title": "Plano teste", "startDate": "%s",
				 "checklist": [{"description": "Beber água"}]}""".formatted(patientId, today))
				.andExpect(status().isCreated());
		getAs("/api/notifications", patient)
				.andExpect(jsonPath("$.items[0].type").value("PLAN"))
				.andExpect(jsonPath("$.items[0].title").value("Novo plano de ação"));

		// Ler uma: o contador cai; outra pessoa não consegue ler (404)
		int now = unread(patient);
		postAs("/api/notifications/" + confirmedId + "/read", other, null).andExpect(status().isNotFound());
		postAs("/api/notifications/" + confirmedId + "/read", patient, null)
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.read").value(true));
		org.junit.jupiter.api.Assertions.assertEquals(now - 1, unread(patient));

		// Ler todas
		postAs("/api/notifications/read-all", patient, null)
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.updated").value(now - 1));
		org.junit.jupiter.api.Assertions.assertEquals(0, unread(patient));
	}
}
