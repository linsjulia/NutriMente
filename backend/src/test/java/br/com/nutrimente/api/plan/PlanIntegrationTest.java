package br.com.nutrimente.api.plan;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Duration;
import java.time.LocalDate;
import java.time.ZoneId;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.jayway.jsonpath.JsonPath;

import br.com.nutrimente.api.IntegrationTest;

/** Plano de ação: quem cria, quem marca, resumo de progresso e edição sem perder o histórico. */
class PlanIntegrationTest extends IntegrationTest {

	/** "Hoje" no fuso da agenda (o mesmo da API) */
	private static LocalDate today() {
		return LocalDate.now(ZoneId.of("America/Sao_Paulo"));
	}

	private static String planJson(Long patientId, LocalDate start) {
		return """
				{"patientId": %d, "title": "Reeducação alimentar", "description": "Foco em hidratação e regularidade.",
				 "startDate": "%s", "endDate": "%s",
				 "goals": [
				   {"description": "Perder 3 kg", "targetValue": 3, "unit": "kg"},
				   {"description": "Caminhar 3 vezes por semana"}
				 ],
				 "meals": [
				   {"mealType": "ALMOCO", "mealTime": "12:30", "description": "Arroz, feijão, salada e frango grelhado"},
				   {"mealType": "CAFE_DA_MANHA", "mealTime": "07:30", "description": "Pão integral com ovo e uma fruta"}
				 ],
				 "checklist": [
				   {"description": "Beber 2 litros de água", "frequency": "DAILY"},
				   {"description": "Planejar as refeições da semana", "frequency": "WEEKLY"},
				   {"description": "Fazer exame de sangue", "frequency": "ONCE"}
				 ]}""".formatted(patientId, start, start.plusDays(60));
	}

	@Test
	@DisplayName("plano de ação: criação, checklist, metas, progresso, edição e pausa")
	void fullFlow() throws Exception {
		String admin = createAdminAndLogin();
		Pro pro = readyProfessional(admin);
		String patientEmail = uniqueEmail();
		String patient = registerVerifiedPatient(patientEmail);
		Long patientId = jdbc.queryForObject("SELECT id FROM users WHERE email = ?", Long.class, patientEmail);
		book(patient, pro.id(), slotAfter(pro.id(), Duration.ofHours(30)));

		// Paciente sem consulta com este profissional: não pode receber plano dele
		String strangerEmail = uniqueEmail();
		String stranger = registerVerifiedPatient(strangerEmail);
		Long strangerId = jdbc.queryForObject("SELECT id FROM users WHERE email = ?", Long.class, strangerEmail);

		getAs("/api/me/patients", pro.token())
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[*].id", hasItem(patientId.intValue())));

		LocalDate start = today().minusDays(3);
		postAs("/api/plans", pro.token(), planJson(strangerId, start))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.code").value("NOT_YOUR_PATIENT"));
		postAs("/api/plans", pro.token(), planJson(patientId, start).replace("\"patientId\": " + patientId + ",", ""))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors.patientId").value("Escolha o paciente"));
		postAs("/api/plans", pro.token(), planJson(patientId, start)
				.replace("\"endDate\": \"" + start.plusDays(60) + "\"", "\"endDate\": \"" + start.minusDays(1) + "\""))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors.endDate").exists());
		postAs("/api/plans", patient, planJson(patientId, start)).andExpect(status().isForbidden());

		String created = postAs("/api/plans", pro.token(), planJson(patientId, start))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.summary.status").value("ACTIVE"))
				.andExpect(jsonPath("$.summary.goalsTotal").value(2))
				.andExpect(jsonPath("$.summary.checklistTotalToday").value(3))
				// Refeições na ordem do dia, mesmo enviadas fora de ordem
				.andExpect(jsonPath("$.meals[*].mealLabel", contains("Café da manhã", "Almoço")))
				.andExpect(jsonPath("$.checklist[0].history", hasSize(7)))
				.andExpect(jsonPath("$.canEdit").value(true))
				.andExpect(jsonPath("$.canCheck").value(false))
				.andReturn().getResponse().getContentAsString();
		Integer planId = JsonPath.read(created, "$.summary.id");
		Integer water = JsonPath.read(created, "$.checklist[0].id");
		Integer exam = JsonPath.read(created, "$.checklist[2].id");
		Integer goal = JsonPath.read(created, "$.goals[0].id");
		verify(emailService).sendPlanNotice(eq(patientEmail), anyString(), eq("Novo plano de ação"), anyString());

		// Paciente vê; outro paciente não
		getAs("/api/plans", patient).andExpect(jsonPath("$[*].id", hasItem(planId)));
		getAs("/api/plans/" + planId, patient)
				.andExpect(jsonPath("$.canCheck").value(true))
				.andExpect(jsonPath("$.canEdit").value(false));
		getAs("/api/plans/" + planId, stranger).andExpect(status().isNotFound());

		// Checklist: hoje e 2 dias atrás; fora da janela, recusado
		String url = "/api/plans/" + planId + "/checklist/" + water + "/";
		putAs(url + today(), patient, "{\"completed\": true}")
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.checklist[0].doneToday").value(true))
				.andExpect(jsonPath("$.summary.checklistDoneToday").value(1));
		putAs(url + today().minusDays(2), patient, "{\"completed\": true}")
				.andExpect(status().isOk())
				// Plano começou há 3 dias: 4 dias contados, água feita em 2 -> 50%
				.andExpect(jsonPath("$.summary.adherence7d").value(50));
		putAs(url + today().plusDays(1), patient, "{\"completed\": true}")
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors.date").exists());
		putAs(url + today().minusDays(10), patient, "{\"completed\": true}").andExpect(status().isBadRequest());
		putAs(url + "nao-e-data", patient, "{\"completed\": true}")
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors.date").value("Data inválida"));
		putAs(url + today(), pro.token(), "{\"completed\": true}").andExpect(status().isForbidden());
		// Item único: feito uma vez, conta como feito
		putAs("/api/plans/" + planId + "/checklist/" + exam + "/" + today().minusDays(1), patient, "{\"completed\": true}")
				.andExpect(jsonPath("$.summary.checklistDoneToday").value(2));

		// Meta cumprida (paciente) e progresso
		putAs("/api/plans/" + planId + "/goals/" + goal, patient, "{\"completed\": true}")
				.andExpect(jsonPath("$.summary.goalsCompleted").value(1))
				.andExpect(jsonPath("$.goals[0].completed").value(true));
		postAs("/api/plans/" + planId + "/progress", patient, "{\"weightKg\": 70.5, \"moodScore\": 4, \"notes\": \"Me sentindo bem\"}")
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.progress", hasSize(1)))
				.andExpect(jsonPath("$.progress[0].weightKg").value(70.5))
				.andExpect(jsonPath("$.progress[0].id").isNumber());
		postAs("/api/plans/" + planId + "/progress", patient, "{}")
				.andExpect(status().isBadRequest());
		postAs("/api/plans/" + planId + "/progress", patient, "{\"moodScore\": 9}")
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors.moodScore").value("Escolha de 1 a 5"));

		// Edição: mantém a água (com id), tira semanal e exame, cria um item novo e tira uma meta
		String edit = """
				{"title": "Reeducação alimentar - fase 2", "startDate": "%s",
				 "goals": [{"id": %d, "description": "Perder 3 kg", "targetValue": 3, "unit": "kg"}],
				 "meals": [{"mealType": "JANTAR", "description": "Sopa de legumes"}],
				 "checklist": [
				   {"id": %d, "description": "Beber 2 litros de água"},
				   {"description": "Dormir 8 horas"}
				 ]}""".formatted(start, goal, water);
		putAs("/api/plans/" + planId, pro.token(), edit)
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.summary.title").value("Reeducação alimentar - fase 2"))
				.andExpect(jsonPath("$.goals", hasSize(1)))
				.andExpect(jsonPath("$.goals[0].completed").value(true)) // a meta mantida continua cumprida
				.andExpect(jsonPath("$.meals", hasSize(1)))
				.andExpect(jsonPath("$.checklist", hasSize(2)))
				.andExpect(jsonPath("$.checklist[0].doneToday").value(true)) // o histórico da água continua
				.andExpect(jsonPath("$.checklist[1].id").isNumber());
		putAs("/api/plans/" + planId, patient, edit).andExpect(status().isForbidden());

		// Pausado: paciente não marca mais
		patchAs("/api/plans/" + planId + "/status", pro.token(), "{\"status\": \"PAUSED\"}")
				.andExpect(jsonPath("$.summary.status").value("PAUSED"));
		putAs(url + today(), patient, "{\"completed\": false}")
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.code").value("PLAN_NOT_ACTIVE"));
		getAs("/api/plans/" + planId, patient).andExpect(jsonPath("$.canCheck").value(false));
	}
}
