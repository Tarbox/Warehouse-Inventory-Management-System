#!/usr/bin/env bash

set -euo pipefail

BACKUP_FILE="${1:-}"
# Check if the backup file argument is provided and exists

if [[ -z "$BACKUP_FILE" ]]; then
  echo "Usage: $0 <backup-file>"
  exit 1
fi
# Check if the backup file exists
if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "Backup file not found: $BACKUP_FILE"
  exit 1
fi

echo "WARNING: this will replace the current database."
read -r -p "Continue? [y/N]: " confirmation

if [[ "$confirmation" != "y" && "$confirmation" != "Y" ]]; then
  echo "Restore cancelled."
  exit 0
fi

echo "Restoring database from: $BACKUP_FILE"
# Restore the PostgreSQL database from the specified backup file
docker compose exec -T postgres \
  sh -c '
    pg_restore \
      -U "$POSTGRES_USER" \
      -d "$POSTGRES_DB" \
      --clean \
      --if-exists \
      --no-owner \
      --no-acl
  ' < "$BACKUP_FILE"

echo "Database restore completed."