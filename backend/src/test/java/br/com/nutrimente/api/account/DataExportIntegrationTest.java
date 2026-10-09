package br.com.nutrimente.api.account;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.greaterThan;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Duration;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.jayway.jsonpath.JsonPath;

import br.com.nutrimente.api.IntegrationTest;

/** "Baixar meus dados" (LGPD): tudo da pessoa, sem credenciais e sem as anotações privadas do prontuário */
class DataExportIntegrationTest extends IntegrationTest {

	@Test
	@DisplayName("exportar: paciente baixa seus dados (sem senha, sem anotações privadas); profissional vê o que escreveu")
	void exportFlow() throws Exception {
		String admin = createAdminAndLogin();
		Pro pro = readyProfessional(admin);
		String patientEmail = uniqueEmail();
		String patient = registerVerifiedPatient(patientEmail);
		Long patientId = jdbc.queryForObject("SELECT id FROM users WHERE email = ?", Long.class, patientEmail);

		Integer appointment = JsonPath.read(book(patient, pro.id(), slotAfter(pro.id(), Duration.ofHours(30))), "$.id");
		jdbc.update("UPDATE appointments SET starts_at = DATEADD(hour, -3, SYSUTCDATETIME()),"
				+ " ends_at = DATEADD(minute, 50, DATEADD(hour, -3, SYSUTCDATETIME())) WHERE id = ?", appointment);
		putAs("/api/appointments/" + appointment + "/record", pro.token(),
				"{\"privateNotes\": \"Hipótese técnica\", \"patientGuidance\": \"Beber água\"}").andExpect(status().isOk());

		getAs("/api/me/export", patient)
				.andExpect(status().isOk())
				.andExpect(header().string("Content-Disposition", containsString("attachment")))
				.andExpect(header().string("Content-Disposition", containsString("nutrimente-meus-dados-")))
				.andExpect(jsonPath("$.conta.email").value(patientEmail))
				.andExpect(jsonPath("$.conta.cpf").isNotEmpty())
				.andExpect(jsonPath("$.conta.password_hash").doesNotExist())
				.andExpect(jsonPath("$.consentimentos.length()").value(greaterThan(0)))
				.andExpect(jsonPath("$.consultas.length()").value(1))
				.andExpect(jsonPath("$.consultas[0].professional_name").isNotEmpty())
				.andExpect(jsonPath("$.consultas[0].starts_at", containsString("Z")))
				.andExpect(jsonPath("$.registrosDasConsultas[0].patient_guidance").value("Beber água"))
				.andExpect(jsonPath("$.registrosDasConsultas[0].private_notes").doesNotExist())
				.andExpect(jsonPath("$.notificacoes").isArray());

		getAs("/api/me/export", pro.token())
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.profissional[0].telehealth_registered").value(true))
				.andExpect(jsonPath("$.horariosDeAtendimento.length()").value(7))
				.andExpect(jsonPath("$.registrosDasConsultas[0].private_notes").value("Hipótese técnica"));

		verify(logClient).audit(eq(patientId), eq("PATIENT"), eq("READ"), eq("users.export"), eq(patientId),
				eq(patientId));
		getAs("/api/me/export", null).andExpect(status().isUnauthorized());
	}
}
