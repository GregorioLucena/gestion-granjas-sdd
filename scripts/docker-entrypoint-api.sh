#!/bin/sh
set -e

echo "Esperando PostgreSQL..."
until pg_isready -h postgres -U "${POSTGRES_USER:-postgres}" > /dev/null 2>&1; do
  sleep 1
done

echo "Ejecutando migraciones..."
cd /app && pnpm db:migrate || true

echo "Iniciando API..."
exec pnpm --filter @gestion-granjas/api run start:dev
