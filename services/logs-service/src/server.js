// =============================================================
// NutriMente - Serviço de logs (Node.js + Express + MongoDB)
//
// Papel na arquitetura:
//   Next.js (front) ──► API Java (Spring Boot) ──► SQL Server (dados)
//                              │
//                              └──► ESTE serviço (Node) ──► MongoDB (logs)
//
// A API Java (e, se precisar, o Next) envia logs por HTTP para cá.
// Centralizar os logs num serviço separado evita que cada aplicação
// precise saber falar com o MongoDB e permite trocar o banco de logs
// sem mexer nas outras aplicações.
//
// Este arquivo só LIGA o serviço (conecta no banco e abre a porta).
// As rotas ficam em app.js.
// =============================================================

import { MongoClient } from "mongodb";
import { createApp } from "./app.js";

// Configuração vem de variáveis de ambiente (definidas no docker-compose.yml
// a partir do .env). Nunca coloque senha direto no código.
const {
  PORT = "4000",
  MONGO_URI,
  MONGO_LOGS_DB = "nutrimente_logs",
  LOGS_API_KEY,
} = process.env;

if (!MONGO_URI || !LOGS_API_KEY) {
  console.error("[logs-service] MONGO_URI e LOGS_API_KEY são obrigatórios");
  process.exit(1);
}

// Uma única conexão (com pool interno) é aberta ao ligar o serviço e
// reaproveitada em todas as requisições. Abrir conexão a cada request é lento.
const client = new MongoClient(MONGO_URI);
await client.connect();

const app = createApp({ db: client.db(MONGO_LOGS_DB), apiKey: LOGS_API_KEY });

const server = app.listen(Number(PORT), () => {
  console.log(`[logs-service] ouvindo na porta ${PORT}`);
});

// Desligamento limpo: quando o Docker para o container (SIGTERM), termina
// as requisições em andamento e fecha a conexão com o Mongo antes de sair.
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    server.close(() => client.close().then(() => process.exit(0)));
  });
}
