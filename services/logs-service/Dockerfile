# =============================================================
# Imagem do serviço de logs (Node.js)
# =============================================================

# "alpine" = versão enxuta do Linux, deixa a imagem bem menor
FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production

# Copia primeiro só o package.json/lock e instala as dependências.
# O Docker guarda cada passo em cache: se só o código mudar, ele reaproveita
# o npm ci e o build fica muito mais rápido.
# npm ci instala exatamente as versões do package-lock.json;
# --omit=dev não instala dependências de desenvolvimento.
COPY package*.json ./
RUN npm ci --omit=dev

COPY src/ ./src/

# Roda com o usuário "node" (sem privilégios de root), por segurança
USER node
EXPOSE 4000

# Docker consulta /health para saber se o serviço está saudável
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=5 \
    CMD wget -qO- http://localhost:4000/health || exit 1

CMD ["node", "src/server.js"]
