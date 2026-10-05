package br.com.nutrimente.api.common.validation;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

/** Teste de unidade: só a lógica do CPF, sem banco nem Spring. */
class CpfValidatorTest {

	@Test
	void aceitaCpfValidoComOuSemMascara() {
		assertThat(CpfValidator.isValidCpf("52998224725")).isTrue();
		assertThat(new CpfValidator().isValid("529.982.247-25", null)).isTrue();
	}

	@Test
	void recusaDigitoVerificadorErrado() {
		assertThat(CpfValidator.isValidCpf("52998224724")).isFalse();
	}

	@Test
	void recusaSequenciasRepetidasETamanhoErrado() {
		assertThat(CpfValidator.isValidCpf("11111111111")).isFalse();
		assertThat(CpfValidator.isValidCpf("1234567890")).isFalse();
	}
}
