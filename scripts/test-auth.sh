#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"

cd "$PROJECT_ROOT"

echo "Starting the dedicated test PostgreSQL service..."
docker compose -f docker-compose.test.yml up -d

cd "$BACKEND_DIR"

if [[ ! -f .env.test ]]; then
  echo "backend/.env.test is missing."
  echo "Create it with: cp backend/.env.test.example backend/.env.test"
  exit 1
fi

echo "Loading test environment..."
set -a
source .env.test
set +a

echo "Applying database migrations..."
npx prisma migrate deploy

echo "Running backend tests..."
npm test
