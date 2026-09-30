# =============================================================
# Imagem do SQL Server do NutriMente
#
# Um Dockerfile é a "receita" de uma imagem: parte de uma imagem pronta
# (FROM), copia nossos arquivos (COPY), roda comandos (RUN) e define o que
# acontece quando o container liga (ENTRYPOINT).
#
# A imagem oficial da Microsoft só liga o SQL Server; ela NÃO executa
# scripts .sql sozinha. Por isso usamos o entrypoint.sh, que liga o banco
# e roda os scripts da pasta scripts/ na primeira vez.
# =============================================================

# Imagem oficial do SQL Server 2022 (Linux)
FROM mcr.microsoft.com/mssql/server:2022-latest

# Precisamos de root só para copiar os arquivos e ajustar permissões
USER root

WORKDIR /usr/src/nutrimente

COPY scripts/ ./scripts/
COPY entrypoint.sh ./entrypoint.sh

# Quem edita no Windows salva quebras de linha como CRLF (\r\n), e o Linux
# não entende o \r no .sh. O sed remove isso por segurança.
# chmod +x torna o script executável; chown passa os arquivos para o usuário
# "mssql", que é quem roda o SQL Server dentro da imagem.
RUN sed -i 's/\r$//' ./entrypoint.sh ./scripts/*.sql \
    && chmod +x ./entrypoint.sh \
    && chown -R mssql:root /usr/src/nutrimente

# Volta para o usuário sem privilégios (boa prática de segurança)
USER mssql

# ACCEPT_EULA: aceita a licença da Microsoft (obrigatório).
# MSSQL_PID=Developer: edição gratuita com todos os recursos, só para
# desenvolvimento. Em produção seria Express (grátis, limitada) ou paga.
ENV ACCEPT_EULA=Y \
    MSSQL_PID=Developer

# Porta padrão do SQL Server
EXPOSE 1433

# O Docker roda esse comando periodicamente para saber se o banco está de pé.
# O status "healthy" aparece no `docker compose ps` e é usado pelo compose
# para só ligar a API depois que o banco estiver pronto.
HEALTHCHECK --interval=10s --timeout=5s --start-period=40s --retries=10 \
    CMD /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -Q "SELECT 1" -b -o /dev/null || exit 1

ENTRYPOINT ["/usr/src/nutrimente/entrypoint.sh"]
