package br.com.nutrimente.api.user;

import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import br.com.nutrimente.api.record.RecordCipher;

/**
 * Cifra os dados pessoais gravados ANTES da criptografia (migração V007).
 *
 * A migração só muda o tipo das colunas: o banco não tem a chave, então
 * não consegue cifrar. Por isso, toda vez que a API liga, este passo
 * procura CPF, telefone ou data de nascimento ainda abertos (sem o prefixo
 * "v1:") ou CPF sem o índice cego (cpf_hash), e completa o trabalho.
 *
 * É idempotente: na segunda vez não encontra nada e não faz nada. Roda antes
 * de a API ser considerada "pronta" (ApplicationRunner), e cada linha é
 * atualizada sozinha: se a API cair no meio, ela continua de onde parou.
 *
 * Nos testes fica DESLIGADO (nutrimente.records.encrypt-legacy-on-startup=false):
 * os testes usam outra chave e o mesmo banco do docker compose; se rodasse,
 * cifraria os dados de verdade com a chave de teste, e a API não os leria.
 */
@Component
public class LegacyPersonalDataEncryptor implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(LegacyPersonalDataEncryptor.class);

	private static final String PENDING = """
			SELECT id, cpf, telephone, birth_date FROM users
			WHERE ((cpf IS NOT NULL AND (cpf NOT LIKE 'v1:%' OR cpf_hash IS NULL))
			    OR (telephone IS NOT NULL AND telephone NOT LIKE 'v1:%')
			    OR (birth_date IS NOT NULL AND birth_date NOT LIKE 'v1:%'))""";

	private final JdbcTemplate jdbc;
	private final RecordCipher cipher;
	private final boolean enabled;

	public LegacyPersonalDataEncryptor(JdbcTemplate jdbc, RecordCipher cipher,
			@Value("${nutrimente.records.encrypt-legacy-on-startup:true}") boolean enabled) {
		this.jdbc = jdbc;
		this.cipher = cipher;
		this.enabled = enabled;
	}

	@Override
	public void run(ApplicationArguments args) {
		if (!enabled) {
			return;
		}
		int done = encryptPending();
		if (done > 0) {
			log.info("Dados pessoais antigos criptografados: {} usuário(s)", done);
		}
	}

	/** Todos os usuários pendentes. Devolve quantos foram atualizados */
	public int encryptPending() {
		return encrypt(jdbc.queryForList(PENDING));
	}

	/** Só um usuário (usado pelo teste, para não mexer nos outros dados do banco) */
	int encryptPending(Long userId) {
		return encrypt(jdbc.queryForList(PENDING + " AND id = ?", userId));
	}

	private int encrypt(List<Map<String, Object>> pending) {
		for (Map<String, Object> row : pending) {
			// Abre o que já estiver cifrado e cifra de novo: o resultado é o mesmo dado, todo no formato novo
			String cpf = cipher.decryptOrPlain((String) row.get("cpf"));
			String telephone = cipher.decryptOrPlain((String) row.get("telephone"));
			String birthDate = cipher.decryptOrPlain((String) row.get("birth_date"));
			jdbc.update("UPDATE users SET cpf = ?, cpf_hash = ?, telephone = ?, birth_date = ? WHERE id = ?",
					cipher.encrypt(cpf), cipher.blindIndex(cpf), cipher.encrypt(telephone),
					cipher.encrypt(birthDate == null ? null : birthDate.strip()), row.get("id"));
		}
		return pending.size();
	}
}
