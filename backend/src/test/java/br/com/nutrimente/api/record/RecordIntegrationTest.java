package br.com.nutrimente.api.record;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Duration;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.jayway.jsonpath.JsonPath;

import br.com.nutrimente.api.IntegrationTest;

/**
 * Registro da consulta (prontuário): só o profissional escreve, a partir do
 * início; o paciente só lê as orientações; texto cifrado no banco; auditado.
 */
class RecordIntegrationTest extends IntegrationTest {

	private static final String RECORD = """
			{"privateNotes": "  Paciente relata compulsão à noite.  ", "patientGuidance": "Jantar até as 20h."}""";

	/** Leva a consulta para "hoursAgo" horas atrás (já começou) */
	private void startedHoursAgo(Integer appointmentId, int hoursAgo) {
		jdbc.update("UPDATE appointments SET starts_at = DATEADD(hour, -?, SYSUTCDATETIME()),"
				+ " ends_at = DATEADD(minute, 50, DATEADD(hour, -?, SYSUTCDATETIME())) WHERE id = ?",
				hoursAgo, hoursAgo, appointmentId);
	}

	@Test
	@DisplayName("registro: profissional escreve depois do início; paciente vê só as orientações; banco guarda cifrado")
	void recordFlow() throws Exception {
		String admin = createAdminAndLogin();
		Pro pro = readyProfessional(admin);
		String patient = registerVerifiedPatient(uniqueEmail());
		Integer id = JsonPath.read(book(patient, pro.id(), slotAfter(pro.id(), Duration.ofHours(30))), "$.id");
		String url = "/api/appointments/" + id + "/record";

		// Antes do início: não pode, e a tela não mostra o botão
		getAs("/api/appointments/" + id, pro.token()).andExpect(jsonPath("$.canWriteRecord").value(false));
		putAs(url, pro.token(), RECORD)
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.code").value("RECORD_NOT_ALLOWED"));

		startedHoursAgo(id, 5);
		getAs("/api/appointments/" + id, pro.token()).andExpect(jsonPath("$.canWriteRecord").value(true));
		getAs("/api/appointments/" + id, patient).andExpect(jsonPath("$.canWriteRecord").value(false));

		// Ainda vazio
		getAs(url, pro.token())
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.privateNotes").doesNotExist())
				.andExpect(jsonPath("$.canEdit").value(true));

		// Paciente não escreve; outro profissional nem enxerga a consulta
		putAs(url, patient, RECORD).andExpect(status().isForbidden());
		Pro other = readyProfessional(admin);
		putAs(url, other.token(), RECORD).andExpect(status().isNotFound());
		getAs(url, other.token()).andExpect(status().isNotFound());

		putAs(url, pro.token(), RECORD)
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.privateNotes").value("Paciente relata compulsão à noite."))
				.andExpect(jsonPath("$.patientGuidance").value("Jantar até as 20h."))
				.andExpect(jsonPath("$.updatedAt").isNotEmpty());

		// Paciente: só as orientações, nunca as anotações privadas
		getAs(url, patient)
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.privateNotes").doesNotExist())
				.andExpect(jsonPath("$.patientGuidance").value("Jantar até as 20h."))
				.andExpect(jsonPath("$.canEdit").value(false));
		getAs("/api/notifications?size=1", patient)
				.andExpect(jsonPath("$.items[0].title").value("Orientações da consulta"));

		// No banco, nada legível
		String stored = jdbc.queryForObject("SELECT private_notes FROM appointment_records WHERE appointment_id = ?",
				String.class, id);
		assertThat(stored).startsWith("v1:").doesNotContain("compulsão");

		// Editar mantém um registro só
		putAs(url, pro.token(), "{\"privateNotes\": \"Evolução boa.\", \"patientGuidance\": \"Jantar até as 20h.\"}")
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.privateNotes").value("Evolução boa."));
		assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM appointment_records WHERE appointment_id = ?",
				Integer.class, id)).isEqualTo(1);

		// Auditoria: quem escreveu e quem leu
		verify(logClient).audit(eq(pro.id()), eq("PROFESSIONAL"), eq("CREATE"), eq("appointment_records"), any(), any());
		verify(logClient, atLeastOnce()).audit(any(), eq("PATIENT"), eq("READ"), eq("appointment_records"), any(),
				any());

		// Validação de tamanho
		putAs(url, pro.token(), "{\"privateNotes\": \"%s\"}".formatted("a".repeat(20001)))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors.privateNotes").exists());
	}

	@Test
	@DisplayName("registro: consulta cancelada não aceita registro")
	void cancelledRejectsRecord() throws Exception {
		String admin = createAdminAndLogin();
		Pro pro = readyProfessional(admin);
		String patient = registerVerifiedPatient(uniqueEmail());
		Integer id = JsonPath.read(book(patient, pro.id(), slotAfter(pro.id(), Duration.ofHours(30))), "$.id");
		postAs("/api/appointments/" + id + "/cancel", pro.token(), "{\"reason\": \"Imprevisto\"}")
				.andExpect(status().isOk());
		startedHoursAgo(id, 7);

		getAs("/api/appointments/" + id, pro.token()).andExpect(jsonPath("$.canWriteRecord").value(false));
		putAs("/api/appointments/" + id + "/record", pro.token(), RECORD)
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.code").value("RECORD_NOT_ALLOWED"));
	}
}
