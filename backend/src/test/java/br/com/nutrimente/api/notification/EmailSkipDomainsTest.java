package br.com.nutrimente.api.notification;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/** Domínios sem envio (contas de demonstração em produção). */
class EmailSkipDomainsTest {

	@Test
	@DisplayName("não envia para o domínio de demonstração; o resto segue normal")
	void skipsOnlyConfiguredDomains() {
		List<String> demo = List.of("nutrimente.demo");
		assertThat(EmailService.isSkipped("ana@nutrimente.demo", demo)).isTrue();
		assertThat(EmailService.isSkipped("Ana@NutriMente.DEMO", demo)).isTrue();
		assertThat(EmailService.isSkipped("ana@gmail.com", demo)).isFalse();
		// "parecido" não conta: só o domínio exato
		assertThat(EmailService.isSkipped("ana@nutrimente.demo.com.br", demo)).isFalse();
	}

	@Test
	@DisplayName("sem configuração (PC/Mailpit), envia para todos")
	void emptyConfigSendsEverything() {
		assertThat(EmailService.isSkipped("ana@nutrimente.demo", List.of())).isFalse();
		assertThat(EmailService.isSkipped("ana@nutrimente.demo", List.of(""))).isFalse();
		assertThat(EmailService.isSkipped("ana@nutrimente.demo", null)).isFalse();
	}
}
