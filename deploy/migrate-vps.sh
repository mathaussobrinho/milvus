#!/usr/bin/env bash
set -eu
# Na VPS: cd /root/visohelp && bash deploy/migrate-vps.sh
# Nao use "source .env" para ler POSTGRES_CONNECTION_STRING: o bash parte em ';'.
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$REPO_ROOT/.env"
[[ -f "$ENV_FILE" ]] || { echo "Falta $ENV_FILE"; exit 1; }
LINE="$(grep -E '^POSTGRES_CONNECTION_STRING=' "$ENV_FILE" | head -1)"
CONN="${LINE#POSTGRES_CONNECTION_STRING=}"
CONN="${CONN#\"}"
CONN="${CONN%\"}"
CONN="${CONN#\'}"
CONN="${CONN%\'}"
CONN="$(printf '%s' "$CONN" | tr -d '\r')"
[[ -n "$CONN" ]] || { echo "POSTGRES_CONNECTION_STRING vazio em $ENV_FILE"; exit 1; }
TMP="$(mktemp)"
cleanup() { rm -f "$TMP"; }
trap cleanup EXIT
printf '%s' "$CONN" >"$TMP"
docker run --rm --network visohelp_net \
  -v "$REPO_ROOT:/src" \
  -v "$TMP:/run/migrate-conn.txt:ro" \
  -w /src/apps/backend \
  mcr.microsoft.com/dotnet/sdk:9.0 \
  bash -c 'dotnet tool install --global dotnet-ef --verbosity quiet
export PATH="/root/.dotnet/tools:$PATH"
dotnet restore
CONN="$(tr -d "\r" </run/migrate-conn.txt)"
dotnet ef database update --connection "$CONN"'
