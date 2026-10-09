#!/usr/bin/env bash
# =============================================================
# Gera o .env de PRODUÇÃO com todas as senhas e chaves aleatórias.
#
# Uso (no servidor, na pasta do projeto):
#   bash deploy/gerar-env.sh nutrimente.tech seu-email@exemplo.com
#
# - Parte do .env.production.example e troca cada "TROQUE" por um valor
#   forte gerado com openssl (hex: os caracteres / + = do base64 quebram o
#   endereço do MongoDB). As senhas do SQL Server ganham "Aa1!" no fim,
#   porque ele exige maiúscula, minúscula, número e símbolo.
# - NÃO sobrescreve um .env que já existe: as senhas dos bancos ficam
#   gravadas na primeira subida, e trocar depois quebra o acesso.
# - Só o e-mail (usuário e senha SMTP) fica para você preencher.
#
# Para testar sem mexer no .env: ENV_FILE=/tmp/teste.env bash deploy/gerar-env.sh ...
# =============================================================
set -euo pipefail
cd "$(dirname "$0")/.."

DOMAIN="${1:-}"
ADMIN_EMAIL="${2:-}"
OUT="${ENV_FILE:-.env}"

if [ -z "$DOMAIN" ] || [ -z "$ADMIN_EMAIL" ]; then
    echo "Uso: bash deploy/gerar-env.sh <domínio> <e-mail do admin>"
    echo "Ex.: bash deploy/gerar-env.sh nutrimente.tech fulano@gmail.com"
    exit 1
fi
if [ -e "$OUT" ]; then
    echo "ERRO: $OUT já existe. Não sobrescrevo (as senhas dos bancos já podem estar em uso)."
    echo "Se é mesmo a primeira instalação, apague-o antes: rm $OUT"
    exit 1
fi

hex() { openssl rand -hex "$1"; }
ADMIN_PASSWORD="Nm$(hex 6)a1"
RECORDS_KEY="$(hex 32)"

# Cada "chave=valor" abaixo substitui a linha correspondente do modelo
declare -A VALUES=(
    [DOMAIN]="$DOMAIN"
    [MSSQL_SA_PASSWORD]="$(hex 24)Aa1!"
    [NUTRIMENTE_DB_PASSWORD]="$(hex 24)Aa1!"
    [MONGO_ROOT_PASSWORD]="$(hex 24)"
    [MONGO_APP_PASSWORD]="$(hex 24)"
    [LOGS_API_KEY]="$(hex 24)"
    [JWT_SECRET]="$(hex 32)"
    [RECORDS_ENCRYPTION_KEY]="$RECORDS_KEY"
    [ADMIN_EMAIL]="$ADMIN_EMAIL"
    [ADMIN_PASSWORD]="$ADMIN_PASSWORD"
    [MAIL_FROM]="NutriMente <nao-responda@$DOMAIN>"
)

umask 077   # o arquivo nasce legível só pelo dono (equivale a chmod 600)
while IFS= read -r line || [ -n "$line" ]; do
    key="${line%%=*}"
    if [[ "$line" != \#* && "$line" == *=* && -v "VALUES[$key]" ]]; then
        echo "$key=${VALUES[$key]}"
    else
        echo "$line"
    fi
done < .env.production.example | tr -d '\r' > "$OUT"
chmod 600 "$OUT"

echo "✔ $OUT criado para $DOMAIN."
echo
echo "Falta preencher (e-mail): MAIL_USERNAME e MAIL_PASSWORD  →  nano $OUT"
echo
echo "GUARDE AGORA, fora do servidor (gerenciador de senhas):"
echo "  Admin:                  $ADMIN_EMAIL  /  $ADMIN_PASSWORD"
echo "  RECORDS_ENCRYPTION_KEY: $RECORDS_KEY"
echo "  (sem essa chave, os dados cifrados do banco e dos backups não abrem)"
