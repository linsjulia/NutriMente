package br.com.nutrimente.api.intake;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Duration;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import br.com.nutrimente.api.IntegrationTest;

/** Questionário inicial: o paciente responde; só o profissional que o atende lê; textos cifrados no banco */
class IntakeIntegrationTest extends IntegrationTest {

	private static final String ANSWERS = """
			{"goals": ["EMAGRECER", "SONO", "EMAGRECER"], "mealsPerDay": 4, "waterLitersPerDay": 1.5,
			 "activityLevel": "LEVE", "sleepQuality": 2, "stressLevel": 4,
			 "dietaryRestrictions": "  Intolerância à lactose  ", "healthConditions": "Hipotireoidismo",
			 "expectations": "Comer melhor sem dieta restritiva"}""";

	@Test
	@DisplayName("questionário: paciente responde e edita; /api/me avisa se falta; validação com mensagens no campo")
	void patientAnswers() throws Exception {
		String email = uniqueEmail();
		String patient = registerVerifiedPatient(email);
		Long patientId = jdbc.queryForObject("SELECT id FROM users WHERE email = ?", Long.class, email);

		getAs("/api/me", patient).andExpect(jsonPath("$.intakeCompleted").value(false));
		getAs("/api/me/intake", patient).andExpect(status().isNotFound())
				.andExpect(jsonPath("$.code").value("INTAKE_NOT_ANSWERED"));

		putAs("/api/me/intake", patient, """
				{"goals": [], "mealsPerDay": 0, "waterLitersPerDay": 1.55, "sleepQuality": 9, "stressLevel": 3}""")
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors.goals").value("Escolha pelo menos um objetivo"))
				.andExpect(jsonPath("$.errors.mealsPerDay").value("Informe de 1 a 10 refeições"))
				.andExpect(jsonPath("$.errors.waterLitersPerDay").exists())
				.andExpect(jsonPath("$.errors.activityLevel").value("Escolha seu nível de atividade física"))
				.andExpect(jsonPath("$.errors.sleepQuality").value("Avalie seu sono de 1 a 5"));
		putAs("/api/me/intake", patient, ANSWERS.replace("\"SONO\"", "\"VOAR\""))
				.andExpect(status().isBadRequest());

		putAs("/api/me/intake", patient, ANSWERS)
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.goals.length()").value(2)) // EMAGRECER repetido conta uma vez
				.andExpect(jsonPath("$.goals[0]").value("EMAGRECER"))
				.andExpect(jsonPath("$.dietaryRestrictions").value("Intolerância à lactose"))
				.andExpect(jsonPath("$.waterLitersPerDay").value(1.5));
		getAs("/api/me", patient).andExpect(jsonPath("$.intakeCompleted").value(true));

		// No banco, os textos livres ficam cifrados
		String stored = jdbc.queryForObject("SELECT health_conditions FROM patient_intakes WHERE patient_id = ?",
				String.class, patientId);
		assertThat(stored).startsWith("v1:").doesNotContain("Hipotireoidismo");

		// Editar substitui as respostas
		putAs("/api/me/intake", patient, ANSWERS.replace("\"stressLevel\": 4", "\"stressLevel\": 2"))
				.andExpect(jsonPath("$.stressLevel").value(2));
		verify(logClient).audit(eq(patientId), eq("PATIENT"), eq("CREATE"), eq("patient_intakes"), eq(patientId),
				eq(patientId));
	}

	@Test
	@DisplayName("questionário: só o profissional que atende o paciente lê (leitura auditada)")
	void professionalReads() throws Exception {
		String admin = createAdminAndLogin();
		Pro pro = readyProfessional(admin);
		Pro other = readyProfessional(admin);
		String email = uniqueEmail();
		String patient = registerVerifiedPatient(email);
		Long patientId = jdbc.queryForObject("SELECT id FROM users WHERE email = ?", Long.class, email);
		putAs("/api/me/intake", patient, ANSWERS).andExpect(status().isOk());

		String url = "/api/patients/" + patientId + "/intake";
		// Sem consulta entre eles: o paciente "não existe" para o profissional
		getAs(url, pro.token()).andExpect(status().isNotFound());

		book(patient, pro.id(), slotAfter(pro.id(), Duration.ofHours(30)));
		getAs(url, pro.token())
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.healthConditions").value("Hipotireoidismo"))
				.andExpect(jsonPath("$.activityLevel").value("LEVE"));
		getAs(url, other.token()).andExpect(status().isNotFound());
		verify(logClient).audit(eq(pro.id()), eq("PROFESSIONAL"), eq("READ"), eq("patient_intakes"), eq(patientId),
				eq(patientId));

		// Papéis: o profissional não responde questionário; o paciente não lê o de outros
		putAs("/api/me/intake", pro.token(), ANSWERS).andExpect(status().isForbidden());
		getAs(url, patient).andExpect(status().isForbidden());
		getAs("/api/me", pro.token()).andExpect(jsonPath("$.intakeCompleted").doesNotExist());
	}
}
