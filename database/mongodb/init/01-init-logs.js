// =============================================================
// NutriMente - Banco de logs (MongoDB)
//
// Por que logs no MongoDB e não no SQL Server?
//   - Logs são muitos, chegam o tempo todo e cada um tem campos diferentes
//     (um erro tem stack trace, um login tem IP...). MongoDB guarda
//     "documentos" JSON flexíveis, sem precisar alterar tabela.
//   - Tira a carga de escrita do banco principal.
//   - Tem TTL: apaga logs antigos sozinho.
//
// Conceitos: database -> collection (parecido com tabela) -> document
// (parecido com linha, mas em formato JSON).
//
// A imagem oficial do Mongo executa os arquivos da pasta
// /docker-entrypoint-initdb.d APENAS na primeira vez (volume vazio).
// Para rodar de novo: docker compose down -v (apaga os dados!).
// =============================================================

const dbName = process.env.MONGO_LOGS_DB || "nutrimente_logs";
const appUser = process.env.MONGO_APP_USER;
const appPassword = process.env.MONGO_APP_PASSWORD;

// "db" começa no banco admin; getSiblingDB troca para o banco de logs
const logsDb = db.getSiblingDB(dbName);

// Usuário da aplicação: só lê/grava no banco de logs (não é o root)

logsDb.createUser({
  user: appUser,
  pwd: appPassword,
  roles: [{ role: "readWrite", db: dbName }],
});

const LEVELS = ["TRACE", "DEBUG", "INFO", "WARN", "ERROR", "FATAL"];
const SERVICES = ["api-java", "logs-node", "web-next"];
const DAY = 60 * 60 * 24; // segundos em um dia (usado no TTL)

// COMO LER CADA BLOCO ABAIXO
//   createCollection + $jsonSchema: o Mongo recusa documentos fora do
//     formato (campos obrigatórios em "required", tipos em bsonType e
//     valores permitidos em enum). Evita log "lixo".
//   createIndex({ timestamp: 1 }, { expireAfterSeconds }): índice TTL.
//     O Mongo apaga sozinho documentos mais velhos que o prazo.
//     Guardar dados pessoais além do necessário fere a LGPD.
//   Demais createIndex: aceleram as buscas mais comuns (1 = crescente,
//     -1 = decrescente). sparse = só indexa quem tem o campo.

// Logs técnicos das aplicações (erros, requisições, performance) - 90 dias
logsDb.createCollection("application_logs", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["timestamp", "level", "service", "message"],
      properties: {
        timestamp: { bsonType: "date" },
        level: { enum: LEVELS },
        service: { enum: SERVICES },
        message: { bsonType: "string" },
        logger: { bsonType: "string" },
        traceId: { bsonType: "string" },
        userId: { bsonType: ["long", "int", "null"] },
        http: {
          bsonType: "object",
          properties: {
            method: { bsonType: "string" },
            path: { bsonType: "string" },
            status: { bsonType: "int" },
            durationMs: { bsonType: ["int", "long", "double"] },
          },
        },
        error: {
          bsonType: "object",
          properties: {
            type: { bsonType: "string" },
            message: { bsonType: "string" },
            stack: { bsonType: "string" },
          },
        },
        context: { bsonType: "object" },
      },
    },
  },
  // moderate = valida inserts e updates de documentos que já eram válidos
  validationLevel: "moderate",
});
logsDb.application_logs.createIndex({ timestamp: 1 }, { expireAfterSeconds: 90 * DAY });
logsDb.application_logs.createIndex({ service: 1, level: 1, timestamp: -1 });
logsDb.application_logs.createIndex({ traceId: 1 }, { sparse: true });

// Tentativas de login / logout / recuperação de senha - 1 ano.
// O índice por ip + success ajuda a detectar força bruta
// (muitas falhas de login vindas do mesmo IP).
logsDb.createCollection("access_logs", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["timestamp", "event", "success"],
      properties: {
        timestamp: { bsonType: "date" },
        event: { enum: ["LOGIN", "LOGIN_GOOGLE", "LOGOUT", "PASSWORD_RESET_REQUEST", "PASSWORD_RESET", "TOKEN_REFRESH"] },
        success: { bsonType: "bool" },
        userId: { bsonType: ["long", "int", "null"] },
        email: { bsonType: "string" },
        ip: { bsonType: "string" },
        userAgent: { bsonType: "string" },
        failureReason: { bsonType: "string" },
      },
    },
  },
});
logsDb.access_logs.createIndex({ timestamp: 1 }, { expireAfterSeconds: 365 * DAY });
logsDb.access_logs.createIndex({ userId: 1, timestamp: -1 });
logsDb.access_logs.createIndex({ ip: 1, success: 1, timestamp: -1 });

// Trilha de auditoria LGPD: quem acessou/alterou dados pessoais e de saúde - 5 anos.
// actorId = quem fez a ação; subjectUserId = de quem são os dados.
// Permite responder ao titular "quem viu meus dados?" (LGPD, art. 18).
// Nunca grave o conteúdo sensível em si (ex.: anotação da consulta), só
// O QUE foi acessado (entity + entityId).
logsDb.createCollection("audit_logs", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["timestamp", "actorId", "action", "entity", "entityId"],
      properties: {
        timestamp: { bsonType: "date" },
        actorId: { bsonType: ["long", "int"] },
        actorRole: { enum: ["PATIENT", "PROFESSIONAL", "ADMIN", "SYSTEM"] },
        action: { enum: ["CREATE", "READ", "UPDATE", "DELETE", "EXPORT", "ANONYMIZE", "CONSENT_GRANTED", "CONSENT_REVOKED"] },
        entity: { bsonType: "string" },
        entityId: { bsonType: ["long", "int", "string"] },
        subjectUserId: { bsonType: ["long", "int", "null"] },
        changes: { bsonType: "object" },
        ip: { bsonType: "string" },
      },
    },
  },
});
logsDb.audit_logs.createIndex({ timestamp: 1 }, { expireAfterSeconds: 5 * 365 * DAY });
logsDb.audit_logs.createIndex({ subjectUserId: 1, timestamp: -1 });
logsDb.audit_logs.createIndex({ entity: 1, entityId: 1, timestamp: -1 });

print(`[nutrimente] Banco de logs '${dbName}' inicializado.`);
