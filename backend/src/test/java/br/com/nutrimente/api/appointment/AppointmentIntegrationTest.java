package br.com.nutrimente.api.appointment;

import static org.hamcrest.Matchers.empty;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.startsWith;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.jayway.jsonpath.JsonPath;

import br.com.nutrimente.api.IntegrationTest;

/** Agenda: horários de atendimento, horários livres, agendar, cancelar, remarcar, confirmar e concluir. */
class AppointmentIntegrationTest extends IntegrationTest {

	@Test
	@DisplayName("horários de atendimento: validação, só o profissional edita, e a lista volta ordenada")
	void availability() throws Exception {
		String token = registerVerifiedProfessional(uniqueEmail(), "PSICOLOGO", "06/" + (100000 + (int) (Math.random() * 899999)));

		putAs("/api/me/availability", token, """
				{"windows": [{"dayOfWeek": 1, "startTime": "12:00", "endTime": "08:00"}]}""")
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors.windows", startsWith("O horário de término precisa ser depois do início")));
		putAs("/api/me/availability", token, """
				{"windows": [{"dayOfWeek": 1, "startTime": "08:00", "endTime": "12:00"},
				             {"dayOfWeek": 1, "startTime": "11:00", "endTime": "14:00"}]}""")
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors.windows").value("Há horários sobrepostos na segunda-feira."));
		putAs("/api/me/availability", token, """
				{"windows": [{"dayOfWeek": 2, "startTime": "08:00", "endTime": "08:30"}]}""")
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors.windows", startsWith("A janela precisa ter pelo menos 50 minutos")));
		putAs("/api/me/availability", token, """
				{"windows": [{"dayOfWeek": 9, "startTime": "08:00", "endTime": "12:00"}]}""")
				.andExpect(status().isBadRequest());

		putAs("/api/me/availability", token, """
				{"windows": [{"dayOfWeek": 3, "startTime": "14:00", "endTime": "18:00"},
				             {"dayOfWeek": 1, "startTime": "08:00", "endTime": "12:00"}]}""")
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].dayOfWeek").value(1))
				.andExpect(jsonPath("$[0].startTime").value("08:00:00"))
				.andExpect(jsonPath("$[1].dayOfWeek").value(3));
		getAs("/api/me/availability", token).andExpect(jsonPath("$.length()").value(2));

		String patient = registerVerifiedPatient(uniqueEmail());
		getAs("/api/me/availability", patient).andExpect(status().isForbidden());
	}

	@Test
	@DisplayName("horários livres: só de aprovado com preço, a partir de 2 h de antecedência")
	void freeSlotRules() throws Exception {
		String admin = createAdminAndLogin();
		// Sem preço: aprovado e com agenda, mas ainda não aceita agendamento
		String email = uniqueEmail();
		String token = registerVerifiedProfessional(email, "NUTRICIONISTA", randomDocument());
		Long id = jdbc.queryForObject("SELECT id FROM users WHERE email = ?", Long.class, email);
		getAs("/api/professionals/" + id + "/slots", null).andExpect(status().isNotFound()); // ainda não aprovado
		putAs("/api/me/availability", token, ALL_DAY).andExpect(status().isOk());
		patchAs("/api/admin/professionals/" + id + "/verification", admin, "{\"status\": \"APPROVED\"}");
		getAs("/api/professionals/" + id + "/slots", null).andExpect(status().isOk()).andExpect(jsonPath("$", empty()));

		Pro pro = readyProfessional(admin);
		List<String> slots = freeSlots(pro.id(), 2);
		assertFalse(slots.isEmpty());
		Instant earliest = Instant.now().plus(Duration.ofHours(2)).minusSeconds(60);
		assertTrue(slots.stream().allMatch(s -> Instant.parse(s).isAfter(earliest)), "nenhum horário com menos de 2 h");
		// 2 dias, não 1: depois das 22h não sobra horário "hoje" (antecedência mínima de 2 h)
		getAs("/api/professionals/" + pro.id() + "/slots?days=2", null)
				.andExpect(jsonPath("$[0].weekday").isString())
				.andExpect(jsonPath("$[0].slots[0].time").isString());
		getAs("/api/professionals/999999999/slots", null).andExpect(status().isNotFound());
	}

	@Test
	@DisplayName("agendar: cria com link de vídeo e valor, avisa os dois e o horário some; conflitos dão 409")
	void booking() throws Exception {
		String admin = createAdminAndLogin();
		Pro pro = readyProfessional(admin);
		Pro other = readyProfessional(admin);
		String patientEmail = uniqueEmail();
		String patient = registerVerifiedPatient(patientEmail);
		String slot = slotAfter(pro.id(), Duration.ofHours(30));

		String body = book(patient, pro.id(), slot);
		Integer id = JsonPath.read(body, "$.id");
		org.junit.jupiter.api.Assertions.assertEquals("SCHEDULED", JsonPath.read(body, "$.status"));
		org.junit.jupiter.api.Assertions.assertEquals(slot, JsonPath.read(body, "$.startsAt"));
		assertTrue(((String) JsonPath.read(body, "$.videoUrl")).startsWith("https://meet.jit.si/NutriMente-"));
		org.junit.jupiter.api.Assertions.assertEquals(150.0, ((Number) JsonPath.read(body, "$.price")).doubleValue());
		assertTrue((Boolean) JsonPath.read(body, "$.canCancel"));
		verify(emailService, atLeastOnce()).sendAppointmentNotice(eq(pro.email()), anyString(),
				eq("Nova consulta agendada"), anyString(), anyString());
		verify(emailService, atLeastOnce()).sendAppointmentNotice(eq(patientEmail), anyString(),
				eq("Consulta agendada"), anyString(), anyString());

		// O horário sai da lista de livres
		assertFalse(freeSlots(pro.id(), 5).contains(slot));

		// Outro paciente no mesmo horário: indisponível
		String patient2 = registerVerifiedPatient(uniqueEmail());
		postAs("/api/appointments", patient2, "{\"professionalId\": %d, \"startsAt\": \"%s\"}".formatted(pro.id(), slot))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.code").value("SLOT_UNAVAILABLE"));
		// O mesmo paciente com OUTRO profissional no mesmo horário: já tem consulta
		postAs("/api/appointments", patient, "{\"professionalId\": %d, \"startsAt\": \"%s\"}".formatted(other.id(), slot))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.code").value("PATIENT_BUSY"));
		// Horário fora da grade (ex.: 10 min depois de um horário válido)
		String offGrid = Instant.parse(slotAfter(other.id(), Duration.ofHours(30))).plusSeconds(600).toString();
		postAs("/api/appointments", patient2, "{\"professionalId\": %d, \"startsAt\": \"%s\"}".formatted(other.id(), offGrid))
				.andExpect(status().isConflict());
		// Profissional não agenda consulta
		postAs("/api/appointments", pro.token(), "{\"professionalId\": %d, \"startsAt\": \"%s\"}".formatted(other.id(), slot))
				.andExpect(status().isForbidden());
		// Campos obrigatórios
		postAs("/api/appointments", patient2, "{}")
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors.professionalId").exists())
				.andExpect(jsonPath("$.errors.startsAt").exists());

		// Os dois veem a consulta em "próximas"; um terceiro não a vê de jeito nenhum
		getAs("/api/appointments", patient).andExpect(jsonPath("$[*].id", hasItem(id)));
		getAs("/api/appointments?scope=UPCOMING", pro.token())
				.andExpect(jsonPath("$[*].id", hasItem(id)))
				.andExpect(jsonPath("$[0].patient.name").isString())
				.andExpect(jsonPath("$[0].canConfirm").value(true));
		getAs("/api/appointments/" + id, patient2).andExpect(status().isNotFound());
		getAs("/api/appointments?scope=XYZ", patient)
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors.scope").value("Opção inválida"));
	}

	@Test
	@DisplayName("cancelar: paciente só até 24 h antes; profissional até o início; vai para o histórico e libera o horário")
	void cancelling() throws Exception {
		String admin = createAdminAndLogin();
		Pro pro = readyProfessional(admin);
		String patient = registerVerifiedPatient(uniqueEmail());

		// Daqui a menos de 24 h: o paciente não cancela, o profissional sim
		String soon = freeSlots(pro.id(), 2).getFirst();
		Integer soonId = JsonPath.read(book(patient, pro.id(), soon), "$.id");
		if (Instant.parse(soon).isBefore(Instant.now().plus(Duration.ofHours(23)))) {
			postAs("/api/appointments/" + soonId + "/cancel", patient, null)
					.andExpect(status().isConflict())
					.andExpect(jsonPath("$.code").value("TOO_LATE"));
		}
		postAs("/api/appointments/" + soonId + "/cancel", pro.token(), "{\"reason\": \"Imprevisto\"}")
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("CANCELLED"))
				.andExpect(jsonPath("$.cancellationReason").value("Imprevisto"));
		// Cancelada não cancela de novo
		postAs("/api/appointments/" + soonId + "/cancel", pro.token(), null).andExpect(status().isConflict());

		// Com mais de 24 h: o paciente cancela
		String later = slotAfter(pro.id(), Duration.ofHours(30));
		Integer laterId = JsonPath.read(book(patient, pro.id(), later), "$.id");
		postAs("/api/appointments/" + laterId + "/cancel", patient, "{\"reason\": \"Viagem\"}")
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("CANCELLED"));

		getAs("/api/appointments", patient).andExpect(jsonPath("$[*].id", not(hasItem(laterId))));
		getAs("/api/appointments?scope=PAST", patient).andExpect(jsonPath("$[*].id", hasItem(laterId)));
		assertTrue(freeSlots(pro.id(), 5).contains(later), "o horário cancelado volta a ficar livre");
	}

	@Test
	@DisplayName("remarcar: nasce outra consulta com o mesmo valor; a antiga vira RESCHEDULED; só o paciente remarca")
	void rescheduling() throws Exception {
		String admin = createAdminAndLogin();
		Pro pro = readyProfessional(admin);
		String patient = registerVerifiedPatient(uniqueEmail());
		List<String> later = freeSlots(pro.id(), 5).stream()
				.filter(s -> Instant.parse(s).isAfter(Instant.now().plus(Duration.ofHours(30)))).toList();
		Integer id = JsonPath.read(book(patient, pro.id(), later.get(0)), "$.id");

		postAs("/api/appointments/" + id + "/reschedule", pro.token(), "{\"startsAt\": \"%s\"}".formatted(later.get(1)))
				.andExpect(status().isForbidden());

		String body = postAs("/api/appointments/" + id + "/reschedule", patient,
				"{\"startsAt\": \"%s\"}".formatted(later.get(1)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.startsAt").value(later.get(1)))
				.andExpect(jsonPath("$.rescheduledFromId").value(id))
				.andExpect(jsonPath("$.price").value(150.0))
				.andReturn().getResponse().getContentAsString();
		Integer newId = JsonPath.read(body, "$.id");

		getAs("/api/appointments/" + id, patient).andExpect(jsonPath("$.status").value("RESCHEDULED"));
		getAs("/api/appointments", patient)
				.andExpect(jsonPath("$[*].id", hasItem(newId)))
				.andExpect(jsonPath("$[*].id", not(hasItem(id))));
		assertTrue(freeSlots(pro.id(), 5).contains(later.get(0)), "o horário antigo volta a ficar livre");
	}

	@Test
	@DisplayName("profissional confirma e, depois do horário, conclui")
	void confirmAndComplete() throws Exception {
		String admin = createAdminAndLogin();
		Pro pro = readyProfessional(admin);
		String patient = registerVerifiedPatient(uniqueEmail());
		Integer id = JsonPath.read(book(patient, pro.id(), slotAfter(pro.id(), Duration.ofHours(30))), "$.id");

		postAs("/api/appointments/" + id + "/confirm", patient, null).andExpect(status().isForbidden());
		postAs("/api/appointments/" + id + "/confirm", pro.token(), null)
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("CONFIRMED"))
				.andExpect(jsonPath("$.canConfirm").value(false));
		postAs("/api/appointments/" + id + "/complete", pro.token(), null)
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.code").value("INVALID_STATUS"));

		// Leva a consulta para o passado (como se o horário já tivesse chegado)
		jdbc.update("UPDATE appointments SET starts_at = DATEADD(hour, -2, SYSUTCDATETIME()),"
				+ " ends_at = DATEADD(minute, -70, SYSUTCDATETIME()) WHERE id = ?", id);
		postAs("/api/appointments/" + id + "/complete", pro.token(), null)
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("COMPLETED"));
		getAs("/api/appointments?scope=PAST", patient).andExpect(jsonPath("$[*].id", hasItem(id)));
	}
}
