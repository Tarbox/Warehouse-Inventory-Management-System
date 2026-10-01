#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"

cd "$PROJECT_ROOT"

echo "Starting PostgreSQL..."
docker compose up -d postgres

cd "$BACKEND_DIR"

echo "Loading test environment..."
set -a
source .env.test
set +a

echo "Checking test database connection..."
npx prisma db execute --stdin <<< "SELECT 1;"

echo "Running authentication tests..."
npm test