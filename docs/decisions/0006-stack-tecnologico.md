# ADR 0006: Stack tecnologico

## Estado

Aceptado, con arquitectura full-stack y autenticacion superadas por ADR `0007`.

## Contexto

El sistema debe usarse desde el campo, incluyendo telefonos moviles. Por ahora se prioriza una aplicacion web responsive accesible desde el navegador del telefono. En el futuro podria existir una app movil nativa, pero no forma parte del MVP v1.

Requisitos relevantes:

- Multi-compania y multi-granja.
- Formularios frecuentes en campo (consumo, pesos, bajas).
- Consultas de inventario y reportes basicos.
- Seguridad por usuario, perfil y granja.
- Proyecto en fase SDD con MVP acotado.
- Un solo desarrollador o equipo pequeno al inicio.

## Decision

Adoptar una aplicacion web **mobile-first** con la siguiente stack:

| Capa | Tecnologia | Motivo |
|------|------------|--------|
| Web | **Next.js** (App Router) | Aplicacion responsive y mobile-first |
| Lenguaje | **TypeScript** | Tipado compartido entre UI, validacion y BD |
| Base de datos | **PostgreSQL** | Relacional, robusta para multi-tenant y eventos historicos |
| ORM | **TypeORM** | Entidades TypeScript, migraciones, repositorios; alineado con NestJS si el backend crece |
| UI | **React** + **Tailwind CSS** + **shadcn/ui** | Componentes responsive, accesibles y consistentes |
| Formularios | **React Hook Form** + **Zod** | Validacion compartida cliente/servidor, buena UX en movil |
| Datos en cliente | **TanStack Query** | Cache, revalidacion y estados de carga en pantallas moviles |
| Autenticacion | **JWT en NestJS** | Decision vigente definida en ADR `0007` |
| Testing inicial | **Vitest** | Pruebas unitarias de reglas de negocio criticas |

## Enfoque mobile-first (web responsive)

### Principios de UI para uso en granja

- Diseno **mobile-first**: pantallas pensadas primero para telefono y adaptadas a tablet/escritorio.
- Formularios cortos, campos grandes y botones faciles de tocar.
- Navegacion simple con pocos niveles de profundidad.
- Tablas convertidas a listas/cards en pantallas pequenas.
- Feedback claro de guardado, error y confirmacion.

### PWA (Progressive Web App) — fase posterior al MVP v1

No es requisito del MVP v1, pero la arquitectura lo permitira:

- Instalar acceso directo en la pantalla del telefono.
- Icono propio como una app.
- Posibilidad futura de cache limitado para consultas offline.

Esto cubre la necesidad actual sin desarrollar app nativa todavia.

## Preparacion para app movil nativa futura

Aunque el MVP v1 sera web, la arquitectura debe facilitar una app nativa despues:

1. **Capa de API explicita**: la logica de negocio vive en modulos/servicios, no en componentes React. Las Route Handlers de Next.js actuan como fachada HTTP.
2. **Contratos estables**: entradas y salidas validadas con Zod. Facilita documentar y consumir la API desde React Native, Flutter u otra app.
3. **Autenticacion extensible**: MVP v1 usa sesiones web (cookies). Para app nativa futura se agregara autenticacion por token (JWT o similar) sin reescribir la logica de permisos.
4. **Sin logica de negocio en el cliente**: el telefono solo presenta datos y envia formularios; las reglas viven en el servidor.

### Camino futuro recomendado para app nativa

```text
Fase 1 (ahora): Web responsive + PWA opcional
Fase 2: API REST documentada + tokens para movil
Fase 3: App nativa (React Native u otra) consumiendo la misma API
```

No se descarta extraer el backend a **NestJS** en el futuro si el proyecto crece mucho, pero no es necesario para el MVP.

### Prisma

**Pros**: schema declarativo, DX excelente, migraciones simples.
**Contras**: preferencia del equipo por TypeORM; menor alineacion con NestJS si el backend se separa.
**Descartado** por decision del proyecto.

### TypeORM (elegido)

**Pros**: entidades como clases TypeScript, repositorios, migraciones, compatible con NestJS y Next.js.
**Contras**: mas configuracion inicial que Prisma; migraciones requieren disciplina.

## Alternativas consideradas

### NestJS + React separados

**Pros**: separacion clara backend/frontend, ideal para app movil desde el dia 1.
**Contras**: mas boilerplate, dos proyectos, mayor tiempo hasta el primer entregable.
**Descartado para MVP v1** por costo de arranque. Queda como evolucion posible.

### SPA pura (Vite + React) + API separada

**Pros**: frontend ligero.
**Contras**: hay que montar API, auth y despliegue por separado desde cero.
**Descartado** porque Next.js cubre frontend + API con menos friccion.

### Low-code / no-code

**Descartado** porque el dominio es especifico, multi-tenant y requiere trazabilidad historica que no se modela bien con herramientas genericas.

## Estructura de proyecto sugerida

```text
src/
  app/                  # Rutas Next.js (UI + Route Handlers)
  modules/              # Logica de negocio por dominio
    companias/
    granjas/
    lotes/
    inventario/
    ...
  lib/                  # Utilidades compartidas (auth, permisos, db)
  components/           # Componentes UI reutilizables
src/database/
  data-source.ts        # Configuracion TypeORM
  entities/             # Entidades del dominio MVP v1
  migrations/           # Migraciones de base de datos
  seeds/                # Datos iniciales
```

## Implicaciones

- Todas las pantallas del MVP v1 deben probarse en viewport movil (375px minimo).
- Los permisos y filtros multi-granja se implementan en la capa de servicios, no solo en UI.
- Las validaciones Zod deben reutilizarse en formulario y API.
- El despliegue inicial puede ser Vercel + PostgreSQL gestionado (Neon, Supabase, Railway, etc.).

## Consecuencias

- Arranque rapido con una sola codebase.
- Buena experiencia en telefono sin app nativa inicial.
- Camino claro hacia PWA y app movil nativa.
- Dependencia de Next.js como framework principal.
- Dependencia de TypeORM para acceso a datos y migraciones.
- JWT en una API NestJS permite clientes web y una app nativa futura.

## Historial de cambios

- 2026-06-14: ORM cambiado de Prisma a TypeORM por preferencia del proyecto.
