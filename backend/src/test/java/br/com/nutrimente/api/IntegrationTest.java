package br.com.nutrimente.api;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

import org.junit.jupiter.api.AfterEach;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import com.jayway.jsonpath.JsonPath;

import br.com.nutrimente.api.logging.LogClient;
import br.com.nutrimente.api.notification.EmailService;

/**
 * Base dos testes de integração.
 *
 * - @SpringBootTest sobe a API inteira (controllers, segurança, JPA).
 * - MockMvc faz requisições HTTP "de mentira", sem abrir porta, mas passando
 *   por TODOS os filtros (inclusive o de segurança/JWT).
 * - O banco é o SQL Server REAL do docker compose.
 * - @MockitoBean troca o envio de e-mail e de logs por "dublês": nada sai de
 *   verdade, e o teste consegue pegar o token que iria no e-mail.
 * - Cada teste registra os usuários que criou e @AfterEach apaga tudo
 *   (as tabelas filhas somem junto por ON DELETE CASCADE).
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public abstract class IntegrationTest {

	protected static final String PASSWORD = "Senha1234";

	@Autowired
	protected MockMvc mvc;

	@Autowired
	protected JdbcTemplate jdbc;

	@Autowired
	private PasswordEncoder passwordEncoder;

	@MockitoBean
	protected EmailService emailService;

	@MockitoBean
	protected LogClient logClient;

	private final List<Long> createdUsers = new ArrayList<>();

	@AfterEach
	void cleanUp() {
		createdUsers.forEach(id -> jdbc.update("DELETE FROM users WHERE id = ?", id));
		createdUsers.clear();
	}

	// ---------------- Dados de teste ----------------

	protected static String uniqueEmail() {
		return "it-" + UUID.randomUUID().toString().substring(0, 12) + "@teste.local";
	}

	/** Gera um CPF válido e aleatório (com os dígitos verificadores certos) */
	protected static String randomCpf() {
		int[] d = new int[11];
		for (int i = 0; i < 9; i++) {
			d[i] = ThreadLocalRandom.current().nextInt(10);
		}
		d[9] = checkDigit(d, 9);
		d[10] = checkDigit(d, 10);
		StringBuilder cpf = new StringBuilder();
		for (int digit : d) {
			cpf.append(digit);
		}
		return cpf.toString();
	}

	private static int checkDigit(int[] d, int length) {
		int sum = 0;
		for (int i = 0; i < length; i++) {
			sum += d[i] * (length + 1 - i);
		}
		int rest = (sum * 10) % 11;
		return rest == 10 ? 0 : rest;
	}

	protected static String patientJson(String email, String cpf) {
		return """
				{"name": "Maria da Silva", "email": "%s", "password": "%s", "cpf": "%s",
				 "birthDate": "1990-05-10", "telephone": "(11) 98888-7777", "gender": "FEMALE",
				 "acceptTerms": true, "acceptHealthData": true}
				""".formatted(email, PASSWORD, cpf);
	}

	protected static String professionalJson(String email, String cpf, String type, String document) {
		return """
				{"name": "João Pereira", "email": "%s", "password": "%s", "cpf": "%s",
				 "birthDate": "1985-01-20", "telephone": "11977776666", "professionalType": "%s",
				 "documentProfessional": "%s", "bio": "Atendo adultos.", "acceptTerms": true}
				""".formatted(email, PASSWORD, cpf, type, document);
	}

	// ---------------- Fluxos prontos ----------------

	protected ResultActions postJson(String url, String json) throws Exception {
		return mvc.perform(post(url).contentType(MediaType.APPLICATION_JSON).content(json));
	}

	protected ResultActions send(MockHttpServletRequestBuilder request, String token, String json) throws Exception {
		if (token != null) {
			request.header("Authorization", "Bearer " + token);
		}
		if (json != null) {
			request.contentType(MediaType.APPLICATION_JSON).content(json);
		}
		return mvc.perform(request);
	}

	protected ResultActions getAs(String url, String token) throws Exception {
		return send(get(url), token, null);
	}

	protected ResultActions putAs(String url, String token, String json) throws Exception {
		return send(put(url), token, json);
	}

	protected ResultActions postAs(String url, String token, String json) throws Exception {
		return send(post(url), token, json);
	}

	protected ResultActions patchAs(String url, String token, String json) throws Exception {
		return send(patch(url), token, json);
	}

	protected ResultActions deleteAs(String url, String token, String json) throws Exception {
		return send(delete(url), token, json);
	}

	/** Guarda o id do usuário criado para apagar no fim do teste */
	protected Long track(String email) {
		Long id = jdbc.queryForObject("SELECT id FROM users WHERE email = ?", Long.class, email);
		createdUsers.add(id);
		return id;
	}

	/** Pega o token que teria ido no e-mail de confirmação */
	protected String capturedVerificationToken(String email) {
		ArgumentCaptor<String> token = ArgumentCaptor.forClass(String.class);
		verify(emailService).sendEmailVerification(eq(email), anyString(), token.capture());
		return token.getValue();
	}

	protected String capturedResetToken(String email) {
		ArgumentCaptor<String> token = ArgumentCaptor.forClass(String.class);
		verify(emailService).sendPasswordReset(eq(email), anyString(), token.capture());
		return token.getValue();
	}

	protected String login(String email, String password) throws Exception {
		String body = postJson("/api/auth/login", """
				{"email": "%s", "password": "%s"}""".formatted(email, password))
				.andReturn().getResponse().getContentAsString();
		return JsonPath.read(body, "$.accessToken");
	}

	/** Cadastro + confirmação de e-mail + login: devolve o token */
	protected String registerVerifiedPatient(String email) throws Exception {
		postJson("/api/auth/register/patient", patientJson(email, randomCpf()));
		track(email);
		postJson("/api/auth/verify-email", "{\"token\": \"%s\"}".formatted(capturedVerificationToken(email)));
		return login(email, PASSWORD);
	}

	protected String registerVerifiedProfessional(String email, String type, String document) throws Exception {
		postJson("/api/auth/register/professional", professionalJson(email, randomCpf(), type, document));
		track(email);
		postJson("/api/auth/verify-email", "{\"token\": \"%s\"}".formatted(capturedVerificationToken(email)));
		return login(email, PASSWORD);
	}

	/** Cria um ADMIN direto no banco (não existe cadastro público de admin) e faz login */
	protected String createAdminAndLogin() throws Exception {
		String email = uniqueEmail();
		jdbc.update("INSERT INTO users (name, email, password_hash, role, email_verified) VALUES (?, ?, ?, 'ADMIN', 1)",
				"Admin de Teste", email, passwordEncoder.encode(PASSWORD));
		track(email);
		return login(email, PASSWORD);
	}

	protected static String randomDocument() {
		return ThreadLocalRandom.current().nextInt(1, 10) + "-" + ThreadLocalRandom.current().nextInt(10000, 99999);
	}
}
