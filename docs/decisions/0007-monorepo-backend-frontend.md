# ADR 0007: Monorepo con backend y frontend separados

## Estado

Aceptado.

## Contexto

El proyecto inicio con un enfoque de monolito Next.js full-stack. Antes de continuar el scaffold, se decidio separar backend y frontend para:

- Tener responsabilidades claras entre API y UI.
- Facilitar evolucion hacia app movil nativa consumiendo la misma API.
- Permitir despliegues independientes si hiciera falta.
- Mantener un solo repositorio con codigo compartido (entidades, tipos, validaciones).

## Decision

Adoptar un **monorepo pnpm workspaces** con esta estructura:

```text
gestion-granjas/
├── apps/
│   ├── api/                 # Backend REST (NestJS)
│   └── web/                 # Frontend (Next.js)
├── packages/
│   ├── database/            # TypeORM: entidades, migraciones, enums
│   └── shared/              # Tipos, Zod schemas, errores, constantes
├── docs/
├── pnpm-workspace.yaml      # definicion de workspaces
├── pnpm-lock.yaml           # lockfile versionado
└── package.json             # root del monorepo
```

### Gestor de paquetes — pnpm

| Aspecto | Decision |
|---------|----------|
| Gestor | **pnpm** (via Corepack) |
| Workspaces | `pnpm-workspace.yaml` |
| Instalacion | `pnpm install` en la raiz |
| Ejecutar en un paquete | `pnpm --filter @gestion-granjas/api <script>` |
| Version fijada | campo `packageManager` en `package.json` root |

**No usar npm ni yarn** en este repositorio. Corepack (incluido en Node.js 16.13+) activa la version de pnpm declarada en `packageManager`.

### Backend — `apps/api`

| Aspecto | Tecnologia |
|---------|------------|
| Framework | NestJS |
| ORM | TypeORM (via `@gestion-granjas/database`) |
| Auth | JWT (access token) + refresh token en MVP v1 |
| API | REST JSON |
| Validacion | class-validator + Zod compartido donde aplique |

Responsabilidades:

- Logica de negocio y servicios.
- Autenticacion y autorizacion (tenant, permisos).
- Persistencia y transacciones.
- Exponer endpoints REST documentados.

### Frontend — `apps/web`

| Aspecto | Tecnologia |
|---------|------------|
| Framework | Next.js (App Router) |
| UI | React + Tailwind + shadcn/ui |
| Datos | TanStack Query consumiendo `apps/api` |
| Formularios | React Hook Form + Zod (`@gestion-granjas/shared`) |

Responsabilidades:

- UI mobile-first.
- Consumir API REST.
- Gestion de sesion/token en cliente.
- No contiene logica de negocio ni acceso directo a BD.

### Paquetes compartidos

**`packages/database`**

- Entidades TypeORM.
- Enums de dominio.
- DataSource y migraciones.
- Usado solo por `apps/api` en runtime (web no accede a BD).

**`packages/shared`**

- Tipos/DTOs compartidos.
- Schemas Zod reutilizables.
- Codigos de error y constantes de permisos.
- Usado por `api` y `web`.

## Comunicacion front ↔ back

```text
Browser / Movil
    ↓ HTTPS
apps/web (Next.js)
    ↓ REST + JWT
apps/api (NestJS)
    ↓ TypeORM
packages/database → PostgreSQL
```

### Auth MVP v1

1. `POST /api/auth/login` → retorna access token (+ refresh opcional).
2. Web guarda token (httpOnly cookie o storage seguro segun implementacion).
3. Cada request incluye `Authorization: Bearer <token>`.
4. API valida token, construye `TenantContext`, aplica permisos.

Esto prepara app movil futura sin depender de Auth.js/sesiones Next.js.

## Alternativas consideradas

### Monolito Next.js (descartado)

**Pros:** mas rapido al inicio.
**Contras:** mezcla UI y backend; dificulta app movil nativa.

### Dos repositorios separados (descartado)

**Pros:** separacion maxima.
**Contras:** duplicacion de tipos/schemas; mas friccion para equipo pequeno.

### Monorepo Turborepo (pospuesto)

**Pros:** builds cacheados, pipelines optimizados.
**Contras:** complejidad extra innecesaria en MVP v1. Se puede agregar despues.

## Consecuencias

- El scaffold parcial de monolito en raiz se reemplaza por workspaces.
- `docs/07-diseno-tecnico-inicial.md` y rules deben reflejar capas api/web/packages.
- Auth pasa de Auth.js en Next a JWT en NestJS.
- `0006-stack-tecnologico.md` queda parcialmente superseded en arquitectura; ver este ADR.

## Historial

- 2026-06-14: Separacion backend/frontend en monorepo npm workspaces.
- 2026-06-14: Gestor de paquetes definido como **pnpm workspaces** (supersede npm en este ADR).
