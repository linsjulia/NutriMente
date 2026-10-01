// =============================================================
// Testes de integração do serviço de logs
//
// Sobem a API de verdade (numa porta livre qualquer) conectada no MongoDB
// REAL do docker compose e fazem requisições HTTP, como a API Java faria.
// Testam o caminho inteiro: HTTP -> Express -> MongoDB -> resposta.
//
// Os documentos criados são marcados e apagados no final.
//
// Rodar (com os containers ligados):
//   cd services/logs-service && npm install && npm test
// =============================================================

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { MongoClient } from "mongodb";
import { createApp, MAX_BATCH } from "../src/app.js";

const API_KEY = "chave-de-teste";
const DB_NAME = process.env.MONGO_LOGS_DB || "nutrimente_logs";
// Marca e ids "impossíveis" para não misturar com dados reais
const MARKER = `teste-integracao-${Date.now()}`;
const SUBJECT_ID = 900_000_000 + Math.floor(Math.random() * 1_000_000);

let client;
let db;
let server;
let baseUrl;

before(async () => {
  const user = encodeURIComponent(process.env.MONGO_APP_USER);
  const password = encodeURIComponent(process.env.MONGO_APP_PASSWORD);
  const port = process.env.MONGO_PORT || 27017;
  client = await MongoClient.connect(`mongodb://${user}:${password}@localhost:${port}/${DB_NAME}`);
  db = client.db(DB_NAME);

  // listen(0) = o sistema escolhe uma porta livre
  server = createApp({ db, apiKey: API_KEY }).listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://localhost:${server.address().port}`;
});

after(async () => {
  await db.collection("application_logs").deleteMany({ traceId: MARKER });
  await db.collection("access_logs").deleteMany({ userAgent: MARKER });
  await db.collection("audit_logs").deleteMany({ entity: MARKER });
  server?.close();
  await client?.close();
});

/** Faz uma requisição à API. Por padrão envia a chave correta. */
async function api(path, { method = "GET", body, apiKey = API_KEY, rawBody } = {}) {
  const response = await fetch(baseUrl + path, {
    method,
    headers: { "content-type": "application/json", ...(apiKey && { "x-api-key": apiKey }) },
    body: rawBody ?? (body === undefined ? undefined : JSON.stringify(body)),
  });
  return { status: response.status, body: await response.json() };
}

const auditEntry = (overrides = {}) => ({
  actorId: 2,
  actorRole: "PROFESSIONAL",
  action: "READ",
  entity: MARKER,
  entityId: 10,
  subjectUserId: SUBJECT_ID,
  ...overrides,
});

// -------------------------------------------------------------

test("GET /health responde sem chave", async () => {
  const { status, body } = await api("/health", { apiKey: null });
  assert.equal(status, 200);
  assert.deepEqual(body, { status: "ok" });
});

test("rotas de log exigem a chave x-api-key", async () => {
  assert.equal((await api("/logs/audit/1", { apiKey: null })).status, 401);
  assert.equal((await api("/logs/audit/1", { apiKey: "chave-errada" })).status, 401);
  assert.equal((await api("/logs/audit", { method: "POST", body: auditEntry(), apiKey: null })).status, 401);
});

test("POST /logs/application grava no MongoDB com data e IP preenchidos", async () => {
  const { status, body } = await api("/logs/application", {
    method: "POST",
    body: { level: "ERROR", service: "api-java", message: "Falha ao salvar", traceId: MARKER },
  });
  assert.equal(status, 201);
  assert.equal(body.inserted, 1);

  const saved = await db.collection("application_logs").findOne({ traceId: MARKER });
  assert.ok(saved.timestamp instanceof Date, "timestamp deve ser Date para o TTL funcionar");
  assert.ok(saved.ip, "ip de origem deve ser preenchido");
});

test("POST /logs/access aceita envio em lote", async () => {
  const batch = Array.from({ length: 3 }, (_, i) => ({
    event: "LOGIN",
    success: i === 2,
    email: "maria@exemplo.com",
    userAgent: MARKER,
  }));
  const { status, body } = await api("/logs/access", { method: "POST", body: batch });
  assert.equal(status, 201);
  assert.equal(body.inserted, 3);
  assert.equal(await db.collection("access_logs").countDocuments({ userAgent: MARKER, success: false }), 2);
});

test("log fora do formato é recusado com 400 (validação do MongoDB)", async () => {
  const { status } = await api("/logs/audit", { method: "POST", body: { action: "READ", entity: MARKER } });
  assert.equal(status, 400);
});

test("lote com um log inválido grava os válidos e avisa", async () => {
  const { status, body } = await api("/logs/audit", {
    method: "POST",
    body: [auditEntry({ entityId: 1 }), auditEntry({ action: "HACK" }), auditEntry({ entityId: 2 })],
  });
  assert.equal(status, 400);
  assert.equal(body.inserted, 2);
});

test("tipo de log desconhecido retorna 404", async () => {
  const { status } = await api("/logs/qualquer", { method: "POST", body: {} });
  assert.equal(status, 404);
});

test(`lote vazio ou com mais de ${MAX_BATCH} logs retorna 400`, async () => {
  assert.equal((await api("/logs/audit", { method: "POST", body: [] })).status, 400);
  const tooMany = Array.from({ length: MAX_BATCH + 1 }, () => auditEntry());
  assert.equal((await api("/logs/audit", { method: "POST", body: tooMany })).status, 400);
});

test("JSON mal formado retorna 400, não 500", async () => {
  const { status } = await api("/logs/audit", { method: "POST", rawBody: "{ isso não é json" });
  assert.equal(status, 400);
});

test("GET /logs/audit/:userId lista só os acessos daquele titular, do mais recente ao mais antigo", async () => {
  await api("/logs/audit", {
    method: "POST",
    body: [
      auditEntry({ entityId: 100, timestamp: "2026-01-01T10:00:00Z" }),
      auditEntry({ entityId: 200, timestamp: "2026-02-01T10:00:00Z" }),
      auditEntry({ entityId: 300, subjectUserId: SUBJECT_ID + 1 }), // outro titular
    ],
  });

  const { status, body } = await api(`/logs/audit/${SUBJECT_ID}?limit=2`);
  assert.equal(status, 200);
  assert.equal(body.length, 2);
  assert.ok(body.every((log) => log.subjectUserId === SUBJECT_ID));
  assert.ok(new Date(body[0].timestamp) >= new Date(body[1].timestamp), "deve vir em ordem decrescente");
});

test("GET /logs/audit/:userId com id inválido retorna 400", async () => {
  assert.equal((await api("/logs/audit/abc")).status, 400);
});
