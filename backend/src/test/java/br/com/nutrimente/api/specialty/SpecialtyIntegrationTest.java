package br.com.nutrimente.api.specialty;

import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.jayway.jsonpath.JsonPath;

import br.com.nutrimente.api.IntegrationTest;

/** Especialidades: lista pública, escolha pelo profissional, filtro na busca e cadastro pelo admin. */
class SpecialtyIntegrationTest extends IntegrationTest {

	/** Especialidades criadas pelo teste (apagadas no fim; as do seed ficam) */
	private final List<Integer> createdSpecialties = new java.util.ArrayList<>();

	@AfterEach
	void removeCreatedSpecialties() {
		createdSpecialties.forEach(id -> jdbc.update("DELETE FROM specialties WHERE id = ?", id));
		createdSpecialties.clear();
	}

	private List<Integer> specialtyIds(String type) throws Exception {
		String body = getAs("/api/specialties?type=" + type, null).andReturn().getResponse().getContentAsString();
		return JsonPath.read(body, "$[*].id");
	}

	@Test
	@DisplayName("lista pública de especialidades, sem login, filtrada por profissão")
	void publicList() throws Exception {
		getAs("/api/specialties", null)
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[*].type", hasItem("NUTRICIONISTA")))
				.andExpect(jsonPath("$[*].type", hasItem("PSICOLOGO")));
		getAs("/api/specialties?type=PSICOLOGO", null)
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[*].type", everyItem(is("PSICOLOGO"))))
				.andExpect(jsonPath("$[*].name", hasItem("Ansiedade")));
	}

	@Test
	@DisplayName("profissional escolhe especialidades da própria profissão (máx. 5) e elas aparecem na busca")
	void professionalChoosesSpecialties() throws Exception {
		String email = uniqueEmail();
		String token = registerVerifiedProfessional(email, "NUTRICIONISTA", randomDocument());
		Long id = jdbc.queryForObject("SELECT id FROM users WHERE email = ?", Long.class, email);
		List<Integer> nutrition = specialtyIds("NUTRICIONISTA");
		List<Integer> psychology = specialtyIds("PSICOLOGO");

		// Especialidade de outra profissão: recusada, com erro no campo
		putAs("/api/me/professional-profile", token, "{\"specialtyIds\": [%d]}".formatted(psychology.get(0)))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors.specialtyIds").value("Escolha especialidades da lista da sua profissão"));
		// Id que não existe
		putAs("/api/me/professional-profile", token, "{\"specialtyIds\": [999999]}")
				.andExpect(status().isBadRequest());
		// Mais de 5
		putAs("/api/me/professional-profile", token, "{\"specialtyIds\": [1, 2, 3, 4, 5, 6]}")
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors.specialtyIds").value("Escolha no máximo 5 especialidades"));

		// Duas válidas (a repetida conta uma vez)
		Integer first = nutrition.get(0);
		Integer second = nutrition.get(1);
		putAs("/api/me/professional-profile", token,
				"{\"bio\": \"Esporte\", \"specialtyIds\": [%d, %d, %d]}".formatted(first, second, first))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.professional.specialties", hasSize(2)))
				.andExpect(jsonPath("$.professional.specialties[*].id", containsInAnyOrder(first, second)));

		// Sem o campo specialtyIds: não mexe nas especialidades
		putAs("/api/me/professional-profile", token, "{\"bio\": \"Só a bio mudou\"}")
				.andExpect(jsonPath("$.professional.specialties", hasSize(2)));

		// Aprovado, aparece na busca com as especialidades e no filtro
		String admin = createAdminAndLogin();
		patchAs("/api/admin/professionals/" + id + "/verification", admin, "{\"status\": \"APPROVED\"}")
				.andExpect(status().isOk());
		getAs("/api/professionals/" + id, null)
				.andExpect(jsonPath("$.specialties[*].id", containsInAnyOrder(first, second)));
		getAs("/api/professionals?specialty=" + first + "&size=50", null)
				.andExpect(jsonPath("$.items[*].id", hasItem(id.intValue())));
		Integer notChosen = nutrition.get(2);
		getAs("/api/professionals?specialty=" + notChosen + "&size=50", null)
				.andExpect(jsonPath("$.items[*].id", not(hasItem(id.intValue()))));

		// Lista vazia tira todas
		putAs("/api/me/professional-profile", token, "{\"specialtyIds\": []}")
				.andExpect(jsonPath("$.professional.specialties", hasSize(0)));
	}

	@Test
	@DisplayName("admin cadastra e remove especialidade; duplicada é recusada; outros papéis não podem")
	void adminManagesSpecialties() throws Exception {
		String patient = registerVerifiedPatient(uniqueEmail());
		String json = "{\"name\": \"  Nutrição   Funcional Teste \", \"type\": \"NUTRICIONISTA\"}";
		postAs("/api/admin/specialties", patient, json).andExpect(status().isForbidden());

		String admin = createAdminAndLogin();
		String body = postAs("/api/admin/specialties", admin, json)
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.name").value("Nutrição Funcional Teste"))
				.andReturn().getResponse().getContentAsString();
		Integer id = JsonPath.read(body, "$.id");
		createdSpecialties.add(id);

		// Mesmo nome (sem diferenciar maiúsculas): conflito
		postAs("/api/admin/specialties", admin, "{\"name\": \"nutrição funcional teste\", \"type\": \"NUTRICIONISTA\"}")
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.errors.name").value("Essa especialidade já existe para esta profissão"));
		// Campos obrigatórios
		postAs("/api/admin/specialties", admin, "{\"name\": \"\"}")
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors.name").exists())
				.andExpect(jsonPath("$.errors.type").exists());

		// Um profissional marca a nova especialidade; ao remover, sai do perfil dele
		String token = registerVerifiedProfessional(uniqueEmail(), "NUTRICIONISTA", randomDocument());
		putAs("/api/me/professional-profile", token, "{\"specialtyIds\": [%d]}".formatted(id))
				.andExpect(jsonPath("$.professional.specialties", hasSize(1)));

		deleteAs("/api/admin/specialties/" + id, admin, null).andExpect(status().isNoContent());
		createdSpecialties.remove(id);
		getAs("/api/me", token).andExpect(jsonPath("$.professional.specialties", hasSize(0)));
		deleteAs("/api/admin/specialties/" + id, admin, null).andExpect(status().isNotFound());
	}
}
