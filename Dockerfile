# =============================================================
# Imagem do SITE (Next.js) para produção.
# Usada pelo docker-compose.prod.yml (serviço "web").
#
# Três etapas ("multi-stage"): a imagem final leva só o resultado do
# build (.next/standalone), sem o código-fonte e sem as ferramentas de
# desenvolvimento. Fica bem menor e mais segura.
# =============================================================

# 1) Instala as dependências (camada separada: só refaz se o package-lock mudar)
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# 2) Gera o build de produção
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Liga o modo "standalone" do next.config.ts (só para a imagem Docker)
ENV NEXT_OUTPUT=standalone
RUN npm run build

# 3) Imagem final: só o necessário para rodar
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Roda com um usuário comum, nunca como root
RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs

# O "standalone" não inclui public/ nem .next/static: copiamos à parte
COPY --from=build /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
    CMD wget -qO- http://127.0.0.1:3000/ > /dev/null || exit 1

CMD ["node", "server.js"]
