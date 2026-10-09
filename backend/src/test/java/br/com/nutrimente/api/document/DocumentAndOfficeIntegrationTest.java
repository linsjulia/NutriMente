package br.com.nutrimente.api.document;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;
import java.time.Duration;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.ResultActions;

import com.jayway.jsonpath.JsonPath;

import br.com.nutrimente.api.IntegrationTest;

/** Documentos do profissional (conferidos pelo admin), endereço do consultório e revogação da teleconsulta */
class DocumentAndOfficeIntegrationTest extends IntegrationTest {

	private static final byte[] PDF = "%PDF-1.4\n% documento de teste\n".getBytes(StandardCharsets.US_ASCII);
	private static final byte[] ZIP = { 'P', 'K', 3, 4, 1, 2, 3 };

	private ResultActions upload(String token, String type, byte[] bytes) throws Exception {
		var request = multipart("/api/me/documents").file(new MockMultipartFile("file", "doc.pdf", "application/pdf", bytes))
				.header("Authorization", "Bearer " + token);
		if (type != null) {
			request.param("documentType", type);
		}
		return mvc.perform(request);
	}

	@Test
	@DisplayName("documentos: profissional envia; admin abre e recusa com motivo; aprovado não pode ser apagado")
	void documentsFlow() throws Exception {
		String admin = createAdminAndLogin();
		Pro pro = readyProfessional(admin);

		upload(pro.token(), null, PDF).andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors.documentType").value("Escolha o tipo do documento"));
		upload(pro.token(), "DIPLOMA", ZIP).andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors.file").value("Envie o documento em PDF, JPG, PNG ou WebP"));
		String body = upload(pro.token(), "REGISTRO_CONSELHO", PDF)
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.status").value("PENDING"))
				.andExpect(jsonPath("$.contentType").value("application/pdf"))
				.andReturn().getResponse().getContentAsString();
		Integer id = JsonPath.read(body, "$.id");
		getAs("/api/me/documents/" + id + "/file", pro.token()).andExpect(content().bytes(PDF));

		// Paciente e outro profissional não chegam nos documentos
		String patient = registerVerifiedPatient(uniqueEmail());
		getAs("/api/admin/professionals/" + pro.id() + "/documents", patient).andExpect(status().isForbidden());
		Pro other = readyProfessional(admin);
		getAs("/api/me/documents/" + id + "/file", other.token()).andExpect(status().isNotFound());

		// Admin confere
		getAs("/api/admin/professionals/" + pro.id() + "/documents", admin)
				.andExpect(jsonPath("$[0].fileUrl").value("/api/admin/documents/" + id + "/file"));
		getAs("/api/admin/documents/" + id + "/file", admin).andExpect(content().bytes(PDF));
		patchAs("/api/admin/documents/" + id, admin, "{\"status\": \"REJECTED\"}")
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors.notes").value("Informe o motivo da recusa"));
		patchAs("/api/admin/documents/" + id, admin, "{\"status\": \"REJECTED\", \"notes\": \"Arquivo ilegível\"}")
				.andExpect(jsonPath("$.status").value("REJECTED"));
		getAs("/api/notifications?size=1", pro.token())
				.andExpect(jsonPath("$.items[0].title").value("Documento recusado"));

		// Recusado pode ser apagado; aprovado não
		Integer second = JsonPath.read(upload(pro.token(), "IDENTIDADE", PDF).andReturn().getResponse()
				.getContentAsString(), "$.id");
		patchAs("/api/admin/documents/" + second, admin, "{\"status\": \"APPROVED\"}").andExpect(status().isOk());
		deleteAs("/api/me/documents/" + second, pro.token(), null).andExpect(status().isConflict())
				.andExpect(jsonPath("$.code").value("DOCUMENT_APPROVED"));
		deleteAs("/api/me/documents/" + id, pro.token(), null).andExpect(status().isNoContent());
		getAs("/api/me/documents", pro.token()).andExpect(jsonPath("$.length()").value(1));

		// Excluir a conta apaga os documentos
		deleteAs("/api/me", pro.token(), "{\"password\": \"%s\"}".formatted(PASSWORD)).andExpect(status().isNoContent());
		assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM professional_documents WHERE professional_id = ?",
				Integer.class, pro.id())).isZero();
	}

	@Test
	@DisplayName("consultório: presencial só com endereço; endereço completo só na consulta; busca mostra cidade/UF")
	void officeAddress() throws Exception {
		String admin = createAdminAndLogin();
		Pro pro = readyProfessional(admin); // já vem com consultório em São Paulo/SP
		String patient = registerVerifiedPatient(uniqueEmail());

		getAs("/api/professionals/" + pro.id(), null)
				.andExpect(jsonPath("$.offersInPerson").value(true))
				.andExpect(jsonPath("$.officeCity").value("São Paulo"))
				.andExpect(jsonPath("$.officeState").value("SP"))
				.andExpect(jsonPath("$.officeAddress").doesNotExist());
		String booked = postAs("/api/appointments", patient, "{\"professionalId\": %d, \"startsAt\": \"%s\", \"modality\": \"PRESENCIAL\"}"
				.formatted(pro.id(), slotAfter(pro.id(), Duration.ofHours(30))))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.officeAddress").value("Rua das Flores, 100 - Centro, São Paulo/SP"))
				.andExpect(jsonPath("$.videoUrl").doesNotExist())
				.andReturn().getResponse().getContentAsString();
		assertThat((String) JsonPath.read(booked, "$.modality")).isEqualTo("PRESENCIAL");

		// Endereço pela metade ou UF inválida: recusado
		putAs("/api/me/professional-profile", pro.token(), "{\"consultationPrice\": 150, \"officeAddress\": \"Rua B, 1\"}")
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors.officeCity").value("Informe a cidade"))
				.andExpect(jsonPath("$.errors.officeState").value("Escolha a UF"));
		putAs("/api/me/professional-profile", pro.token(), """
				{"consultationPrice": 150, "officeAddress": "Rua B, 1", "officeCity": "x", "officeState": "XX"}""")
				.andExpect(jsonPath("$.errors.officeState").value("Escolha a UF"));

		// Apagar o endereço (três vazios): presencial deixa de valer
		putAs("/api/me/professional-profile", pro.token(), """
				{"consultationPrice": 150, "officeAddress": "", "officeCity": "", "officeState": ""}""")
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.professional.officeAddress").doesNotExist());
		postAs("/api/appointments", patient, "{\"professionalId\": %d, \"startsAt\": \"%s\", \"modality\": \"PRESENCIAL\"}"
				.formatted(pro.id(), slotAfter(pro.id(), Duration.ofHours(50))))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.code").value("IN_PERSON_NOT_AVAILABLE"));
	}

	@Test
	@DisplayName("admin revoga o atendimento online com motivo; o profissional é avisado")
	void adminRevokesTelehealth() throws Exception {
		String admin = createAdminAndLogin();
		Pro pro = readyProfessional(admin);

		patchAs("/api/admin/professionals/" + pro.id() + "/telehealth/revoke", admin, "{}")
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors.reason").value("Informe o motivo"));
		patchAs("/api/admin/professionals/" + pro.id() + "/telehealth/revoke", admin,
				"{\"reason\": \"Cadastro não encontrado no e-Nutricionista\"}")
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.telehealthRegistered").value(false));
		getAs("/api/professionals/" + pro.id(), null).andExpect(jsonPath("$.offersOnline").value(false));
		getAs("/api/notifications?size=1", pro.token())
				.andExpect(jsonPath("$.items[0].title").value("Atendimento online desativado"));
		verify(emailService).sendAccountNotice(eq(pro.email()), anyString(), eq("Atendimento online desativado"),
				anyString(), anyString());
		// Revogar de novo: não há o que revogar
		patchAs("/api/admin/professionals/" + pro.id() + "/telehealth/revoke", admin, "{\"reason\": \"x\"}")
				.andExpect(status().isConflict());
	}
}
