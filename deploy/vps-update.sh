#!/usr/bin/env bash
# Uso na VPS (pasta do clone git, ex.: /root/visohelp-git):
#   bash deploy/vps-update.sh
set -eu
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"
git pull origin main
# Evitar falha do migrate-vps.sh se o ficheiro tiver CRLF (Windows)
sed -i 's/\r$//' deploy/migrate-vps.sh
bash deploy/migrate-vps.sh
docker compose build
docker compose up -d
docker compose ps
