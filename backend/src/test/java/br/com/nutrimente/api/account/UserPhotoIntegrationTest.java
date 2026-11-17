package br.com.nutrimente.api.account;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Duration;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.ResultActions;

import br.com.nutrimente.api.IntegrationTest;
import br.com.nutrimente.api.common.TestImages;

/** Foto de perfil: pública só para profissional aprovado; a de paciente é dado pessoal */
class UserPhotoIntegrationTest extends IntegrationTest {

	private static final byte[] PNG = TestImages.png(1200, 900);

	private ResultActions upload(String token) throws Exception {
		return mvc.perform(multipart(HttpMethod.PUT, "/api/me/photo")
				.file(new MockMultipartFile("photo", "eu.png", "image/png", PNG))
				.header("Authorization", "Bearer " + token));
	}

	private Long idOf(String email) {
		return jdbc.queryForObject("SELECT id FROM users WHERE email = ?", Long.class, email);
	}

	@Test
	@DisplayName("foto de paciente: só ele, o admin e o profissional que o atende; sem cache compartilhado")
	void patientPhotoIsPrivate() throws Exception {
		String admin = createAdminAndLogin();
		Pro pro = readyProfessional(admin);
		Pro other = readyProfessional(admin);
		String email = uniqueEmail();
		String patient = registerVerifiedPatient(email);
		Long patientId = idOf(email);
		String url = "/api/users/" + patientId + "/photo";

		upload(patient).andExpect(status().isOk()).andExpect(jsonPath("$.photoUrl").value(url));

		// Sem login, ou logado sem vínculo: 404 (igual a "não existe")
		getAs(url, null).andExpect(status().isNotFound());
		getAs(url, pro.token()).andExpect(status().isNotFound());
		getAs(url, registerVerifiedPatient(uniqueEmail())).andExpect(status().isNotFound());

		getAs(url, patient).andExpect(status().isOk())
				.andExpect(content().contentType("image/jpeg"))
				.andExpect(header().string("Cache-Control", "no-store, private"));
		// Guardada já reduzida: 1200x900 -> 512x384
		byte[] stored = getAs(url, patient).andReturn().getResponse().getContentAsByteArray();
		assertThat(TestImages.decode(stored).getWidth()).isEqualTo(512);
		assertThat(TestImages.decode(stored).getHeight()).isEqualTo(384);
		getAs(url, admin).andExpect(status().isOk());

		// Com consulta marcada, o profissional passa a ver; o outro continua sem ver
		book(patient, pro.id(), slotAfter(pro.id(), Duration.ofHours(30)));
		getAs(url, pro.token()).andExpect(status().isOk()).andExpect(content().contentType("image/jpeg"));
		getAs(url, other.token()).andExpect(status().isNotFound());
	}

	@Test
	@DisplayName("foto de profissional: pública depois de aprovado; em análise, só para ele")
	void professionalPhotoIsPublicOnlyWhenApproved() throws Exception {
		String admin = createAdminAndLogin();
		String email = uniqueEmail();
		String pending = registerVerifiedProfessional(email, "NUTRICIONISTA", randomDocument());
		Long id = idOf(email);
		String url = "/api/users/" + id + "/photo";

		upload(pending).andExpect(status().isOk());
		getAs(url, null).andExpect(status().isNotFound());
		getAs(url, pending).andExpect(status().isOk());

		patchAs("/api/admin/professionals/" + id + "/verification", admin, "{\"status\": \"APPROVED\"}")
				.andExpect(status().isOk());
		getAs(url, null).andExpect(status().isOk())
				.andExpect(content().contentType("image/jpeg"))
				.andExpect(header().string("Cache-Control", "max-age=3600, public"));

		// Recusado depois: volta a ser privada
		patchAs("/api/admin/professionals/" + id + "/verification", admin, "{\"status\": \"REJECTED\", \"reason\": \"Documento ilegível\"}")
				.andExpect(status().isOk());
		getAs(url, null).andExpect(status().isNotFound());
	}
}
