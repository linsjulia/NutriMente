package br.com.nutrimente.api.common.validation;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import br.com.nutrimente.api.user.CouncilNumber;
import br.com.nutrimente.api.user.ProfessionalType;

/** Testes de unidade das regras novas (sem banco nem Spring). */
class ValidationRulesTest {

	private final FullName.Validator fullName = new FullName.Validator();
	private final Celular.Validator celular = new Celular.Validator();

	@Test
	void nomeCompletoAceitaAcentosHifenEApostrofo() {
		assertThat(fullName.isValid("Maria D'Ávila", null)).isTrue();
		assertThat(fullName.isValid("Ana-Clara  Souza", null)).isTrue();
		assertThat(fullName.isValid("Dra. Fernanda Lima", null)).isTrue();
	}

	@Test
	void nomeCompletoRecusaNumerosSimbolosEUmaPalavraSo() {
		assertThat(fullName.isValid("Ana 123", null)).isFalse();
		assertThat(fullName.isValid("Ana <b>", null)).isFalse();
		assertThat(fullName.isValid("Ana", null)).isFalse();
		assertThat(fullName.isValid("Ana D.", null)).isFalse();
	}

	@Test
	void nomesSaoPadronizados() {
		assertThat(Names.normalize("  pedro   DE souza ")).isEqualTo("Pedro de Souza");
		assertThat(Names.normalize("ana-clara d'ávila e silva")).isEqualTo("Ana-Clara D'Ávila e Silva");
		assertThat(Names.normalize("DA SILVA maria")).isEqualTo("Da Silva Maria");
	}

	@Test
	void celularPrecisaDeDddValidoENoveDigitos() {
		assertThat(celular.isValid("(11) 98888-7777", null)).isTrue();
		assertThat(celular.isValid("21999990000", null)).isTrue();
		assertThat(celular.isValid("11111111111", null)).isFalse(); // começa sem 9
		assertThat(celular.isValid("(11) 3333-4444", null)).isFalse(); // fixo
		assertThat(celular.isValid("20988887777", null)).isFalse(); // DDD 20 não existe
		assertThat(celular.isValid("11999999999", null)).isFalse(); // tudo igual
	}

	@Test
	void crnAceitaRegiao1a11EPadroniza() {
		assertThat(CouncilNumber.normalize(ProfessionalType.NUTRICIONISTA, "CRN-3 12345")).contains("3-12345");
		assertThat(CouncilNumber.normalize(ProfessionalType.NUTRICIONISTA, "11/1234")).contains("11-1234");
		assertThat(CouncilNumber.normalize(ProfessionalType.NUTRICIONISTA, "12-12345")).isEmpty(); // região 12 não existe
		assertThat(CouncilNumber.normalize(ProfessionalType.NUTRICIONISTA, "CRP 06/123456")).isEmpty(); // é CRP
	}

	@Test
	void crpAceitaRegiao01a24EPadroniza() {
		assertThat(CouncilNumber.normalize(ProfessionalType.PSICOLOGO, "crp 6/123456")).contains("06/123456");
		assertThat(CouncilNumber.normalize(ProfessionalType.PSICOLOGO, "24/12345")).contains("24/12345");
		assertThat(CouncilNumber.normalize(ProfessionalType.PSICOLOGO, "25/12345")).isEmpty(); // região 25 não existe
		assertThat(CouncilNumber.normalize(ProfessionalType.PSICOLOGO, "CRN-3 12345")).isEmpty(); // é CRN
	}
}
