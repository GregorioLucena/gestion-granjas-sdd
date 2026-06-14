#!/bin/sh
set -e

cd /app

# Dependencias y symlinks del workspace dentro del contenedor Linux
pnpm install --frozen-lockfile

# Compilar paquetes internos (necesario antes de Nest/Next)
pnpm run build:packages

exec "$@"
