package br.com.nutrimente.api.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.jayway.jsonpath.JsonPath;

import br.com.nutrimente.api.IntegrationTest;

/** Cadastro, confirmação de e-mail, login e redefinição de senha. */
class AuthIntegrationTest extends IntegrationTest {

	@Test
	@DisplayName("cadastro de paciente -> confirmação de e-mail -> login")
	void patientSignupFlow() throws Exception {
		String email = uniqueEmail();

		postJson("/api/auth/register/patient", patientJson(email, randomCpf()))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.message").value(containsString("confirmação")));
		track(email);

		// Antes de confirmar o e-mail, o login é barrado com um código específico
		postJson("/api/auth/login", "{\"email\": \"%s\", \"password\": \"%s\"}".formatted(email, PASSWORD))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.code").value("EMAIL_NOT_VERIFIED"));

		String token = capturedVerificationToken(email);
		postJson("/api/auth/verify-email", "{\"token\": \"%s\"}".formatted(token))
				.andExpect(status().isOk());
		// O mesmo link não funciona duas vezes
		postJson("/api/auth/verify-email", "{\"token\": \"%s\"}".formatted(token))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.code").value("INVALID_TOKEN"));

		// E-mail em maiúsculas também funciona (normalização)
		postJson("/api/auth/login", "{\"email\": \"%s\", \"password\": \"%s\"}".formatted(email.toUpperCase(), PASSWORD))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.accessToken").value(notNullValue()))
				.andExpect(jsonPath("$.user.role").value("PATIENT"))
				.andExpect(jsonPath("$.user.name").value("Maria da Silva"));
	}

	@Test
	@DisplayName("cadastro valida CPF, idade, senha, termos e duplicidade")
	void signupValidation() throws Exception {
		postJson("/api/auth/register/patient", """
				{"name": "Ab", "email": "nao-e-email", "password": "curta", "cpf": "123.456.789-00",
				 "birthDate": "2015-01-01", "telephone": "123", "acceptTerms": false, "acceptHealthData": false}
				""")
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
				.andExpect(jsonPath("$.errors.name").exists())
				.andExpect(jsonPath("$.errors.email").value("E-mail inválido"))
				.andExpect(jsonPath("$.errors.password").exists())
				.andExpect(jsonPath("$.errors.cpf").value("CPF inválido"))
				.andExpect(jsonPath("$.errors.birthDate").value("É preciso ter 18 anos ou mais"))
				.andExpect(jsonPath("$.errors.telephone").exists())
				.andExpect(jsonPath("$.errors.acceptTerms").exists())
				.andExpect(jsonPath("$.errors.acceptHealthData").exists());

		String email = uniqueEmail();
		String cpf = randomCpf();
		postJson("/api/auth/register/patient", patientJson(email, cpf)).andExpect(status().isCreated());
		track(email);
		// Duplicidade vale para contas confirmadas (as pendentes são liberadas: ver pendingSignupIsReleased)
		postJson("/api/auth/verify-email", "{\"token\": \"%s\"}".formatted(capturedVerificationToken(email)))
				.andExpect(status().isOk());

		postJson("/api/auth/register/patient", patientJson(email, randomCpf()))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.errors.email").value("Este e-mail já está cadastrado"));
		postJson("/api/auth/register/patient", patientJson(uniqueEmail(), cpf))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.errors.cpf").value("Este CPF já está cadastrado"));
	}

	@Test
	@DisplayName("cadastro que nunca confirmou o e-mail não prende o CPF nem o e-mail")
	void pendingSignupIsReleased() throws Exception {
		String cpf = randomCpf();
		String firstEmail = uniqueEmail();
		postJson("/api/auth/register/patient", patientJson(firstEmail, cpf)).andExpect(status().isCreated());
		Long first = track(firstEmail);

		// Desistiu de confirmar e se cadastrou de novo com outro e-mail e o mesmo CPF
		String secondEmail = uniqueEmail();
		postJson("/api/auth/register/patient", patientJson(secondEmail, cpf)).andExpect(status().isCreated());
		track(secondEmail);
		// O cadastro antigo foi anonimizado (como na exclusão de conta)
		assertThat(jdbc.queryForObject("SELECT email FROM users WHERE id = ?", String.class, first))
				.startsWith("removido-");
		assertThat(jdbc.queryForObject("SELECT cpf_hash FROM users WHERE id = ?", String.class, first)).isNull();

		// O mesmo vale para o e-mail: refazer o cadastro com ele (ex.: outra senha) funciona
		postJson("/api/auth/register/patient", patientJson(secondEmail, randomCpf())).andExpect(status().isCreated());
		track(secondEmail);
		assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM users WHERE email = ?", Integer.class, secondEmail))
				.isEqualTo(1);

		// Profissional pendente libera também o número do conselho
		String proEmail = uniqueEmail();
		String proCpf = randomCpf();
		String document = randomDocument();
		postJson("/api/auth/register/professional", professionalJson(proEmail, proCpf, "NUTRICIONISTA", document))
				.andExpect(status().isCreated());
		track(proEmail);
		String proEmail2 = uniqueEmail();
		postJson("/api/auth/register/professional", professionalJson(proEmail2, proCpf, "NUTRICIONISTA", document))
				.andExpect(status().isCreated());
		track(proEmail2);
	}

	@Test
	@DisplayName("confirmar o e-mail já abre a sessão")
	void verifyEmailStartsSession() throws Exception {
		String email = uniqueEmail();
		postJson("/api/auth/register/patient", patientJson(email, randomCpf())).andExpect(status().isCreated());
		track(email);

		String body = postJson("/api/auth/verify-email", "{\"token\": \"%s\"}".formatted(capturedVerificationToken(email)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value(containsString("confirmado")))
				.andExpect(jsonPath("$.user.role").value("PATIENT"))
				.andReturn().getResponse().getContentAsString();
		String token = JsonPath.read(body, "$.accessToken");
		getAs("/api/me", token).andExpect(status().isOk()).andExpect(jsonPath("$.email").value(email));
	}

	@Test
	@DisplayName("ticket do cadastro: espera a confirmação e então abre a sessão uma única vez")
	void registrationTicket() throws Exception {
		String email = uniqueEmail();
		String body = postJson("/api/auth/register/patient", patientJson(email, randomCpf()))
				.andExpect(status().isCreated())
				.andReturn().getResponse().getContentAsString();
		track(email);
		String ticket = JsonPath.read(body, "$.registrationTicket");
		String ticketJson = "{\"ticket\": \"%s\"}".formatted(ticket);

		// Ainda não confirmou: 204 (a tela pergunta de novo depois)
		postJson("/api/auth/registration-session", ticketJson).andExpect(status().isNoContent());

		postJson("/api/auth/verify-email", "{\"token\": \"%s\"}".formatted(capturedVerificationToken(email)))
				.andExpect(status().isOk());

		postJson("/api/auth/registration-session", ticketJson)
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.accessToken").value(notNullValue()))
				.andExpect(jsonPath("$.user.role").value("PATIENT"));
		// Uso único
		postJson("/api/auth/registration-session", ticketJson)
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.code").value("INVALID_TOKEN"));
		// Ticket inventado
		postJson("/api/auth/registration-session", "{\"ticket\": \"nao-existe\"}")
				.andExpect(status().isBadRequest());
	}

	@Test
	@DisplayName("ninguém consegue se cadastrar como ADMIN pelo JSON")
	void cannotEscalateRole() throws Exception {
		String email = uniqueEmail();
		String json = patientJson(email, randomCpf()).replace("{\"name\"", "{\"role\": \"ADMIN\", \"name\"");
		postJson("/api/auth/register/patient", json).andExpect(status().isCreated());
		track(email);
		String role = jdbc.queryForObject("SELECT role FROM users WHERE email = ?", String.class, email);
		org.assertj.core.api.Assertions.assertThat(role).isEqualTo("PATIENT");
	}

	@Test
	@DisplayName("login errado não revela se o e-mail existe")
	void loginDoesNotLeakAccounts() throws Exception {
		String email = uniqueEmail();
		registerVerifiedPatient(email);

		String unknown = postJson("/api/auth/login", "{\"email\": \"ninguem@teste.local\", \"password\": \"x\"}")
				.andExpect(status().isUnauthorized()).andReturn().getResponse().getContentAsString();
		String wrong = postJson("/api/auth/login", "{\"email\": \"%s\", \"password\": \"errada\"}".formatted(email))
				.andExpect(status().isUnauthorized()).andReturn().getResponse().getContentAsString();

		org.assertj.core.api.Assertions.assertThat(unknown).isEqualTo(wrong);
	}

	@Test
	@DisplayName("5 senhas erradas bloqueiam a conta, mesmo com a senha certa depois")
	void lockAfterFailedLogins() throws Exception {
		String email = uniqueEmail();
		registerVerifiedPatient(email);

		for (int i = 0; i < 5; i++) {
			postJson("/api/auth/login", "{\"email\": \"%s\", \"password\": \"errada\"}".formatted(email))
					.andExpect(status().isUnauthorized());
		}
		postJson("/api/auth/login", "{\"email\": \"%s\", \"password\": \"%s\"}".formatted(email, PASSWORD))
				.andExpect(status().isLocked())
				.andExpect(jsonPath("$.code").value("ACCOUNT_LOCKED"));
	}

	@Test
	@DisplayName("esqueci a senha -> link -> nova senha; a antiga deixa de funcionar")
	void passwordReset() throws Exception {
		String email = uniqueEmail();
		registerVerifiedPatient(email);

		postJson("/api/auth/forgot-password", "{\"email\": \"%s\"}".formatted(email))
				.andExpect(status().isAccepted());
		String token = capturedResetToken(email);

		String oldSession = login(email, PASSWORD);
		postJson("/api/auth/reset-password", "{\"token\": \"%s\", \"password\": \"NovaSenha99\"}".formatted(token))
				.andExpect(status().isOk());
		// Redefinir a senha também derruba as sessões abertas (ex.: de quem descobriu a senha antiga)
		getAs("/api/me", oldSession).andExpect(status().isUnauthorized());
		postJson("/api/auth/login", "{\"email\": \"%s\", \"password\": \"%s\"}".formatted(email, PASSWORD))
				.andExpect(status().isUnauthorized());
		postJson("/api/auth/login", "{\"email\": \"%s\", \"password\": \"NovaSenha99\"}".formatted(email))
				.andExpect(status().isOk());
		// Link já usado
		postJson("/api/auth/reset-password", "{\"token\": \"%s\", \"password\": \"OutraSenha99\"}".formatted(token))
				.andExpect(status().isBadRequest());
	}

	@Test
	@DisplayName("esqueci a senha com e-mail inexistente responde igual (não revela contas)")
	void forgotPasswordUnknownEmail() throws Exception {
		postJson("/api/auth/forgot-password", "{\"email\": \"ninguem@teste.local\"}")
				.andExpect(status().isAccepted())
				.andExpect(jsonPath("$.message").value(containsString("Se houver uma conta")));
	}
}
