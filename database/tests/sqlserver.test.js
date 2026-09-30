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

test("todas as 24 tabelas foram criadas", async () => {
  const { recordset } = await pool.query("SELECT COUNT(*) AS total FROM sys.tables");
  assert.equal(recordset[0].total, 24);
});

test("seed cadastrou as 12 especialidades (6 de cada profissão)", async () => {
  const { recordset } = await pool.query(
    "SELECT professional_type, COUNT(*) AS total FROM specialties GROUP BY professional_type ORDER BY professional_type"
  );
  assert.deepEqual(
    recordset.map((r) => [r.professional_type, r.total]),
    [["NUTRICIONISTA", 6], ["PSICOLOGO", 6]]
  );
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
