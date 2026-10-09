package br.com.nutrimente.api.screening;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Duration;
import java.time.Instant;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.jayway.jsonpath.JsonPath;

import br.com.nutrimente.api.IntegrationTest;

/** Triagem: junto do agendamento ou depois, até o início; o profissional lê; vai junto na remarcação */
class ScreeningIntegrationTest extends IntegrationTest {

	@Test
	@DisplayName("triagem: no agendamento, ajuste pelo paciente, leitura pelo profissional, cópia ao remarcar")
	void screeningFlow() throws Exception {
		String admin = createAdminAndLogin();
		Pro pro = readyProfessional(admin);
		String patient = registerVerifiedPatient(uniqueEmail());
		String slot = slotAfter(pro.id(), Duration.ofHours(30));

		// Validação aninhada: o erro aponta o campo dentro de "screening"
		postAs("/api/appointments", patient, """
				{"professionalId": %d, "startsAt": "%s", "screening": {"reason": " ", "moodScore": 9}}"""
				.formatted(pro.id(), slot))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors['screening.reason']").value("Conte o motivo da consulta"))
				.andExpect(jsonPath("$.errors['screening.moodScore']").value("Escolha de 1 a 5"));

		String body = postAs("/api/appointments", patient, """
				{"professionalId": %d, "startsAt": "%s",
				 "screening": {"reason": "  Compulsão à noite  ", "symptoms": "Ansiedade", "moodScore": 2}}"""
				.formatted(pro.id(), slot))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.canEditScreening").value(true))
				.andReturn().getResponse().getContentAsString();
		Integer id = JsonPath.read(body, "$.id");
		String url = "/api/appointments/" + id + "/screening";

		getAs(url, pro.token())
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.reason").value("Compulsão à noite"))
				.andExpect(jsonPath("$.moodScore").value(2))
				.andExpect(jsonPath("$.canEdit").value(false));
		getAs("/api/appointments/" + id, pro.token()).andExpect(jsonPath("$.canEditScreening").value(false));
		verify(logClient).audit(eq(pro.id()), eq("PROFESSIONAL"), eq("READ"), eq("appointment_screenings"),
				eq(id.longValue()), any());
		assertThat(jdbc.queryForObject("SELECT reason FROM appointment_screenings WHERE appointment_id = ?",
				String.class, id)).startsWith("v1:").doesNotContain("Compulsão");

		// Paciente ajusta; profissional não pode; outro paciente nem vê
		putAs(url, patient, "{\"reason\": \"Compulsão à noite\", \"symptoms\": \"Ansiedade e insônia\", \"moodScore\": 3}")
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.symptoms").value("Ansiedade e insônia"));
		putAs(url, pro.token(), "{\"reason\": \"x\"}").andExpect(status().isForbidden());
		getAs(url, registerVerifiedPatient(uniqueEmail())).andExpect(status().isNotFound());

		// Remarcar: a consulta nova herda a triagem
		String newSlot = freeSlots(pro.id(), 5).stream()
				.filter(s -> Instant.parse(s).isAfter(Instant.parse(slot).plus(Duration.ofHours(2))))
				.findFirst().orElseThrow();
		Integer newId = JsonPath.read(postAs("/api/appointments/" + id + "/reschedule", patient,
				"{\"startsAt\": \"%s\"}".formatted(newSlot)).andExpect(status().isOk())
				.andReturn().getResponse().getContentAsString(), "$.id");
		getAs("/api/appointments/" + newId + "/screening", pro.token())
				.andExpect(jsonPath("$.symptoms").value("Ansiedade e insônia"));

		// Depois do início, a triagem fecha
		jdbc.update("UPDATE appointments SET starts_at = DATEADD(hour, -1, SYSUTCDATETIME()),"
				+ " ends_at = DATEADD(minute, -10, SYSUTCDATETIME()) WHERE id = ?", newId);
		putAs("/api/appointments/" + newId + "/screening", patient, "{\"reason\": \"Outro motivo\"}")
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.code").value("SCREENING_CLOSED"));
	}

	@Test
	@DisplayName("triagem: sem triagem no agendamento, GET devolve vazio e o paciente pode preencher depois")
	void screeningLater() throws Exception {
		String admin = createAdminAndLogin();
		Pro pro = readyProfessional(admin);
		String patient = registerVerifiedPatient(uniqueEmail());
		Integer id = JsonPath.read(book(patient, pro.id(), slotAfter(pro.id(), Duration.ofHours(30))), "$.id");
		String url = "/api/appointments/" + id + "/screening";

		getAs(url, patient)
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.reason").doesNotExist())
				.andExpect(jsonPath("$.canEdit").value(true));
		putAs(url, patient, "{\"reason\": \"Primeira consulta\"}")
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.reason").value("Primeira consulta"))
				.andExpect(jsonPath("$.symptoms").doesNotExist());
	}
}
