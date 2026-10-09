package br.com.nutrimente.api.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Map;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import br.com.nutrimente.api.IntegrationTest;

/** CPF, telefone e nascimento cifrados no banco (V007); CPF único pelo índice cego */
class PersonalDataEncryptionIntegrationTest extends IntegrationTest {

	@Autowired
	private LegacyPersonalDataEncryptor legacyEncryptor;

	private Map<String, Object> row(String email) {
		return jdbc.queryForMap("SELECT cpf, cpf_hash, telephone, birth_date FROM users WHERE email = ?", email);
	}

	@Test
	@DisplayName("cadastro grava CPF, telefone e nascimento cifrados; a API devolve os valores abertos; CPF repetido é barrado")
	void encryptedOnRegister() throws Exception {
		String cpf = randomCpf();
		String email = uniqueEmail();
		postJson("/api/auth/register/patient", patientJson(email, cpf)).andExpect(status().isCreated());
		track(email);

		Map<String, Object> stored = row(email);
		assertThat((String) stored.get("cpf")).startsWith("v1:").doesNotContain(cpf);
		assertThat((String) stored.get("telephone")).startsWith("v1:");
		assertThat((String) stored.get("birth_date")).startsWith("v1:").doesNotContain("1990");
		assertThat((String) stored.get("cpf_hash")).matches("[0-9a-f]{64}");

		// Mesmo CPF com outro e-mail: barrado pelo índice cego
		postJson("/api/auth/register/patient", patientJson(uniqueEmail(), cpf))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.errors.cpf").value("Este CPF já está cadastrado"));

		postJson("/api/auth/verify-email", "{\"token\": \"%s\"}".formatted(capturedVerificationToken(email)));
		getAs("/api/me", login(email, PASSWORD))
				.andExpect(jsonPath("$.cpfMasked").value("***." + cpf.substring(3, 6) + "." + cpf.substring(6, 9) + "-**"))
				.andExpect(jsonPath("$.birthDate").value("1990-05-10"))
				.andExpect(jsonPath("$.telephone").value("11988887777"));
	}

	@Test
	@DisplayName("registro antigo (aberto, sem cpf_hash) continua legível e é cifrado quando a API liga")
	void legacyRowsAreEncrypted() throws Exception {
		String email = uniqueEmail();
		String token = registerVerifiedPatient(email);
		Long userId = jdbc.queryForObject("SELECT id FROM users WHERE email = ?", Long.class, email);
		String cpf = randomCpf();
		// Simula um usuário gravado antes da V007: tudo aberto e sem índice cego
		jdbc.update("UPDATE users SET cpf = ?, cpf_hash = NULL, telephone = '21977776666', birth_date = '1985-01-20'"
				+ " WHERE email = ?", cpf, email);

		// Antes da conversão, a API já lê o valor aberto
		getAs("/api/me", token).andExpect(jsonPath("$.birthDate").value("1985-01-20"));

		assertThat(legacyEncryptor.encryptPending(userId)).isEqualTo(1);
		Map<String, Object> stored = row(email);
		assertThat((String) stored.get("cpf")).startsWith("v1:");
		assertThat((String) stored.get("telephone")).startsWith("v1:");
		assertThat((String) stored.get("birth_date")).startsWith("v1:");
		assertThat((String) stored.get("cpf_hash")).matches("[0-9a-f]{64}");
		assertThat(legacyEncryptor.encryptPending(userId)).isZero(); // idempotente

		getAs("/api/me", token)
				.andExpect(jsonPath("$.birthDate").value("1985-01-20"))
				.andExpect(jsonPath("$.telephone").value("21977776666"));
		// O CPF convertido passa a ser barrado em novos cadastros
		postJson("/api/auth/register/patient", patientJson(uniqueEmail(), cpf))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.errors.cpf").exists());
	}
}
