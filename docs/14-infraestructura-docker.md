# Infraestructura Docker — MVP v1

Este documento especifica como se dockeriza el monorepo. Complementa `13-arquitectura-monorepo.md` y la decision `decisions/0008-docker-contenedores.md`.

## Objetivo

Definir contenedores, redes, variables, volúmenes y comandos para desarrollo local reproducible antes de crear los archivos Docker en el repositorio.

## Alcance MVP v1

Incluye:

- PostgreSQL en contenedor.
- API NestJS en contenedor con hot reload (desarrollo).
- Web Next.js en contenedor con hot reload (desarrollo).
- Red interna entre servicios.
- Volumen persistente para datos de PostgreSQL.
- Health checks basicos.
- Variables de entorno documentadas.

No incluye en MVP v1:

- Despliegue en cloud (AWS, Azure, etc.).
- Kubernetes.
- CI/CD con Docker (fase posterior).
- Reverse proxy Nginx/Traefik (fase posterior).
- SSL/TLS en local.

## Flujos soportados

El proyecto debe levantar de dos formas en desarrollo:

- **Local:** `pnpm dev` levanta PostgreSQL en Docker (via `predev`) y corre API/Web en el host.
- **Docker completo:** `pnpm docker:dev` levanta PostgreSQL, API NestJS y Web Next.js en contenedores con hot reload.

El mismo `.env.development` usa `DATABASE_URL=...@localhost:5432` para el flujo local. En `docker-compose.dev.yml`, el servicio `api` sobrescribe esa variable a `...@postgres:5432` porque dentro de la red Docker el hostname correcto es el servicio `postgres`.

```bash
# Local: DB en Docker + api/web con pnpm (un solo comando)
pnpm dev

# Docker dev completo
pnpm docker:dev

# Stack completo (deploy / pruebas de imagen)
docker compose --env-file .env.production -f docker-compose.yml up --build
```

## Diagrama de servicios

```text
                    ┌─────────────────────────────────────┐
                    │         Docker Compose               │
                    │                                      │
  Browser ─────────►│  web (Next.js) :3000                 │
                    │       │                              │
                    │       │ HTTP REST                    │
                    │       ▼                              │
                    │  api (NestJS) :3001                  │
                    │       │                              │
                    │       │ TypeORM                        │
                    │       ▼                              │
                    │  postgres :5432                      │
                    │       │                              │
                    │  volume: postgres_data               │
                    └─────────────────────────────────────┘
```

## Servicios

### postgres

| Campo | Valor |
|-------|-------|
| Imagen | `postgres:16-alpine` |
| Puerto host | `5432` |
| Base de datos | `gestion_granjas` |
| Usuario | `postgres` |
| Contrasena (dev) | `postgres` |
| Volumen | `postgres_data:/var/lib/postgresql/data` |
| Health check | `pg_isready -U postgres` |

### api

| Campo | Valor |
|-------|-------|
| Build | `Dockerfile.dev` (contexto: raiz del monorepo) |
| Puerto host | `3001` |
| Comando dev | `pnpm --filter @gestion-granjas/api dev` |
| Depende de | `postgres` (healthy) |
| Volumenes dev | codigo montado + volumenes Linux para `node_modules`, `apps/*/node_modules` y `dist` de api |

Variables:

| Variable | Valor dev (ejemplo) |
|----------|---------------------|
| `DATABASE_URL` | `postgresql://postgres:postgres@postgres:5432/gestion_granjas` |
| `JWT_SECRET` | valor en `.env.development` (no commitear) |
| `JWT_EXPIRES_IN` | `8h` |
| `PORT` | `3001` |
| `CORS_ORIGIN` | `http://localhost:3000` |
| `NODE_ENV` | `development` |

### web

| Campo | Valor |
|-------|-------|
| Build | `Dockerfile.dev` (contexto: raiz del monorepo) |
| Puerto host | `3000` |
| Comando dev | `pnpm --filter @gestion-granjas/web dev` |
| Depende de | `api` |
| Volumenes dev | codigo montado + volumenes Linux para `node_modules`, `apps/*/node_modules` y `.next` |

Variables:

| Variable | Valor dev (ejemplo) |
|----------|---------------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001/api` |
| `NODE_ENV` | `development` |

**Nota:** desde el navegador del host, la API se accede por `localhost:3001`. Dentro de la red Docker, la API usa hostname `api`.

## Red

- Red bridge de desarrollo: `gestion-granjas-dev-network`.
- `web` → `api`: `http://api:3001` (solo si web hace SSR server-side hacia api).
- `api` → `postgres`: `postgres:5432`.

## Archivos a crear (implementacion)

```text
gestion-granjas/
├── docker-compose.yml           # produccion / preview
├── docker-compose.dev.yml       # desarrollo con hot reload
├── pnpm-workspace.yaml          # workspaces pnpm
├── pnpm-lock.yaml               # lockfile (versionado)
├── .dockerignore
├── .env.development.example     # plantilla de variables de desarrollo
├── .env.development             # desarrollo (no commitear; crear desde example)
├── scripts/
│   └── docker-entrypoint-dev.sh # build inicial de paquetes internos
├── apps/
│   ├── api/
│   │   └── Dockerfile
│   └── web/
│       └── Dockerfile
```

## Comandos objetivo

| Comando | Accion |
|---------|--------|
| `pnpm dev` | Levantar PostgreSQL (predev) + API y Web en el host |
| `pnpm docker:db` | Levantar solo PostgreSQL |
| `pnpm docker:db:down` | Detener PostgreSQL y la red dev |
| `pnpm docker:dev` | Levantar stack dev completo |
| `docker compose --env-file .env.development -f docker-compose.dev.yml up --build` | Levantar stack dev |
| `docker compose --env-file .env.development -f docker-compose.dev.yml down` | Detener stack |
| `docker compose --env-file .env.development -f docker-compose.dev.yml down -v` | Detener y borrar volumen BD |
| `docker compose --env-file .env.development -f docker-compose.dev.yml logs -f api` | Logs de API |
| `docker compose --env-file .env.development -f docker-compose.dev.yml exec api pnpm db:migrate` | Migraciones |

En `package.json` root:

```json
{
  "scripts": {
    "predev": "pnpm run docker:db",
    "docker:db": "docker compose --env-file .env.development -f docker-compose.dev.yml up -d postgres",
    "docker:db:down": "docker compose --env-file .env.development -f docker-compose.dev.yml down",
    "docker:dev": "docker compose --env-file .env.development -f docker-compose.dev.yml up --build",
    "docker:dev:detached": "docker compose --env-file .env.development -f docker-compose.dev.yml up --build -d",
    "docker:down": "docker compose --env-file .env.development -f docker-compose.dev.yml down",
    "docker:logs": "docker compose --env-file .env.development -f docker-compose.dev.yml logs -f"
  }
}
```

## Estrategia de imagenes

### Desarrollo (`Dockerfile.dev`)

- Base: `node:22-alpine`.
- Contexto de build: **raiz del monorepo** (necesita workspaces pnpm).
- Activar Corepack y usar **pnpm** (`pnpm install --frozen-lockfile` en root).
- Copiar `pnpm-workspace.yaml` y `pnpm-lock.yaml` antes del install.
- Montar codigo como volumen para hot reload.
- **Entrypoint dev:** `pnpm install` (symlinks Linux del workspace) + compila `database` + `shared`; luego arranca Nest/Next.
- **`packages/*/dist` en bind mount:** no usar volumen separado para `dist` de paquetes internos; si no, TypeScript resuelve el paquete via symlink del host y no ve el `dist` generado en el volumen.
- **`deleteOutDir: false` en Nest:** en Docker, `/app/apps/api/dist` es un volumen montado; Nest no puede hacer `rmdir` sobre un mount point (`EBUSY`).
- Si cambia `pnpm-lock.yaml`: `docker compose build --no-cache` y borrar volumen `dev_root_node_modules`.
- No optimizar tamano; priorizar velocidad de iteracion.

### Produccion (`Dockerfile`)

- Multi-stage build.
- Stage 1: install + build.
- Stage 2: imagen minima solo con artefactos (`node:22-alpine`).
- Sin volumenes de codigo fuente.
- Variables sensibles via entorno, nunca en imagen.

## Migraciones y seed

Orden al iniciar API (entrypoint opcional):

1. Esperar PostgreSQL healthy.
2. Ejecutar `pnpm db:migrate` (o `pnpm --filter @gestion-granjas/database db:migration:run`).
3. Ejecutar `pnpm db:seed` (solo dev / primera vez).
4. Iniciar NestJS.

En desarrollo, migraciones pueden ejecutarse manualmente para mas control.

## `.env.development` (desarrollo)

Plantilla versionada: `.env.development.example`. Copiar antes de levantar el stack:

```bash
cp .env.development.example .env.development
```

```env
# PostgreSQL local (host)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=gestion_granjas
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/gestion_granjas

# API
JWT_SECRET=change-me-generate-with-openssl
JWT_EXPIRES_IN=8h
API_PORT=3001
PORT=3001
CORS_ORIGIN=http://localhost:3000

# Web
WEB_PORT=3000
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# General
NODE_ENV=development
```

Para `pnpm dev`, `DATABASE_URL` debe apuntar a `localhost`. Para Docker completo, `docker-compose.dev.yml` sobrescribe esa variable dentro de `api` a `postgres:5432`.

## Reglas

- No commitear `.env.development` con secretos reales.
- Usar **pnpm** como unico gestor de paquetes (no npm/yarn).
- Commitear `pnpm-lock.yaml` para builds reproducibles en Docker y CI.
- `JWT_SECRET` distinto en produccion.
- Puerto 5432 expuesto solo en dev local; en produccion BD no debe ser publica.
- Los Dockerfiles se versionan; las imagenes no.

## Criterios de aceptacion

- [ ] `docker compose -f docker-compose.dev.yml up --build` levanta postgres, api y web sin errores.
- [ ] `GET http://localhost:3001/api/health` responde OK.
- [ ] `http://localhost:3000` carga la web.
- [ ] API conecta a PostgreSQL dentro de la red Docker.
- [ ] Datos de PostgreSQL persisten al reiniciar contenedores (volumen).
- [ ] Hot reload funciona al editar codigo en dev (api y web).
- [ ] Documentacion `.env.development.example` coincide con variables usadas.

## Relacion con SDD

| Documento | Rol |
|-----------|-----|
| `0007-monorepo-backend-frontend.md` | Que servicios existen |
| `0008-docker-contenedores.md` | Decision de usar Docker |
| Este documento | Como se implementa Docker |
| Specs funcionales | No cambian; Docker es infraestructura |

## Orden de implementacion

1. Completar monorepo (`apps/`, `packages/`).
2. Crear archivos Docker segun esta spec.
3. Probar stack dev local.
4. Actualizar README con comandos Docker.
5. Continuar sprint 1 (auth, login) sobre stack dockerizado.

## Veredicto

**La especificacion Docker esta definida en SDD.** La implementacion de archivos `Dockerfile` y `docker-compose` es el siguiente paso tecnico, despues de cerrar/reorganizar el monorepo.
