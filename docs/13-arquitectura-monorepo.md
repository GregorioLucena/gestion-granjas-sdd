# Arquitectura Monorepo — Backend + Frontend

Este documento describe la estructura del monorepo. Ver decision en `decisions/0007-monorepo-backend-frontend.md`.

## Vision general

```text
┌─────────────────────────────────────────────────────────┐
│                    apps/web (Next.js)                    │
│  UI mobile-first · TanStack Query · sin acceso a BD      │
└───────────────────────────┬─────────────────────────────┘
                            │ REST / JSON / JWT
┌───────────────────────────▼─────────────────────────────┐
│                   apps/api (NestJS)                      │
│  Modulos · servicios · guards · permisos · transacciones │
└───────────────────────────┬─────────────────────────────┘
                            │ TypeORM
┌───────────────────────────▼─────────────────────────────┐
│              packages/database + PostgreSQL              │
└─────────────────────────────────────────────────────────┘

         packages/shared ← tipos, Zod, errores (api + web)
```

## Estructura de carpetas

```text
gestion-granjas/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── auth/
│   │   │   ├── companias/
│   │   │   ├── granjas/
│   │   │   ├── lotes/
│   │   │   ├── inventario/
│   │   │   ├── consumo/
│   │   │   ├── engorde/
│   │   │   ├── pesos/
│   │   │   ├── reportes/
│   │   │   └── common/          # guards, filters, interceptors
│   │   ├── test/
│   │   └── package.json
│   │
│   └── web/
│       ├── src/
│       │   ├── app/
│       │   │   ├── (auth)/login/
│       │   │   ├── (app)/dashboard/
│       │   │   └── layout.tsx
│       │   ├── components/
│       │   ├── lib/             # api client, auth client
│       │   └── hooks/
│       └── package.json
│
├── packages/
│   ├── database/
│   │   ├── src/
│   │   │   ├── entities/
│   │   │   ├── enums.ts
│   │   │   ├── data-source.ts
│   │   │   ├── migrations/
│   │   │   └── seeds/
│   │   └── package.json
│   │
│   └── shared/
│       ├── src/
│       │   ├── errors/
│       │   ├── schemas/
│       │   ├── types/
│       │   └── permissions/
│       └── package.json
│
├── docs/
├── .cursor/
├── pnpm-workspace.yaml          # workspaces pnpm
├── pnpm-lock.yaml               # lockfile (versionado)
├── package.json                 # root del monorepo
└── README.md
```

## Responsabilidades por capa

| Capa | Hace | No hace |
|------|------|---------|
| `apps/web` | UI, forms, cache, llamadas HTTP | Reglas de negocio, SQL, permisos finales |
| `apps/api` | REST, auth, servicios, transacciones | Renderizar HTML |
| `packages/database` | Entidades, migraciones | Logica de negocio |
| `packages/shared` | Contratos compartidos | I/O, persistencia |

## Modulos NestJS (api) ↔ Specs SDD

| Modulo API | Spec SDD |
|------------|----------|
| `auth` + `usuarios` | `001-usuarios-perfiles.md` |
| `companias` + `granjas` | `000-configuracion-base.md` |
| `lotes` | `003-gestion-lotes.md` |
| `ubicaciones` | `006-movimientos-ubicacion.md` |
| `inventario` | `005-inventario-alimentos.md` |
| `consumo` | `007-consumo-alimento.md` |
| `engorde` | `012-engorde-lotes.md` |
| `pesos` | `013-controles-peso.md` |
| `reportes` | `015`, `017` |

## Cliente API en web

```typescript
// apps/web/src/lib/api-client.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getAccessToken(); // desde cookie/storage
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  // parse { data } / { error }
}
```

## Variables de entorno

Archivo unico de desarrollo en la raiz del monorepo:

| Archivo | Uso |
|---------|-----|
| `.env.development.example` | Plantilla versionada (commitear) |
| `.env.development` | Valores reales de dev (no commitear) |

```bash
cp .env.development.example .env.development
```

- **Docker dev:** `pnpm docker:dev` carga `.env.development` via `--env-file`.
- **pnpm dev local:** scripts root usan `dotenv-cli` con `.env.development`.
- **Sin Docker:** descomentar `DATABASE_URL` con `localhost` en `.env.development`.

Produccion (futuro): `.env.production` / `.env.production.example`.

### Referencia por servicio (legacy)

Los valores viven en `.env.development`; no hace falta duplicar en cada app.

```env
# apps/api — DATABASE_URL, JWT_SECRET, PORT, CORS_ORIGIN
# apps/web — NEXT_PUBLIC_API_URL
```

## Gestor de paquetes (pnpm)

El monorepo usa **pnpm workspaces**, no npm ni yarn.

| Requisito | Detalle |
|-----------|---------|
| Node.js | 22+ |
| pnpm | Activado via Corepack: `corepack enable` |
| Instalacion | `pnpm install` en la raiz |
| Lockfile | `pnpm-lock.yaml` (commitear siempre) |

Comandos frecuentes con filtro de workspace:

```bash
pnpm --filter @gestion-granjas/api dev
pnpm --filter @gestion-granjas/web dev
pnpm --filter @gestion-granjas/database db:migration:run
```

Dependencias internas entre paquetes del monorepo usan el protocolo `workspace:*` en `package.json` (convencion pnpm).

## Compilacion de paquetes internos

`packages/database` y `packages/shared` compilan a `dist/` y se consumen desde `apps/api` via `exports` del paquete (sin path aliases a fuentes).

```bash
pnpm build:packages
pnpm --filter @gestion-granjas/api dev   # predev compila paquetes automaticamente
```

## Scripts root (pnpm)

| Script | Accion |
|--------|--------|
| `pnpm dev` | Levanta api + web en paralelo |
| `pnpm dev:api` | Solo backend |
| `pnpm dev:web` | Solo frontend |
| `pnpm build:packages` | Compila `database` + `shared` a dist |
| `pnpm build` | Paquetes + api + web |
| `pnpm db:migrate` | Migraciones via packages/database |
| `pnpm db:seed` | Seed inicial |

## Orden de scaffold (actualizado)

1. Configurar monorepo root (`pnpm-workspace.yaml`, `package.json`, `pnpm install`).
2. Mover entidades a `packages/database`.
3. Crear `packages/shared` con errores y tipos base.
4. Scaffold `apps/api` (NestJS + TypeORM).
5. Scaffold `apps/web` (Next.js + Tailwind + shadcn).
6. Implementar Docker segun `14-infraestructura-docker.md`.
7. Conectar web → api (health check, login).
8. Migracion inicial + seed.

## Criterios de aceptacion arquitectura

- [ ] `apps/web` no importa TypeORM ni entidades de BD.
- [ ] `apps/api` concentra toda la logica de negocio.
- [ ] `packages/shared` usado por api y web sin dependencias circulares.
- [ ] App movil futura puede consumir `apps/api` sin cambios de contrato.

## Docker

Ver `14-infraestructura-docker.md` y `decisions/0008-docker-contenedores.md`.
