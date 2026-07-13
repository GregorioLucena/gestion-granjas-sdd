# Cierre del Diseno Tecnico — MVP v1

Este documento cierra la fase de diseno tecnico previa al scaffold e implementacion.

## Estado

**Cierre historico del diseno inicial.** El scaffold ya fue implementado; para estado actual
usar `06-cierre-sdd.md`. Arquitectura y autenticacion vigentes: ADR `0007`.

## Documentos de diseno completados

| Documento | Contenido |
|-----------|-----------|
| `decisions/0006-stack-tecnologico.md` | Stack base; backend/auth superados por ADR `0007` |
| `07-diseno-tecnico-inicial.md` | Arquitectura, modelo, permisos, API, UI, reglas criticas |
| `08-convenciones-implementacion.md` | Nomenclatura, modulos, servicios, UI, testing |
| `09-catalogo-errores.md` | Codigos de error, HTTP, mensajes al usuario |
| `11-guia-ux-ui.md` | Direccion visual elegante, divertida, llamativa y mobile-first |
| `12-convenciones-git-y-calidad.md` | Ramas, commits, componentes y criterios de calidad |
| `.cursor/rules/` | Reglas persistentes para IA (SDD, stack, git, UX, servicios) |
| `src/database/entities/` | Entidades TypeORM MVP v1 |
| `13-arquitectura-monorepo.md` | Monorepo api + web + packages |
| `14-infraestructura-docker.md` | Spec Docker Compose (pendiente implementacion) |
| `decisions/0008-docker-contenedores.md` | Decision Docker |

## Checklist de cierre

### Arquitectura y stack
- [x] Stack tecnologico definido y documentado
- [x] Estructura de carpetas definida
- [x] Capas (UI, API, servicios, BD) definidas
- [x] Multi-tenancy (compania + granja) definido

### Modelo de datos
- [x] Entidades MVP v1 modeladas
- [x] Enums de dominio definidos
- [x] Auditoria y anulacion reflejadas en entidades
- [x] Estrategia de migraciones TypeORM definida

### Seguridad
- [x] JWT + refresh HttpOnly en NestJS definido
- [x] TenantContext definido
- [x] Convencion de permisos definida
- [x] Catalogo de permisos MVP v1 identificado

### API y errores
- [x] Formato de respuesta definido
- [x] Codigos HTTP definidos
- [x] Endpoints MVP v1 listados
- [x] Catalogo de errores por modulo

### Implementacion
- [x] Convenciones de nomenclatura
- [x] Estructura de modulos
- [x] Patron de servicios y transacciones
- [x] Validacion Zod
- [x] Convenciones UI mobile-first
- [x] Guia UX/UI con identidad visual definida
- [x] Convenciones de ramas, commits y calidad de codigo
- [x] Cursor rules en `.cursor/rules/` (5 reglas operativas)
- [x] Estrategia minima de testing

### Pendiente (fase scaffold)
- [ ] Monorepo reorganizado (`apps/`, `packages/`)
- [ ] Proyecto Next.js en `apps/web`
- [ ] Proyecto NestJS en `apps/api`
- [ ] Archivos Docker segun `14-infraestructura-docker.md`
- [ ] `.env.example` configurado
- [ ] Migracion inicial generada
- [ ] Seed ejecutado
- [ ] Login funcional

## Flujo completo hasta ahora

```text
SDD funcional (cerrado)     → docs/00-06, specs, decisions
Diseno tecnico (cerrado)    → docs/07-12, entidades TypeORM
Scaffold + implementacion   → siguiente fase
```

## Orden de trabajo post-scaffold

1. Configurar Next.js + TypeScript + Tailwind + shadcn/ui.
2. Integrar TypeORM + PostgreSQL + migracion inicial.
3. Implementar `lib/errors.ts`, `lib/tenant.ts`, `lib/permissions.ts` segun docs 08 y 09.
4. JWT en NestJS + login + TenantContext.
5. Seed de permisos, perfiles y datos demo.
6. Sprint 2 en adelante segun `07-diseno-tecnico-inicial.md`.

## Regla de avance a implementacion

Un modulo puede implementarse cuando:

- Existe spec funcional con criterios de aceptacion.
- Existen entidades TypeORM relacionadas.
- Estan definidos permisos, errores, UX, Git y convenciones (docs 08, 09, 11 y 12).
- El diseno tecnico esta cerrado (este documento).

## Veredicto

No se requiere documentacion tecnica adicional antes del scaffold del MVP v1. Cualquier detalle no cubierto se resuelve al implementar el primer modulo siguiendo las convenciones establecidas.
