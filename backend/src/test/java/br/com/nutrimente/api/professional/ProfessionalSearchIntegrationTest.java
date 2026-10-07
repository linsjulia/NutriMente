package br.com.nutrimente.api.professional;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.jayway.jsonpath.JsonPath;

import br.com.nutrimente.api.IntegrationTest;

/** Busca pública: faixa de preço e ordenação. */
class ProfessionalSearchIntegrationTest extends IntegrationTest {

	/** Cria um nutricionista aprovado com o preço informado (null = "valor a combinar") e devolve o id */
	private Long approvedNutritionist(String admin, String price) throws Exception {
		String email = uniqueEmail();
		String token = registerVerifiedProfessional(email, "NUTRICIONISTA", randomDocument());
		Long id = jdbc.queryForObject("SELECT id FROM users WHERE email = ?", Long.class, email);
		putAs("/api/me/professional-profile", token, "{\"consultationPrice\": %s}".formatted(price))
				.andExpect(status().isOk());
		patchAs("/api/admin/professionals/" + id + "/verification", admin, "{\"status\": \"APPROVED\"}")
				.andExpect(status().isOk());
		return id;
	}

	private List<Integer> ids(String url) throws Exception {
		String body = getAs(url, null).andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
		return JsonPath.read(body, "$.items[*].id");
	}

	@Test
	@DisplayName("faixa de preço: só quem está dentro dela; 'valor a combinar' fica de fora")
	void priceRange() throws Exception {
		String admin = createAdminAndLogin();
		Long cheap = approvedNutritionist(admin, "90.00");
		Long middle = approvedNutritionist(admin, "150.00");
		Long expensive = approvedNutritionist(admin, "400.00");
		Long noPrice = approvedNutritionist(admin, "null");

		String url = "/api/professionals?type=NUTRICIONISTA&size=50&minPrice=100&maxPrice=200";
		getAs(url, null)
				.andExpect(jsonPath("$.items[*].id", hasItem(middle.intValue())))
				.andExpect(jsonPath("$.items[*].id", not(hasItem(cheap.intValue()))))
				.andExpect(jsonPath("$.items[*].id", not(hasItem(expensive.intValue()))))
				.andExpect(jsonPath("$.items[*].id", not(hasItem(noPrice.intValue()))));

		// Só mínimo, só máximo
		getAs("/api/professionals?size=50&minPrice=300", null)
				.andExpect(jsonPath("$.items[*].id", hasItem(expensive.intValue())))
				.andExpect(jsonPath("$.items[*].id", not(hasItem(middle.intValue()))));
		getAs("/api/professionals?size=50&maxPrice=100", null)
				.andExpect(jsonPath("$.items[*].id", hasItem(cheap.intValue())))
				.andExpect(jsonPath("$.items[*].id", not(hasItem(middle.intValue()))));
		// Sem faixa: aparece também quem deixou "valor a combinar"
		getAs("/api/professionals?type=NUTRICIONISTA&size=50", null)
				.andExpect(jsonPath("$.items[*].id", hasItem(noPrice.intValue())));
	}

	@Test
	@DisplayName("ordenação por preço: crescente e decrescente, 'valor a combinar' sempre no fim")
	void sortByPrice() throws Exception {
		String admin = createAdminAndLogin();
		Long a = approvedNutritionist(admin, "120.00");
		Long b = approvedNutritionist(admin, "80.00");
		Long c = approvedNutritionist(admin, "null");
		List<Long> mine = List.of(a, b, c);

		List<Integer> asc = ids("/api/professionals?type=NUTRICIONISTA&size=50&sort=PRICE_ASC").stream()
				.filter(id -> mine.contains(id.longValue())).toList();
		org.junit.jupiter.api.Assertions.assertEquals(List.of(b.intValue(), a.intValue(), c.intValue()), asc);

		List<Integer> desc = ids("/api/professionals?type=NUTRICIONISTA&size=50&sort=PRICE_DESC").stream()
				.filter(id -> mine.contains(id.longValue())).toList();
		org.junit.jupiter.api.Assertions.assertEquals(List.of(a.intValue(), b.intValue(), c.intValue()), desc);
	}

	@Test
	@DisplayName("parâmetros inválidos: 400 com o campo certo")
	void invalidParameters() throws Exception {
		getAs("/api/professionals?minPrice=300&maxPrice=100", null)
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors.minPrice").value("O valor mínimo precisa ser menor ou igual ao máximo"));
		getAs("/api/professionals?minPrice=-1", null)
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors.minPrice").value("O valor não pode ser negativo"));
		getAs("/api/professionals?minPrice=abc", null)
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors.minPrice").value("Valor inválido"));
		getAs("/api/professionals?sort=XYZ", null)
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors.sort").value("Opção inválida"));
	}
}
