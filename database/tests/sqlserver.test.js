// =============================================================
// Testes de integração do SQL Server
//
// Conectam no banco REAL (container do docker compose) com o usuário da
// aplicação (nutrimente_app) e conferem se as regras do schema funcionam:
// chaves únicas, CHECKs, cascatas, permissões e índices filtrados.
//
// Cada teste roda dentro de uma TRANSAÇÃO que é desfeita (ROLLBACK) no
// final. Assim os testes não deixam lixo no banco e podem rodar quantas
// vezes quiser, até com dados de verdade lá dentro.
//
// Rodar (com os containers ligados):  cd database/tests && npm test
// =============================================================

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import sql from "mssql";

let pool;

before(async () => {
  pool = await sql.connect({
    server: "localhost",
    port: Number(process.env.MSSQL_PORT || 1433),
    user: process.env.NUTRIMENTE_DB_USER,
    password: process.env.NUTRIMENTE_DB_PASSWORD,
    database: "NutriMente",
    options: { trustServerCertificate: true },
  });
});

after(() => pool?.close());

/**
 * Executa o teste dentro de uma transação e desfaz tudo no final.
 * `query` roda SQL dentro dessa transação.
 */
async function inTransaction(fn) {
  const tx = new sql.Transaction(pool);
  await tx.begin();
  const query = (text) => new sql.Request(tx).query(text);
  try {
    await fn(query);
  } finally {
    await tx.rollback();
  }
}

/** Garante que o SQL falha com um erro cuja mensagem contém `expected` */
async function assertFails(promise, expected) {
  await assert.rejects(promise, (error) => {
    assert.match(error.message, expected);
    return true;
  });
}

// Cria um paciente e um profissional mínimos e devolve os ids
async function createPatientAndProfessional(query) {
  const { recordset } = await query(`
    INSERT INTO users (name, email, role, cpf) VALUES
      (N'Paciente Teste', 'paciente@teste.local', 'PATIENT', '11111111111'),
      (N'Profissional Teste', 'profissional@teste.local', 'PROFESSIONAL', '22222222222');
    DECLARE @patient BIGINT = (SELECT id FROM users WHERE email = 'paciente@teste.local');
    DECLARE @professional BIGINT = (SELECT id FROM users WHERE email = 'profissional@teste.local');
    INSERT INTO patients (user_id) VALUES (@patient);
    INSERT INTO professionals (user_id, professional_type, document_professional, consultation_price)
      VALUES (@professional, 'NUTRICIONISTA', '3-99999', 150);
    SELECT @patient AS patient, @professional AS professional;`);
  return recordset[0];
}

// -------------------------------------------------------------

// 24 dos scripts iniciais + schema_migrations (controle) + appointment_records (V002)
// + patient_intakes e appointment_screenings (V005)
test("todas as 28 tabelas foram criadas", async () => {
  const { recordset } = await pool.query("SELECT COUNT(*) AS total FROM sys.tables");
  assert.equal(recordset[0].total, 28);
});

test("migrações foram aplicadas e registradas em schema_migrations", async () => {
  const { recordset } = await pool.query("SELECT version FROM schema_migrations ORDER BY version");
  const versions = recordset.map((r) => r.version);
  for (const v of ["V002__registro_da_consulta", "V003__cadastro_telessaude", "V004__versao_da_sessao", "V005__questionario_e_triagem", "V006__lembrete_da_consulta"]) assert.ok(versions.includes(v), `falta ${v}`);
});

// O admin pode cadastrar especialidades novas (/admin/specialties), então
// o teste confere que as 12 do seed EXISTEM, e não que sejam as únicas.
test("seed cadastrou as 12 especialidades (6 de cada profissão)", async () => {
  const seed = {
    NUTRICIONISTA: ["Nutrição Clínica", "Nutrição Esportiva", "Nutrição Comportamental", "Emagrecimento",
      "Nutrição Materno-Infantil", "Vegetarianismo e Veganismo"],
    PSICOLOGO: ["Transtornos Alimentares", "Ansiedade", "Depressão", "Terapia Cognitivo-Comportamental",
      "Psicologia da Saúde", "Autoestima e Imagem Corporal"],
  };
  const { recordset } = await pool.query("SELECT name, professional_type FROM specialties");
  for (const [type, names] of Object.entries(seed)) {
    const found = recordset.filter((r) => r.professional_type === type).map((r) => r.name);
    for (const name of names) assert.ok(found.includes(name), `falta "${name}" (${type})`);
  }
});

test("busca ignora acentos e maiúsculas (collation CI_AI)", async () => {
  const { recordset } = await pool.query("SELECT name FROM specialties WHERE name = 'DEPRESSAO'");
  assert.equal(recordset[0]?.name, "Depressão");
});

test("usuário da aplicação NÃO pode alterar a estrutura do banco", async () => {
  await assertFails(pool.query("CREATE TABLE hack (id INT)"), /permission denied/i);
  await assertFails(pool.query("DROP TABLE users"), /permission|does not exist/i);
});

test("e-mail não pode repetir", () =>
  inTransaction(async (query) => {
    await query("INSERT INTO users (name, email, role) VALUES (N'A', 'repetido@teste.local', 'PATIENT')");
    await assertFails(
      query("INSERT INTO users (name, email, role) VALUES (N'B', 'repetido@teste.local', 'PATIENT')"),
      /uq_users_email/
    );
  }));

test("CPF precisa ter 11 dígitos numéricos, mas pode ficar vazio", () =>
  inTransaction(async (query) => {
    await assertFails(
      query("INSERT INTO users (name, email, role, cpf) VALUES (N'A', 'cpf@teste.local', 'PATIENT', '123.456.789')"),
      /ck_users_cpf/
    );
    // Vários usuários sem CPF são permitidos (índice único filtrado)
    await query(`INSERT INTO users (name, email, role) VALUES
      (N'Sem CPF 1', 'semcpf1@teste.local', 'PATIENT'),
      (N'Sem CPF 2', 'semcpf2@teste.local', 'PATIENT')`);
  }));

test("tipo de conta e profissão só aceitam valores válidos", () =>
  inTransaction(async (query) => {
    await assertFails(
      query("INSERT INTO users (name, email, role) VALUES (N'A', 'role@teste.local', 'HACKER')"),
      /ck_users_role/
    );
    const { professional } = await createPatientAndProfessional(query);
    await assertFails(
      query(`UPDATE professionals SET professional_type = 'MEDICO' WHERE user_id = ${professional}`),
      /ck_professionals_type/
    );
  }));

test("mesmo CRN não pode ser usado por dois nutricionistas", () =>
  inTransaction(async (query) => {
    await createPatientAndProfessional(query);
    await query("INSERT INTO users (name, email, role) VALUES (N'Outro', 'outro@teste.local', 'PROFESSIONAL')");
    await assertFails(
      query(`INSERT INTO professionals (user_id, professional_type, document_professional)
             SELECT id, 'NUTRICIONISTA', '3-99999' FROM users WHERE email = 'outro@teste.local'`),
      /uq_professionals_doc/
    );
  }));

test("não permite dois agendamentos ativos no mesmo horário; após cancelar, o horário libera", () =>
  inTransaction(async (query) => {
    const { patient, professional } = await createPatientAndProfessional(query);
    const insert = `INSERT INTO appointments (patient_id, professional_id, starts_at, ends_at, price)
                    VALUES (${patient}, ${professional}, '2030-01-10 13:00', '2030-01-10 13:50', 150)`;
    await query(insert);
    await assertFails(query(insert), /uq_appointments_professional_slot|duplicate key/i);

    await query(`UPDATE appointments SET status = 'CANCELLED' WHERE patient_id = ${patient}`);
    await query(insert); // agora pode
  }));

test("consulta precisa terminar depois de começar", () =>
  inTransaction(async (query) => {
    const { patient, professional } = await createPatientAndProfessional(query);
    await assertFails(
      query(`INSERT INTO appointments (patient_id, professional_id, starts_at, ends_at, price)
             VALUES (${patient}, ${professional}, '2030-01-10 14:00', '2030-01-10 13:00', 150)`),
      /ck_appointments_range/
    );
  }));

test("apenas um pagamento PAID por consulta", () =>
  inTransaction(async (query) => {
    const { patient, professional } = await createPatientAndProfessional(query);
    const { recordset } = await query(`
      INSERT INTO appointments (patient_id, professional_id, starts_at, ends_at, price)
      OUTPUT inserted.id
      VALUES (${patient}, ${professional}, '2030-02-01 10:00', '2030-02-01 10:50', 150)`);
    const appointment = recordset[0].id;
    const pay = (status) =>
      query(`INSERT INTO payments (appointment_id, payer_id, amount, method, status)
             VALUES (${appointment}, ${patient}, 150, 'PIX', '${status}')`);

    await pay("FAILED"); // tentativas que falharam podem ficar registradas
    await pay("PAID");
    await assertFails(pay("PAID"), /uq_payments_appointment_paid|duplicate key/i);
  }));

test("avaliação só aceita nota de 1 a 5 e uma por consulta", () =>
  inTransaction(async (query) => {
    const { patient, professional } = await createPatientAndProfessional(query);
    const { recordset } = await query(`
      INSERT INTO appointments (patient_id, professional_id, starts_at, ends_at, price, status)
      OUTPUT inserted.id
      VALUES (${patient}, ${professional}, '2030-03-01 10:00', '2030-03-01 10:50', 150, 'COMPLETED')`);
    const review = (rating) =>
      query(`INSERT INTO reviews (appointment_id, patient_id, professional_id, rating)
             VALUES (${recordset[0].id}, ${patient}, ${professional}, ${rating})`);

    await assertFails(review(6), /ck_reviews_rating/);
    await review(5);
    await assertFails(review(4), /uq_reviews_appointment/);
  }));

test("saldo da carteira nunca fica negativo", () =>
  inTransaction(async (query) => {
    const { patient } = await createPatientAndProfessional(query);
    await query(`INSERT INTO wallets (user_id, balance) VALUES (${patient}, 50)`);
    await assertFails(
      query(`UPDATE wallets SET balance = balance - 100 WHERE user_id = ${patient}`),
      /ck_wallets_balance/
    );
  }));

test("apagar usuário apaga o perfil (CASCADE), mas não se ele tiver consultas (histórico)", () =>
  inTransaction(async (query) => {
    const { patient, professional } = await createPatientAndProfessional(query);

    // Sem consultas: o perfil de paciente some junto
    await query(`DELETE FROM users WHERE id = ${patient}`);
    const { recordset } = await query(`SELECT COUNT(*) AS total FROM patients WHERE user_id = ${patient}`);
    assert.equal(recordset[0].total, 0);

    // Com consulta: o banco protege o histórico
    await query("INSERT INTO users (name, email, role) VALUES (N'P2', 'p2@teste.local', 'PATIENT')");
    await query("INSERT INTO patients (user_id) SELECT id FROM users WHERE email = 'p2@teste.local'");
    await query(`INSERT INTO appointments (patient_id, professional_id, starts_at, ends_at, price)
                 SELECT id, ${professional}, '2030-04-01 10:00', '2030-04-01 10:50', 150
                 FROM users WHERE email = 'p2@teste.local'`);
    await assertFails(query("DELETE FROM users WHERE email = 'p2@teste.local'"), /REFERENCE constraint/i);
  }));

test("ROWVERSION da carteira muda a cada alteração (controle de concorrência)", () =>
  inTransaction(async (query) => {
    const { patient } = await createPatientAndProfessional(query);
    await query(`INSERT INTO wallets (user_id, balance) VALUES (${patient}, 10)`);
    const version = async () =>
      (await query(`SELECT row_version FROM wallets WHERE user_id = ${patient}`)).recordset[0].row_version;

    const before = await version();
    await query(`UPDATE wallets SET balance = 20 WHERE user_id = ${patient}`);
    assert.notDeepEqual(await version(), before);
  }));

test("token de e-mail é único e só aceita as finalidades conhecidas", () =>
  inTransaction(async (query) => {
    const { patient } = await createPatientAndProfessional(query);
    const hash = "a".repeat(64);
    const insert = (purpose) =>
      query(`INSERT INTO user_tokens (user_id, purpose, token_hash, expires_at)
             VALUES (${patient}, '${purpose}', '${hash}', DATEADD(HOUR, 24, SYSUTCDATETIME()))`);
    await assertFails(insert("QUALQUER"), /ck_user_tokens_purpose/);
    await insert("EMAIL_VERIFICATION");
    await assertFails(insert("PASSWORD_RESET"), /uq_user_tokens_hash/);
  }));

test("gênero é opcional e aceita só as opções do formulário", () =>
  inTransaction(async (query) => {
    await query(`INSERT INTO users (name, email, role, gender) VALUES
      (N'A', 'g1@teste.local', 'PATIENT', 'FEMALE'),
      (N'B', 'g2@teste.local', 'PATIENT', 'UNDISCLOSED'),
      (N'C', 'g3@teste.local', 'PATIENT', NULL)`);
    await assertFails(
      query("INSERT INTO users (name, email, role, gender) VALUES (N'D', 'g4@teste.local', 'PATIENT', 'X')"),
      /ck_users_gender/
    );
  }));

test("registro da consulta (V002): um por consulta e não some se a consulta for apagada", () =>
  inTransaction(async (query) => {
    const { patient, professional } = await createPatientAndProfessional(query);
    const { recordset } = await query(`
      INSERT INTO appointments (patient_id, professional_id, starts_at, ends_at, price, status)
      OUTPUT inserted.id
      VALUES (${patient}, ${professional}, '2030-05-01 10:00', '2030-05-01 10:50', 150, 'COMPLETED')`);
    const appointment = recordset[0].id;
    const record = () =>
      query(`INSERT INTO appointment_records (appointment_id, professional_id, private_notes, patient_guidance)
             VALUES (${appointment}, ${professional}, N'texto-cifrado', N'outro-texto-cifrado')`);

    await record();
    await assertFails(record(), /uq_appointment_records_appointment/);
    // Prontuário é guarda obrigatória: o banco não deixa apagar a consulta por baixo dele
    await assertFails(query(`DELETE FROM appointments WHERE id = ${appointment}`), /REFERENCE constraint/i);
  }));

test("cadastro para atender online (V003): começa desligado", () =>
  inTransaction(async (query) => {
    const { professional } = await createPatientAndProfessional(query);
    const { recordset } = await query(
      `SELECT telehealth_registered, telehealth_declared_at FROM professionals WHERE user_id = ${professional}`);
    assert.equal(recordset[0].telehealth_registered, false);
    assert.equal(recordset[0].telehealth_declared_at, null);
  }));

test("versão da sessão (V004): começa em 0", () =>
  inTransaction(async (query) => {
    await query("INSERT INTO users (name, email, role) VALUES (N'Sessao', 'sessao@teste.local', 'PATIENT')");
    const { recordset } = await query("SELECT session_version FROM users WHERE email = 'sessao@teste.local'");
    assert.equal(recordset[0].session_version, 0);
  }));

test("questionário inicial (V005): um por paciente e só com respostas válidas", () =>
  inTransaction(async (query) => {
    const { patient } = await createPatientAndProfessional(query);
    const insert = (activity, sleep) =>
      query(`INSERT INTO patient_intakes (patient_id, goals, meals_per_day, water_liters_per_day, activity_level, sleep_quality, stress_level)
             VALUES (${patient}, 'EMAGRECER', 4, 1.5, '${activity}', ${sleep}, 3)`);
    await assertFails(insert("ATLETA", 3), /ck_patient_intakes_activity/);
    await assertFails(insert("LEVE", 9), /ck_patient_intakes_sleep/);
    await insert("LEVE", 3);
    await assertFails(insert("LEVE", 3), /PRIMARY KEY|duplicate key/i);
  }));

test("triagem (V005): uma por consulta e protege a consulta contra exclusão", () =>
  inTransaction(async (query) => {
    const { patient, professional } = await createPatientAndProfessional(query);
    const { recordset } = await query(`
      INSERT INTO appointments (patient_id, professional_id, starts_at, ends_at, price)
      OUTPUT inserted.id
      VALUES (${patient}, ${professional}, '2030-06-01 10:00', '2030-06-01 10:50', 150)`);
    const appointment = recordset[0].id;
    await assertFails(
      query(`INSERT INTO appointment_screenings (appointment_id, reason, mood_score) VALUES (${appointment}, N'x', 7)`),
      /ck_appointment_screenings_mood/
    );
    await query(`INSERT INTO appointment_screenings (appointment_id, reason, mood_score) VALUES (${appointment}, N'cifrado', 3)`);
    await assertFails(query(`DELETE FROM appointments WHERE id = ${appointment}`), /REFERENCE constraint/i);
  }));

test("lembrete (V006): coluna começa vazia e o índice filtrado existe", () =>
  inTransaction(async (query) => {
    const { patient, professional } = await createPatientAndProfessional(query);
    const { recordset } = await query(`
      INSERT INTO appointments (patient_id, professional_id, starts_at, ends_at, price)
      OUTPUT inserted.reminder_sent_at
      VALUES (${patient}, ${professional}, '2030-07-01 10:00', '2030-07-01 10:50', 150)`);
    assert.equal(recordset[0].reminder_sent_at, null);
    const index = await query("SELECT has_filter FROM sys.indexes WHERE name = 'ix_appointments_reminder'");
    assert.equal(index.recordset[0]?.has_filter, true);
  }));
