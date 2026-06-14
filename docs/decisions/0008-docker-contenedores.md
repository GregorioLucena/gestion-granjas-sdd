# ADR 0008: Contenedores con Docker

## Estado

Aceptado.

## Contexto

El proyecto adopta un monorepo con backend (`apps/api`), frontend (`apps/web`) y PostgreSQL (`packages/database`). Se requiere:

- Entorno de desarrollo reproducible entre maquinas.
- Misma configuracion para todo el equipo sin instalar PostgreSQL localmente.
- Base clara para despliegue futuro.
- Aislamiento de servicios (BD, API, web).

## Decision

Usar **Docker** y **Docker Compose** como infraestructura estandar del proyecto.

| Aspecto | Decision |
|---------|----------|
| Orquestacion local | Docker Compose |
| Base de datos | PostgreSQL en contenedor |
| Gestor de paquetes | **pnpm** (workspaces en contenedores via Corepack) |
| Desarrollo | `docker-compose.dev.yml` con hot reload |
| Produccion (futuro) | `docker-compose.yml` con imagenes optimizadas |
| Especificacion | `docs/14-infraestructura-docker.md` |

## Servicios

| Servicio | Imagen / build | Puerto host |
|----------|----------------|-------------|
| `postgres` | `postgres:16-alpine` | 5432 |
| `api` | Build `apps/api/Dockerfile.dev` | 3001 |
| `web` | Build `apps/web/Dockerfile.dev` | 3000 |

## Alternativas consideradas

### Instalacion local sin Docker

**Pros:** mas simple al inicio.
**Contras:** dependencias distintas por desarrollador; PostgreSQL manual; difícil onboarding.

### Kubernetes

**Descartado para MVP v1:** complejidad excesiva para equipo pequeno y entorno local.

### Podman

**Descartado:** Docker Compose es mas universal y documentado para este caso.

## Consecuencias

- Toda la configuracion de contenedores se documenta en SDD antes de implementar archivos Docker.
- Los desarrolladores pueden levantar el stack con un comando (`docker compose`).
- Las variables de entorno se centralizan en `.env.development` / `.env.development.example` (dev) y `.env.production` (futuro).
- El scaffold del monorepo incluira Dockerfiles y compose como parte del entregable.

## Referencias

- `docs/13-arquitectura-monorepo.md`
- `docs/14-infraestructura-docker.md`
