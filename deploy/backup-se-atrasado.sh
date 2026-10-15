#!/usr/bin/env bash
# =============================================================
# Faz o backup só se o último tiver mais de $MAX_HOURS horas (padrão: 23).
# Rodar de HORA EM HORA pelo cron (ver "Backups" em docs/DEPLOY-HOSTINGER.md).
#
# Por quê: um cron fixo às 3h perde o dia em que a máquina está desligada
# nesse horário (a VM Spot do Azure pode ser desligada a qualquer momento).
# Assim, o backup do dia acontece na primeira hora em que ela estiver ligada.
# =============================================================
set -euo pipefail

cd "$(dirname "$0")/.."
BACKUP_DIR="${BACKUP_DIR:-/root/backups-nutrimente}"
MAX_HOURS="${MAX_HOURS:-23}"

latest="$(ls -1t "$BACKUP_DIR"/NutriMente_*.bak 2>/dev/null | head -n 1 || true)"
if [ -n "$latest" ] && [ -n "$(find "$latest" -mmin -$((MAX_HOURS * 60)))" ]; then
  exit 0 # backup recente: nada a fazer
fi

# Logo depois de ligar, os contêineres ainda podem estar subindo
if [ "$(docker inspect -f '{{.State.Health.Status}}' nutrimente-sqlserver 2>/dev/null)" != "healthy" ]; then
  echo "$(date '+%F %T') SQL Server ainda não está pronto; tento na próxima hora."
  exit 0
fi

echo "$(date '+%F %T') Último backup: ${latest:-nenhum}. Fazendo um agora."
exec bash deploy/backup.sh
