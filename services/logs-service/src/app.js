// =============================================================
// NutriMente - Serviço de logs: ROTAS (Express)
//
// Este arquivo só monta a aplicação; quem conecta no banco e liga o
// servidor é o server.js. Separar assim permite que os testes criem a
// aplicação com um banco de teste e numa porta qualquer.
//
// Rotas:
//   GET  /health               -> verifica se o serviço e o Mongo estão ok
//   POST /logs/application     -> logs técnicos (erros, requisições)
//   POST /logs/access          -> logins, logouts, recuperação de senha
//   POST /logs/audit           -> auditoria LGPD (acesso a dados pessoais)
//   GET  /logs/audit/:userId   -> quem acessou os dados de um usuário
//
// Todas as rotas /logs exigem o header "x-api-key" com a chave configurada.
// =============================================================

import express from "express";

/** Máximo de logs aceitos numa única requisição (envio em lote) */
export const MAX_BATCH = 500;

/**
 * Cria a aplicação Express.
 * @param {object} options
 * @param {import("mongodb").Db} options.db  banco de logs já conectado
 * @param {string} options.apiKey            chave exigida no header x-api-key
 */
export function createApp({ db, apiKey }) {
  // Mapeia o tipo da URL (/logs/:type) para a collection do Mongo.
  // Só esses três tipos são aceitos; qualquer outro retorna 404.
  const collections = {
    application: db.collection("application_logs"),
    access: db.collection("access_logs"),
    audit: db.collection("audit_logs"),
  };

  const app = express();
  // Converte o corpo JSON da requisição em objeto. O limite evita que alguém
  // envie um corpo gigante e derrube o serviço.
  app.use(express.json({ limit: "256kb" }));

  // Health check fica ANTES da checagem de chave: o Docker precisa acessá-lo
  // sem autenticação para saber se o container está saudável.
  app.get("/health", async (_req, res) => {
    await db.command({ ping: 1 });
    res.json({ status: "ok" });
  });

  // Middleware = função que roda antes das rotas abaixo dela.
  // Este bloqueia quem não mandar a chave correta. Logs têm dados pessoais
  // (IP, e-mail), então não podem ficar abertos (LGPD).
  app.use((req, res, next) => {
    if (req.get("x-api-key") !== apiKey) {
      return res.status(401).json({ error: "unauthorized" });
    }
    next();
  });

  // POST /logs/{application|access|audit}
  // Aceita um objeto ou um array (lote). Mandar em lote é bem mais eficiente:
  // a API Java pode juntar vários logs e enviar de uma vez.
  app.post("/logs/:type", async (req, res) => {
    const collection = collections[req.params.type];
    if (!collection) return res.status(404).json({ error: "unknown log type" });

    const entries = (Array.isArray(req.body) ? req.body : [req.body]).map((entry) => withDefaults(entry, req));
    if (entries.length === 0 || entries.length > MAX_BATCH) {
      return res.status(400).json({ error: `send between 1 and ${MAX_BATCH} entries` });
    }

    try {
      // ordered: false -> se um documento do lote for inválido, os outros
      // ainda são gravados.
      const result = await collection.insertMany(entries, { ordered: false });
      res.status(201).json({ inserted: result.insertedCount });
    } catch (err) {
      // Código 121 = documento rejeitado pela validação ($jsonSchema) da
      // collection -> erro de quem enviou (400), não do servidor (500).
      if (err.code === 121 || err.writeErrors) {
        return res.status(400).json({ error: "invalid log entry", inserted: err.result?.insertedCount ?? 0 });
      }
      throw err;
    }
  });

  // GET /logs/audit/:userId?limit=100
  // Lista os acessos aos dados de um titular, do mais recente ao mais antigo.
  // Atende ao direito do titular de saber quem acessou seus dados (LGPD, art. 18).
  app.get("/logs/audit/:userId", async (req, res) => {
    const userId = Number(req.params.userId);
    if (!Number.isSafeInteger(userId)) return res.status(400).json({ error: "invalid userId" });

    // Limite máximo para ninguém puxar a collection inteira de uma vez
    const limit = Math.min(Number(req.query.limit) || 100, 1000);
    const logs = await collections.audit
      .find({ subjectUserId: userId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
    res.json(logs);
  });

  // Tratador de erros genérico: qualquer exceção não tratada vira 500
  // sem vazar detalhes internos para quem chamou.
  app.use((err, _req, res, _next) => {
    // JSON mal formado no corpo da requisição é erro de quem enviou
    if (err.type === "entity.parse.failed") return res.status(400).json({ error: "invalid JSON" });
    console.error("[logs-service]", err);
    res.status(500).json({ error: "internal error" });
  });

  return app;
}

// Garante que todo log tenha data (o Mongo precisa de Date, não de texto,
// para o TTL funcionar) e IP de origem.
function withDefaults(entry, req) {
  return {
    ...entry,
    timestamp: entry.timestamp ? new Date(entry.timestamp) : new Date(),
    ip: entry.ip ?? req.ip,
  };
}
