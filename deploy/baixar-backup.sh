#!/usr/bin/env bash
# =============================================================
# Copia o backup MAIS RECENTE do servidor para este computador (rodar no PC,
# no Git Bash ou terminal, com o atalho "ssh nutrimente" configurado).
#
#   bash deploy/baixar-backup.sh                 # para ~/backups-nutrimente
#   bash deploy/baixar-backup.sh D:/backups      # para outra pasta
#
# Backup só no servidor não protege se a máquina for perdida. Rode de tempos
# em tempos (ex.: toda semana). Os arquivos têm dados pessoais (parte cifrada):
# guarde num disco com criptografia (BitLocker) e não compartilhe.
# =============================================================
set -euo pipefail

HOST="${HOST:-nutrimente}"
REMOTE_DIR="${REMOTE_DIR:-backups-nutrimente}"   # relativo à pasta do usuário no servidor
DEST="${1:-$HOME/backups-nutrimente}"

latest="$(ssh "$HOST" "ls -1t $REMOTE_DIR/NutriMente_*.bak 2>/dev/null | head -n 1")"
if [ -z "$latest" ]; then
  echo "Nenhum backup encontrado em $HOST:$REMOTE_DIR" >&2
  exit 1
fi
stamp="$(basename "$latest" .bak)"; stamp="${stamp#NutriMente_}"

mkdir -p "$DEST"
echo "Baixando o backup de $stamp para $DEST ..."
scp -q "$HOST:$REMOTE_DIR/*_$stamp*" "$DEST/"
ls -la "$DEST" | grep "$stamp"
echo "Pronto. Guarde também a RECORDS_ENCRYPTION_KEY (sem ela, os dados cifrados não abrem)."
