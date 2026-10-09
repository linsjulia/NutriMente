#!/bin/bash
# =============================================================
# Script executado toda vez que o container do SQL Server liga.
#
# 1. Liga o SQL Server em segundo plano.
# 2. Espera ele aceitar conexões.
# 3. Se o banco NutriMente ainda NÃO existe (primeira vez), roda os
#    scripts .sql em ordem alfabética (01-, 02-, 03-...).
# 4. Aplica as MIGRAÇÕES pendentes (pasta migrations/): mudanças no banco
#    feitas depois da primeira versão. Cada uma roda uma vez só, e a tabela
#    schema_migrations guarda quais já foram aplicadas. Assim um banco que
#    já existe é ATUALIZADO sem perder dados (sem "docker compose down -v").
# 5. Marca o banco como pronto (o healthcheck do Dockerfile espera por isso).
# 6. Fica "segurando" o processo do SQL Server para o container não parar.
#
# Os dados ficam no volume "sqlserver-data" (ver docker-compose.yml), então
# desligar/ligar o container NÃO apaga nada. Para recriar o banco do zero:
#   docker compose down -v   (o -v apaga os volumes!)
# =============================================================

# Para o script no primeiro erro (ex.: um .sql com problema)
set -e

# sqlcmd = ferramenta de linha de comando para executar SQL
SQLCMD=/opt/mssql-tools18/bin/sqlcmd
SCRIPTS=/usr/src/nutrimente/scripts
MIGRATIONS=/usr/src/nutrimente/migrations
# Arquivo que avisa o healthcheck: "banco criado E migrações aplicadas"
READY_FILE=/tmp/nutrimente-ready
rm -f "$READY_FILE"

# O "&" roda em segundo plano; $! guarda o id do processo
/opt/mssql/bin/sqlservr &
SQL_PID=$!

echo "[nutrimente] Aguardando o SQL Server iniciar..."
# Tenta um "SELECT 1" a cada 2 segundos, por até 2 minutos
for i in {1..60}; do
    if $SQLCMD -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -Q "SELECT 1" -b -o /dev/null 2>/dev/null; then
        break
    fi
    sleep 2
done

# Pergunta ao servidor se o banco já existe (retorna 0 ou 1).
# -h -1 tira o cabeçalho e -W os espaços, para sobrar só o número.
DB_EXISTS=$($SQLCMD -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -h -1 -W -b \
    -Q "SET NOCOUNT ON; SELECT COUNT(*) FROM sys.databases WHERE name = 'NutriMente'")

if [ "$DB_EXISTS" = "0" ]; then
    echo "[nutrimente] Criando banco de dados..."
    for script in "$SCRIPTS"/*.sql; do
        echo "[nutrimente] Executando $(basename "$script")"
        # Flags do sqlcmd:
        #   -C  confia no certificado autoassinado do container
        #   -b  aborta se o SQL der erro
        #   -I  liga QUOTED_IDENTIFIER (obrigatório para índices filtrados)
        #   -v  passa variáveis que o .sql usa como $(APP_USER) e $(APP_PASSWORD)
        $SQLCMD -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -b -I -i "$script" \
            -v APP_USER="$NUTRIMENTE_DB_USER" APP_PASSWORD="$NUTRIMENTE_DB_PASSWORD"
    done
    echo "[nutrimente] Banco de dados criado com sucesso."
else
    echo "[nutrimente] Banco NutriMente já existe, pulando criação."
fi

# ---------------- Migrações ----------------
# Atalho: sqlcmd como administrador, já dentro do banco NutriMente
run_sql() {
    $SQLCMD -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -b -I -d NutriMente "$@"
}

# Tabela de controle: uma linha por migração já aplicada
run_sql -Q "IF OBJECT_ID(N'dbo.schema_migrations') IS NULL
    CREATE TABLE dbo.schema_migrations (
        version     VARCHAR(100) NOT NULL PRIMARY KEY,
        applied_at  DATETIME2(0) NOT NULL CONSTRAINT df_schema_migrations_applied DEFAULT SYSUTCDATETIME()
    );"

# Ordem = nome do arquivo (V002__..., V003__...: o número tem 3 dígitos
# para a ordem alfabética ser a mesma da numérica)
for migration in $(ls "$MIGRATIONS"/V*.sql 2>/dev/null | sort); do
    version=$(basename "$migration" .sql)
    applied=$(run_sql -h -1 -W -Q "SET NOCOUNT ON; SELECT COUNT(*) FROM schema_migrations WHERE version = '$version'")
    if [ "$applied" = "0" ]; then
        echo "[nutrimente] Aplicando migração $version"
        run_sql -i "$migration" -v APP_USER="$NUTRIMENTE_DB_USER"
        run_sql -Q "INSERT INTO schema_migrations (version) VALUES ('$version')"
    fi
done
echo "[nutrimente] Banco atualizado (migrações em dia)."

touch "$READY_FILE"

# Mantém o container vivo enquanto o SQL Server estiver rodando
wait $SQL_PID
