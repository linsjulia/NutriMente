#!/bin/bash
# =============================================================
# Script executado toda vez que o container do SQL Server liga.
#
# 1. Liga o SQL Server em segundo plano.
# 2. Espera ele aceitar conexões.
# 3. Se o banco NutriMente ainda NÃO existe (primeira vez), roda os
#    scripts .sql em ordem alfabética (01-, 02-, 03-...).
# 4. Fica "segurando" o processo do SQL Server para o container não parar.
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

# Mantém o container vivo enquanto o SQL Server estiver rodando
wait $SQL_PID
