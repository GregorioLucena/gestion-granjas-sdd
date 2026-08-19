#!/bin/sh
set -e

# Entorno testing (Railway, rama testing): mismas etapas que produccion,
# con seed siempre activo para el usuario demo del docente.
export RUN_SEED=true
exec /app/scripts/docker-entrypoint-api-prod.sh
