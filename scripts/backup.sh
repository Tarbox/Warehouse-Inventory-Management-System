#!/usr/bin/env bash

set -euo pipefail

BACKUP_DIR="./backups"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="${BACKUP_DIR}/warehouse_${TIMESTAMP}.dump"

mkdir -p "$BACKUP_DIR"

echo "Creating PostgreSQL backup..."

docker compose exec -T postgres \
  sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc --no-owner --no-acl' \
  > "$BACKUP_FILE"

echo "Backup created: $BACKUP_FILE"