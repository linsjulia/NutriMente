package br.com.nutrimente.api.auth;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import br.com.nutrimente.api.IntegrationTest;

/** Limite por IP nas rotas de autenticação (aqui com limite baixo: 3 por minuto). */
@TestPropertySource(properties = "nutrimente.rate-limit.auth-requests-per-minute=3")
class RateLimitIntegrationTest extends IntegrationTest {

	private static MockHttpServletRequestBuilder loginFrom(String ip) {
		return post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
				.content("{\"email\": \"ninguem@teste.local\", \"password\": \"x\"}")
				.with(request -> {
					request.setRemoteAddr(ip);
					return request;
				});
	}

	@Test
	@DisplayName("passou do limite: 429 com Retry-After; outro IP continua liberado")
	void limitsPerIp() throws Exception {
		for (int i = 0; i < 3; i++) {
			mvc.perform(loginFrom("203.0.113.10")).andExpect(status().isUnauthorized());
		}
		mvc.perform(loginFrom("203.0.113.10"))
				.andExpect(status().isTooManyRequests())
				.andExpect(header().exists("Retry-After"))
				.andExpect(jsonPath("$.code").value("RATE_LIMITED"));

		mvc.perform(loginFrom("203.0.113.20")).andExpect(status().isUnauthorized());
	}

	@Test
	@DisplayName("rotas fora de /api/auth não são limitadas")
	void otherRoutesAreNotLimited() throws Exception {
		for (int i = 0; i < 5; i++) {
			mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/professionals")
					.with(request -> {
						request.setRemoteAddr("203.0.113.30");
						return request;
					})).andExpect(status().isOk());
		}
	}
}
