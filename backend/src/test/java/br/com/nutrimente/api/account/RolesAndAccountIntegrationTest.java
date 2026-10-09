package br.com.nutrimente.api.account;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import br.com.nutrimente.api.IntegrationTest;

/** Permissões por papel (PATIENT, PROFESSIONAL, ADMIN) e o CRUD da própria conta. */
class RolesAndAccountIntegrationTest extends IntegrationTest {

	@Test
	@DisplayName("sem token: rotas protegidas respondem 401")
	void unauthenticated() throws Exception {
		getAs("/api/me", null).andExpect(status().isUnauthorized());
		getAs("/api/me", "token-falso").andExpect(status().isUnauthorized());
		getAs("/api/admin/professionals", null).andExpect(status().isUnauthorized());
	}

	@Test
	@DisplayName("paciente não acessa área de profissional nem de admin (403)")
	void patientPermissions() throws Exception {
		String token = registerVerifiedPatient(uniqueEmail());

		putAs("/api/me/professional-profile", token, "{\"bio\": \"x\"}")
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.code").value("FORBIDDEN"));
		getAs("/api/admin/professionals", token).andExpect(status().isForbidden());
	}

	@Test
	@DisplayName("profissional: cadastro fica PENDENTE e só aparece na busca depois da aprovação do admin")
	void professionalApprovalFlow() throws Exception {
		String email = uniqueEmail();
		String token = registerVerifiedProfessional(email, "PSICOLOGO", "06/" + (100000 + (int) (Math.random() * 899999)));
		Long id = jdbc.queryForObject("SELECT id FROM users WHERE email = ?", Long.class, email);

		getAs("/api/me", token)
				.andExpect(jsonPath("$.role").value("PROFESSIONAL"))
				.andExpect(jsonPath("$.professional.verificationStatus").value("PENDING"));
		getAs("/api/professionals/" + id, null).andExpect(status().isNotFound());
		// Profissional também não entra na área de admin
		getAs("/api/admin/professionals", token).andExpect(status().isForbidden());

		String admin = createAdminAndLogin();
		getAs("/api/admin/professionals?status=PENDING&size=50", admin)
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.items[*].id").value(hasItem(id.intValue())));

		patchAs("/api/admin/professionals/" + id + "/verification", admin, "{\"status\": \"APPROVED\"}")
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("APPROVED"));
		verify(emailService).sendProfessionalReviewed(eq(email), anyString(), eq(true), isNull());

		// Agora é público, sem dados pessoais
		getAs("/api/professionals/" + id, null)
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.type").value("PSICOLOGO"))
				.andExpect(jsonPath("$.email").doesNotExist())
				.andExpect(jsonPath("$.cpf").doesNotExist());
		getAs("/api/professionals?type=NUTRICIONISTA&size=50", null)
				.andExpect(jsonPath("$.items[*].id").value(not(hasItem(id.intValue()))));

		// Profissional completa o perfil
		putAs("/api/me/professional-profile", token, "{\"bio\": \"Ansiedade e TCC\", \"consultationPrice\": 150.00}")
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.professional.consultationPrice").value(150.00));
	}

	@Test
	@DisplayName("mesmo CRN não pode ser cadastrado duas vezes")
	void duplicatedCouncilNumber() throws Exception {
		String document = randomDocument();
		String email = uniqueEmail();
		postJson("/api/auth/register/professional", professionalJson(email, randomCpf(), "NUTRICIONISTA", document))
				.andExpect(status().isCreated());
		track(email);
		postJson("/api/auth/register/professional", professionalJson(uniqueEmail(), randomCpf(), "NUTRICIONISTA", document))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.errors.documentProfessional").value("Este CRN já está cadastrado"));
	}

	@Test
	@DisplayName("minha conta: ler (CPF mascarado), editar e trocar a senha")
	void accountCrud() throws Exception {
		String email = uniqueEmail();
		String token = registerVerifiedPatient(email);

		getAs("/api/me", token)
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.email").value(email))
				.andExpect(jsonPath("$.cpfMasked").value(org.hamcrest.Matchers.matchesPattern("\\*\\*\\*\\.\\d{3}\\.\\d{3}-\\*\\*")))
				.andExpect(jsonPath("$.cpf").doesNotExist())
				.andExpect(jsonPath("$.professional").doesNotExist());

		putAs("/api/me", token, "{\"name\": \"Maria Souza\", \"telephone\": \"(21) 99999-0000\", \"gender\": \"UNDISCLOSED\"}")
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.name").value("Maria Souza"))
				.andExpect(jsonPath("$.telephone").value("21999990000"));

		putAs("/api/me/password", token, "{\"currentPassword\": \"errada\", \"newPassword\": \"NovaSenha99\"}")
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors.currentPassword").exists());
		// Outra sessão aberta (ex.: o celular) antes da troca
		String otherDevice = login(email, PASSWORD);
		String body = putAs("/api/me/password", token,
				"{\"currentPassword\": \"%s\", \"newPassword\": \"NovaSenha99\"}".formatted(PASSWORD))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.accessToken").isNotEmpty())
				.andExpect(jsonPath("$.user.email").doesNotExist())
				.andReturn().getResponse().getContentAsString();
		String newToken = com.jayway.jsonpath.JsonPath.read(body, "$.accessToken");

		// Trocar a senha encerra TODAS as sessões antigas; o token novo vale
		getAs("/api/me", token).andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.code").value("SESSION_INVALID"));
		getAs("/api/me", otherDevice).andExpect(status().isUnauthorized());
		getAs("/api/me", newToken).andExpect(status().isOk());
		getAs("/api/me", login(email, "NovaSenha99")).andExpect(status().isOk());
	}

	@Test
	@DisplayName("401 em JSON: sem token = UNAUTHORIZED; token adulterado = SESSION_INVALID")
	void unauthorizedJson() throws Exception {
		getAs("/api/me", null).andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
		getAs("/api/me", "abc.def.ghi").andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.code").value("SESSION_INVALID"));
	}

	@Test
	@DisplayName("excluir conta anonimiza os dados e invalida o login")
	void deleteAccount() throws Exception {
		String email = uniqueEmail();
		String token = registerVerifiedPatient(email);
		Long id = jdbc.queryForObject("SELECT id FROM users WHERE email = ?", Long.class, email);

		deleteAs("/api/me", token, "{\"password\": \"errada\"}").andExpect(status().isBadRequest());
		deleteAs("/api/me", token, "{\"password\": \"%s\"}".formatted(PASSWORD)).andExpect(status().isNoContent());

		var row = jdbc.queryForMap("SELECT name, email, cpf, telephone, password_hash, deleted_at FROM users WHERE id = ?", id);
		org.assertj.core.api.Assertions.assertThat(row.get("name")).isEqualTo("Usuário removido");
		org.assertj.core.api.Assertions.assertThat(row.get("cpf")).isNull();
		org.assertj.core.api.Assertions.assertThat(row.get("password_hash")).isNull();
		org.assertj.core.api.Assertions.assertThat(row.get("deleted_at")).isNotNull();

		// O token antigo ainda é "válido" na assinatura, mas a conta não existe mais
		getAs("/api/me", token).andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.code").value("SESSION_INVALID"));
		postJson("/api/auth/login", "{\"email\": \"%s\", \"password\": \"%s\"}".formatted(email, PASSWORD))
				.andExpect(status().isUnauthorized());
	}
}
