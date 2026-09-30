// =============================================================
// Testes de integração do MongoDB (banco de logs)
//
// Conectam no Mongo REAL com o usuário da aplicação e conferem:
// validação dos documentos ($jsonSchema), índices TTL (expiração
// automática) e permissões. Os documentos criados são apagados no final.
//
// Rodar (com os containers ligados):  cd database/tests && npm test
// =============================================================

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { MongoClient } from "mongodb";

const DB_NAME = process.env.MONGO_LOGS_DB || "nutrimente_logs";
// Marca que identifica os documentos criados por este teste (para limpar depois)
const TEST_MARKER = `teste-integracao-${Date.now()}`;
const DAY = 60 * 60 * 24;

let client;
let db;

before(async () => {
  const user = encodeURIComponent(process.env.MONGO_APP_USER);
  const password = encodeURIComponent(process.env.MONGO_APP_PASSWORD);
  const port = process.env.MONGO_PORT || 27017;
  client = await MongoClient.connect(`mongodb://${user}:${password}@localhost:${port}/${DB_NAME}`);
  db = client.db(DB_NAME);
});

after(async () => {
  await db.collection("application_logs").deleteMany({ traceId: TEST_MARKER });
  await db.collection("access_logs").deleteMany({ userAgent: TEST_MARKER });
  await db.collection("audit_logs").deleteMany({ entity: TEST_MARKER });
  await client?.close();
});

/** Garante que o Mongo recusou o documento pela validação (código 121) */
async function assertRejected(promise) {
  await assert.rejects(promise, (error) => {
    assert.equal(error.code, 121, "esperava erro de validação do documento (121)");
    return true;
  });
}

// -------------------------------------------------------------

test("as três collections de log existem", async () => {
  const names = (await db.listCollections().toArray()).map((c) => c.name).sort();
  assert.deepEqual(names, ["access_logs", "application_logs", "audit_logs"]);
});

test("índices TTL apagam logs antigos no prazo certo", async () => {
  const ttl = async (collection) => {
    const indexes = await db.collection(collection).indexes();
    return indexes.find((index) => index.expireAfterSeconds !== undefined)?.expireAfterSeconds;
  };
  assert.equal(await ttl("application_logs"), 90 * DAY);
  assert.equal(await ttl("access_logs"), 365 * DAY);
  assert.equal(await ttl("audit_logs"), 5 * 365 * DAY);
});

test("application_logs aceita log válido e recusa log fora do formato", async () => {
  const logs = db.collection("application_logs");
  await logs.insertOne({
    timestamp: new Date(),
    level: "ERROR",
    service: "api-java",
    message: "Falha ao salvar consulta",
    traceId: TEST_MARKER,
  });

  // Falta "message" (campo obrigatório)
  await assertRejected(logs.insertOne({ timestamp: new Date(), level: "INFO", service: "api-java", traceId: TEST_MARKER }));
  // Nível inexistente
  await assertRejected(
    logs.insertOne({ timestamp: new Date(), level: "SUPER", service: "api-java", message: "x", traceId: TEST_MARKER })
  );
  // timestamp como texto: o TTL não funcionaria
  await assertRejected(
    logs.insertOne({ timestamp: "2026-01-01", level: "INFO", service: "api-java", message: "x", traceId: TEST_MARKER })
  );
});

test("access_logs registra tentativas de login", async () => {
  const logs = db.collection("access_logs");
  await logs.insertOne({ timestamp: new Date(), event: "LOGIN", success: false, email: "a@b.com", ip: "10.0.0.1", userAgent: TEST_MARKER });
  await assertRejected(logs.insertOne({ timestamp: new Date(), event: "INVADIR", success: true, userAgent: TEST_MARKER }));

  const failures = await logs.countDocuments({ ip: "10.0.0.1", success: false, userAgent: TEST_MARKER });
  assert.equal(failures, 1);
});

test("audit_logs exige quem fez, o quê e em qual registro (LGPD)", async () => {
  const logs = db.collection("audit_logs");
  await logs.insertOne({
    timestamp: new Date(),
    actorId: 2,
    actorRole: "PROFESSIONAL",
    action: "READ",
    entity: TEST_MARKER,
    entityId: 10,
    subjectUserId: 1,
  });
  // Sem actorId não dá para saber quem acessou
  await assertRejected(logs.insertOne({ timestamp: new Date(), action: "READ", entity: TEST_MARKER, entityId: 10 }));
});

test("usuário da aplicação não tem acesso de administrador", async () => {
  // Qualquer usuário pode listar bancos, mas só enxerga os que tem permissão
  const { databases } = await client.db("admin").command({ listDatabases: 1, nameOnly: true });
  assert.deepEqual(databases.map((d) => d.name), [DB_NAME]);

  await assert.rejects(client.db("admin").collection("system.users").findOne(), /not authorized/i);
  await assert.rejects(db.command({ createUser: "invasor", pwd: "x", roles: [] }), /not authorized/i);
});
