package br.com.nutrimente.api.auth;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import br.com.nutrimente.api.IntegrationTest;

/** Regras de cadastro reforçadas na revisão de QA (outubro/2026). */
class ValidationIntegrationTest extends IntegrationTest {

	private String patient(String field, String jsonValue) {
		return patientJson(uniqueEmail(), randomCpf()).replaceFirst("\"" + field + "\": \"[^\"]*\"",
				"\"" + field + "\": " + jsonValue);
	}

	@Test
	@DisplayName("e-mail precisa ter domínio completo (ana@teste é recusado)")
	void emailNeedsDomain() throws Exception {
		postJson("/api/auth/register/patient", patient("email", "\"ana@teste\""))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors.email").value("E-mail inválido"));
	}

	@Test
	@DisplayName("nome: só letras e nome + sobrenome; vazio mostra 'Informe seu nome'")
	void fullName() throws Exception {
		postJson("/api/auth/register/patient", patient("name", "\"Ana 123\""))
				.andExpect(jsonPath("$.errors.name").value("Informe nome e sobrenome, usando só letras"));
		postJson("/api/auth/register/patient", patient("name", "\"Ana\""))
				.andExpect(jsonPath("$.errors.name").value("Informe nome e sobrenome, usando só letras"));
		postJson("/api/auth/register/patient", patient("name", "\"\""))
				.andExpect(jsonPath("$.errors.name").value("Informe seu nome completo"));
	}

	@Test
	@DisplayName("nome é salvo padronizado: '  pedro   DE souza ' vira 'Pedro de Souza'")
	void nameIsNormalized() throws Exception {
		String email = uniqueEmail();
		postJson("/api/auth/register/patient", patientJson(email, randomCpf())
				.replace("\"Maria da Silva\"", "\"  pedro   DE souza \"")).andExpect(status().isCreated());
		track(email);
		String name = jdbc.queryForObject("SELECT name FROM users WHERE email = ?", String.class, email);
		org.assertj.core.api.Assertions.assertThat(name).isEqualTo("Pedro de Souza");
	}

	@Test
	@DisplayName("celular: recusa fixo, DDD inexistente e número repetido; vazio pede para informar")
	void celular() throws Exception {
		for (String phone : new String[] { "\"(11) 3333-4444\"", "\"20988887777\"", "\"11111111111\"" }) {
			postJson("/api/auth/register/patient", patient("telephone", phone))
					.andExpect(status().isBadRequest())
					.andExpect(jsonPath("$.errors.telephone").value(org.hamcrest.Matchers.startsWith("Celular inválido")));
		}
		postJson("/api/auth/register/patient", patient("telephone", "\"\""))
				.andExpect(jsonPath("$.errors.telephone").value("Informe seu celular"));
	}

	@Test
	@DisplayName("nascimento no futuro ou com mais de 120 anos: 'Data de nascimento inválida'")
	void birthDateMessages() throws Exception {
		postJson("/api/auth/register/patient", patient("birthDate", "\"2090-01-01\""))
				.andExpect(jsonPath("$.errors.birthDate").value("Data de nascimento inválida"));
		postJson("/api/auth/register/patient", patient("birthDate", "\"1896-01-01\""))
				.andExpect(jsonPath("$.errors.birthDate").value("Data de nascimento inválida"));
	}

	@Test
	@DisplayName("data ou gênero em formato errado apontam o campo")
	void unreadableFieldsPointToField() throws Exception {
		postJson("/api/auth/register/patient", patient("birthDate", "\"31/02/1990\""))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors.birthDate").value("Data inválida"));
		postJson("/api/auth/register/patient", patient("gender", "\"XYZ\""))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors.gender").value("Opção inválida"));
	}

	@Test
	@DisplayName("número do conselho conforme a profissão, salvo padronizado")
	void councilNumberByProfession() throws Exception {
		postJson("/api/auth/register/professional", professionalJson(uniqueEmail(), randomCpf(), "PSICOLOGO", "CRN-3 12345"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors.documentProfessional").value(org.hamcrest.Matchers.startsWith("CRP inválido")));
		postJson("/api/auth/register/professional", professionalJson(uniqueEmail(), randomCpf(), "NUTRICIONISTA", "12-12345"))
				.andExpect(jsonPath("$.errors.documentProfessional").value(org.hamcrest.Matchers.startsWith("CRN inválido")));

		String email = uniqueEmail();
		String number = String.valueOf(100000 + (int) (Math.random() * 899999));
		postJson("/api/auth/register/professional", professionalJson(email, randomCpf(), "PSICOLOGO", "crp 6/" + number))
				.andExpect(status().isCreated());
		track(email);
		String saved = jdbc.queryForObject("SELECT p.document_professional FROM professionals p JOIN users u ON u.id = p.user_id WHERE u.email = ?",
				String.class, email);
		org.assertj.core.api.Assertions.assertThat(saved).isEqualTo("06/" + number);
	}

	@Test
	@DisplayName("admin só recusa com motivo, e o motivo vai no e-mail")
	void rejectNeedsReason() throws Exception {
		String email = uniqueEmail();
		registerVerifiedProfessional(email, "NUTRICIONISTA", randomDocument());
		Long id = jdbc.queryForObject("SELECT id FROM users WHERE email = ?", Long.class, email);
		String admin = createAdminAndLogin();

		patchAs("/api/admin/professionals/" + id + "/verification", admin, "{\"status\": \"REJECTED\"}")
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors.reason").value("Informe o motivo da recusa"));
		patchAs("/api/admin/professionals/" + id + "/verification", admin,
				"{\"status\": \"REJECTED\", \"reason\": \"CRN não encontrado no CFN\"}")
				.andExpect(status().isOk());
		verify(emailService).sendProfessionalReviewed(eq(email), anyString(), eq(false), eq("CRN não encontrado no CFN"));
	}
}
