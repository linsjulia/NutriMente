package br.com.nutrimente.api.appointment;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Duration;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.jayway.jsonpath.JsonPath;

import br.com.nutrimente.api.IntegrationTest;

/**
 * Atendimento online só com cadastro no e-Psi / e-Nutricionista declarado no
 * perfil (CFP 11/2018, CFN 666/2020). Sem ele: só presencial.
 */
class TelehealthIntegrationTest extends IntegrationTest {

	@Test
	@DisplayName("sem cadastro no e-Psi/e-Nutricionista: consulta online recusada, padrão vira presencial e some do filtro online")
	void onlineRequiresDeclaration() throws Exception {
		String admin = createAdminAndLogin();
		Pro pro = readyProfessional(admin);
		String patient = registerVerifiedPatient(uniqueEmail());

		// Desliga o atendimento online (readyProfessional já vem com ele ligado)
		putAs("/api/me/professional-profile", pro.token(), "{\"consultationPrice\": 150.00, \"telehealthRegistered\": false}")
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.professional.telehealthRegistered").value(false))
				.andExpect(jsonPath("$.professional.telehealthDeclaredAt").doesNotExist());
		getAs("/api/professionals/" + pro.id(), null).andExpect(jsonPath("$.offersOnline").value(false));
		getAs("/api/professionals?online=true&size=50", null)
				.andExpect(jsonPath("$.items[*].id").value(not(hasItem(pro.id().intValue()))));

		String slot = slotAfter(pro.id(), Duration.ofHours(30));
		postAs("/api/appointments", patient,
				"{\"professionalId\": %d, \"startsAt\": \"%s\", \"modality\": \"ONLINE\"}".formatted(pro.id(), slot))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.code").value("ONLINE_NOT_AVAILABLE"));
		// Sem modalidade: presencial, sem link de vídeo
		postAs("/api/appointments", patient, "{\"professionalId\": %d, \"startsAt\": \"%s\"}".formatted(pro.id(), slot))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.modality").value("PRESENCIAL"))
				.andExpect(jsonPath("$.videoUrl").doesNotExist());
	}

	@Test
	@DisplayName("com cadastro declarado: atende online, aparece no filtro e a data da declaração não muda ao salvar de novo")
	void declaredOffersOnline() throws Exception {
		String admin = createAdminAndLogin();
		Pro pro = readyProfessional(admin);

		String declaredAt = JsonPath.read(getAs("/api/me", pro.token())
				.andExpect(jsonPath("$.professional.telehealthRegistered").value(true))
				.andReturn().getResponse().getContentAsString(), "$.professional.telehealthDeclaredAt");
		// Salvar o perfil sem o campo (como faz o formulário atual) não mexe na declaração
		putAs("/api/me/professional-profile", pro.token(), "{\"consultationPrice\": 160.00}")
				.andExpect(jsonPath("$.professional.telehealthRegistered").value(true))
				.andExpect(jsonPath("$.professional.telehealthDeclaredAt").value(declaredAt));

		getAs("/api/professionals/" + pro.id(), null).andExpect(jsonPath("$.offersOnline").value(true));
		getAs("/api/professionals?online=true&size=50", null)
				.andExpect(jsonPath("$.items[*].id").value(hasItem(pro.id().intValue())));
	}
}
