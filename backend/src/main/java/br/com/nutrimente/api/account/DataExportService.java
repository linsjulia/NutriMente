package br.com.nutrimente.api.account;

import java.sql.Date;
import java.sql.Time;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.nutrimente.api.common.AfterCommit;
import br.com.nutrimente.api.common.ApiException;
import br.com.nutrimente.api.logging.LogClient;
import br.com.nutrimente.api.record.RecordCipher;
import br.com.nutrimente.api.user.User;
import br.com.nutrimente.api.user.UserRepository;

/**
 * "Baixar meus dados" (LGPD, art. 18, II e V: acesso e portabilidade).
 *
 * Monta um JSON com TUDO o que o banco guarda sobre a pessoa, tabela por
 * tabela, com os nomes das colunas do próprio banco. É de propósito: a
 * exportação mostra os dados como estão guardados, e uma tabela nova aparece
 * aqui só com uma consulta a mais.
 *
 * Fica de fora o que não é dado da pessoa, ou que seria um risco:
 * - hash da senha e tokens de e-mail/senha (credenciais);
 * - controles internos do banco (row_version);
 * - as anotações PRIVADAS do prontuário, para o paciente: elas são do
 *   profissional (mesma regra da tela). As orientações vão.
 *
 * Datas em UTC (com "Z"), como no resto da API.
 */
@Service
public class DataExportService {

	/** Colunas que nunca saem, de nenhuma tabela */
	private static final Set<String> HIDDEN = Set.of("password_hash", "row_version", "cpf_hash");

	private final NamedParameterJdbcTemplate jdbc;
	private final UserRepository users;
	private final RecordCipher cipher;
	private final LogClient logClient;

	public DataExportService(NamedParameterJdbcTemplate jdbc, UserRepository users, RecordCipher cipher,
			LogClient logClient) {
		this.jdbc = jdbc;
		this.users = users;
		this.cipher = cipher;
		this.logClient = logClient;
	}

	@Transactional(readOnly = true)
	public Map<String, Object> export(Long userId) {
		User user = users.findById(userId).filter(u -> u.canLogin())
				.orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "SESSION_INVALID",
						"Sua sessão não é mais válida. Entre novamente."));
		Map<String, Object> id = Map.of("id", userId);
		Map<String, Object> out = new LinkedHashMap<>();

		out.put("aviso", "Dados que o NutriMente guarda sobre você (LGPD, art. 18). Datas em UTC.");
		out.put("geradoEm", Instant.now().truncatedTo(ChronoUnit.SECONDS));

		// ---------- Conta ----------
		// CPF, telefone e nascimento são guardados cifrados (V007): abertos aqui
		Map<String, Object> account = rows("SELECT * FROM users WHERE id = :id", id).getFirst();
		for (String column : List.of("cpf", "telephone", "birth_date")) {
			account.put(column, cipher.decryptOrPlain((String) account.get(column)));
		}
		out.put("conta", account);
		out.put("consentimentos", rows("SELECT * FROM lgpd_consents WHERE user_id = :id ORDER BY id", id));
		out.put("paciente", rows("SELECT * FROM patients WHERE user_id = :id", id));
		out.put("profissional", rows("SELECT * FROM professionals WHERE user_id = :id", id));
		out.put("especialidades", rows("""
				SELECT s.id, s.name, s.professional_type FROM professional_specialties ps
				JOIN specialties s ON s.id = ps.specialty_id WHERE ps.professional_id = :id ORDER BY s.name""", id));
		out.put("horariosDeAtendimento",
				rows("SELECT * FROM professional_availability WHERE professional_id = :id ORDER BY day_of_week", id));
		out.put("documentosProfissionais",
				rows("SELECT * FROM professional_documents WHERE professional_id = :id ORDER BY id", id));

		// ---------- Consultas (como paciente ou como profissional) ----------
		String mine = "(SELECT id FROM appointments WHERE patient_id = :id OR professional_id = :id)";
		out.put("consultas", rows("""
				SELECT a.*, pu.name AS patient_name, pru.name AS professional_name
				FROM appointments a
				JOIN users pu ON pu.id = a.patient_id
				JOIN users pru ON pru.id = a.professional_id
				WHERE a.patient_id = :id OR a.professional_id = :id ORDER BY a.starts_at""", id));
		out.put("registrosDasConsultas", records(userId, mine));
		// Questionário inicial e triagens: dados do PACIENTE (textos decifrados aqui)
		out.put("questionarioInicial", decrypted(
				rows("SELECT * FROM patient_intakes WHERE patient_id = :id", id),
				"dietary_restrictions", "health_conditions", "expectations"));
		out.put("triagens", decrypted(rows("""
				SELECT s.* FROM appointment_screenings s JOIN appointments a ON a.id = s.appointment_id
				WHERE a.patient_id = :id ORDER BY s.appointment_id""", id), "reason", "symptoms"));
		out.put("avaliacoes",
				rows("SELECT * FROM reviews WHERE patient_id = :id OR professional_id = :id ORDER BY id", id));

		// ---------- Planos de ação ----------
		String plans = "(SELECT id FROM action_plans WHERE patient_id = :id OR professional_id = :id)";
		out.put("planosDeAcao",
				rows("SELECT * FROM action_plans WHERE patient_id = :id OR professional_id = :id ORDER BY id", id));
		out.put("metas", rows("SELECT * FROM plan_goals WHERE plan_id IN " + plans + " ORDER BY id", id));
		out.put("rotinaAlimentar", rows("SELECT * FROM meal_routines WHERE plan_id IN " + plans + " ORDER BY id", id));
		out.put("checklist", rows("SELECT * FROM checklist_items WHERE plan_id IN " + plans + " ORDER BY id", id));
		out.put("marcacoesDoChecklist", rows("""
				SELECT * FROM checklist_entries WHERE item_id IN
				  (SELECT id FROM checklist_items WHERE plan_id IN %s) ORDER BY entry_date, item_id""".formatted(plans),
				id));
		out.put("progresso", rows("SELECT * FROM progress_records WHERE plan_id IN " + plans + " ORDER BY id", id));

		// ---------- Mensagens, notificações e pagamentos ----------
		String conversations = "(SELECT id FROM conversations WHERE patient_id = :id OR professional_id = :id)";
		out.put("conversas", rows("SELECT * FROM conversations WHERE id IN " + conversations + " ORDER BY id", id));
		out.put("mensagens",
				rows("SELECT * FROM messages WHERE conversation_id IN " + conversations + " ORDER BY id", id));
		out.put("notificacoes", rows("SELECT * FROM notifications WHERE user_id = :id ORDER BY id", id));
		String payments = "(SELECT id FROM payments WHERE payer_id = :id OR appointment_id IN " + mine + ")";
		out.put("pagamentos", rows("SELECT * FROM payments WHERE id IN " + payments + " ORDER BY id", id));
		out.put("reembolsos", rows("SELECT * FROM refunds WHERE payment_id IN " + payments + " ORDER BY id", id));
		out.put("carteira", rows("SELECT * FROM wallets WHERE user_id = :id", id));
		out.put("movimentacoesDaCarteira", rows("""
				SELECT * FROM wallet_transactions
				WHERE wallet_id IN (SELECT id FROM wallets WHERE user_id = :id) ORDER BY id""", id));

		String role = user.getRole().name();
		AfterCommit.run(() -> logClient.audit(userId, role, "READ", "users.export", userId, userId));
		return out;
	}

	/**
	 * Prontuário: os textos estão criptografados no banco, então são abertos
	 * aqui. O paciente recebe só as orientações; o profissional, tudo o que escreveu.
	 */
	private List<Map<String, Object>> records(Long userId, String appointments) {
		List<Map<String, Object>> rows = rows("""
				SELECT r.*, a.patient_id FROM appointment_records r JOIN appointments a ON a.id = r.appointment_id
				WHERE r.appointment_id IN %s ORDER BY r.id""".formatted(appointments), Map.of("id", userId));
		for (Map<String, Object> row : rows) {
			boolean asProfessional = userId.equals(((Number) row.get("professional_id")).longValue());
			row.put("patient_guidance", cipher.decrypt((String) row.get("patient_guidance")));
			if (asProfessional) {
				row.put("private_notes", cipher.decrypt((String) row.get("private_notes")));
			} else {
				row.remove("private_notes");
			}
		}
		return rows;
	}

	/** Abre (decifra) as colunas criptografadas indicadas */
	private List<Map<String, Object>> decrypted(List<Map<String, Object>> rows, String... columns) {
		for (Map<String, Object> row : rows) {
			for (String column : columns) {
				row.put(column, cipher.decrypt((String) row.get(column)));
			}
		}
		return rows;
	}

	/** Linhas da consulta, sem as colunas ocultas e com datas em formato ISO (UTC) */
	private List<Map<String, Object>> rows(String sql, Map<String, Object> params) {
		return jdbc.queryForList(sql, params).stream().map(row -> {
			Map<String, Object> clean = new LinkedHashMap<>();
			row.forEach((column, value) -> {
				if (!HIDDEN.contains(column)) {
					clean.put(column, switch (value) {
						case Timestamp t -> t.toLocalDateTime().toInstant(ZoneOffset.UTC);
						case Date d -> d.toLocalDate();
						case Time t -> t.toLocalTime();
						case null, default -> value;
					});
				}
			});
			return clean;
		}).toList();
	}
}
