#!/bin/sh
set -e

echo "Ejecutando migraciones..."
node /app/packages/database/dist/run-migrations.js

if [ "${RUN_SEED:-true}" != "false" ]; then
  echo "Ejecutando seed..."
  node /app/packages/database/dist/seeds/run-seed.js
fi

echo "Iniciando API..."
cd /app/apps/api
exec node dist/main.js
