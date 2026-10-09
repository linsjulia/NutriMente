#!/usr/bin/env bash
# =============================================================
# Backup dos dois bancos do NutriMente (rodar NO SERVIDOR).
#
#   bash deploy/backup.sh
#
# Gera em $BACKUP_DIR (padrão: /root/backups-nutrimente):
#   NutriMente_AAAA-MM-DD_HHMM.bak        -> SQL Server (dados da aplicação)
#   logs_AAAA-MM-DD_HHMM.archive.gz       -> MongoDB (logs e auditoria LGPD)
# e apaga os backups com mais de $KEEP_DAYS dias (padrão: 14).
#
# Para rodar todo dia às 3h, veja "Backups" em docs/DEPLOY-HOSTINGER.md.
# =============================================================
set -euo pipefail

cd "$(dirname "$0")/.."
BACKUP_DIR="${BACKUP_DIR:-/root/backups-nutrimente}"
KEEP_DAYS="${KEEP_DAYS:-14}"
STAMP="$(date +%F_%H%M)"

# Lê uma variável do .env (sem "executar" o arquivo: senhas podem ter símbolos)
env_value() { grep -E "^$1=" .env | head -n 1 | cut -d= -f2-; }

mkdir -p "$BACKUP_DIR"

echo "SQL Server..."
docker exec nutrimente-sqlserver mkdir -p /var/opt/mssql/backup
docker exec nutrimente-sqlserver /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P "$(env_value MSSQL_SA_PASSWORD)" -C -b \
  -Q "BACKUP DATABASE NutriMente TO DISK = N'/var/opt/mssql/backup/NutriMente.bak' WITH INIT, CHECKSUM"
docker cp nutrimente-sqlserver:/var/opt/mssql/backup/NutriMente.bak "$BACKUP_DIR/NutriMente_$STAMP.bak"

echo "MongoDB..."
docker exec nutrimente-mongodb mongodump --quiet --archive --gzip \
  --username "$(env_value MONGO_ROOT_USER)" --password "$(env_value MONGO_ROOT_PASSWORD)" \
  --authenticationDatabase admin --db "$(env_value MONGO_LOGS_DB)" \
  > "$BACKUP_DIR/logs_$STAMP.archive.gz"

# Fotos do diário alimentar (volume api-uploads). Já estão cifradas: sem a
# RECORDS_ENCRYPTION_KEY (ou o JWT_SECRET), o backup delas não abre.
echo "Fotos do diário..."
docker exec nutrimente-api tar czf - -C /app/uploads . > "$BACKUP_DIR/fotos_$STAMP.tar.gz"

find "$BACKUP_DIR" -type f -mtime +"$KEEP_DAYS" -delete

echo "Pronto: $BACKUP_DIR"
ls -lh "$BACKUP_DIR" | tail -n 4
